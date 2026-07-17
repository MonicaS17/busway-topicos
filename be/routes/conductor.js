const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const Usuario = require('../models/Usuario');
const Vehiculo = require('../models/Vehiculo');
const Estudiante = require('../models/Estudiante');
const Ruta = require('../models/Ruta');
const Viaje = require('../models/Viaje');

async function conductorAutenticado(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) res.status(404).json({ error: 'Conductor no encontrado' });
  else if (usuario.tipo !== 'conductor') res.status(403).json({ error: 'Acceso exclusivo para conductores' });
  else return usuario;
  return null;
}

function serializarRuta(ruta) {
  const paradas = ruta.paradas || [];
  const puntos = ruta.puntos_trayectoria?.length
    ? ruta.puntos_trayectoria
    : paradas.map((parada) => ({
      lat: parada.latitud,
      lng: parada.longitud,
      descripcion: parada.referencia || '',
    }));

  return {
    ...ruta,
    escuela: ruta.escuela || ruta.escuelas?.join(', ') || 'No registrada',
    zona: ruta.zona || 'No registrada',
    frecuencia: ruta.frecuencia || ruta.horario_inicio || 'No registrada',
    puntos_trayectoria: puntos,
    estado: ruta.estado || (ruta.activa === false ? 'inactiva' : 'activa'),
    createdAt: ruta.createdAt || ruta.fecha_creacion || null,
  };
}

// GET perfil del conductor + vehículo (autenticado)
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await conductorAutenticado(req, res);
    if (!usuario) return;
    const vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    res.json({ usuario, vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET perfil del conductor por ID (para padres)
router.get('/:id/perfil', verifyToken, async (req, res) => {
  try {
    const conductor = await Usuario.findOne({ _id: req.params.id, tipo: 'conductor' })
      .select('nombre apellido correo telefono foto_perfil datos_conductor');
    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }
    const vehiculo = await Vehiculo.findOne({ conductor_id: conductor._id });
    res.json({ conductor, vehiculo });
  } catch (error) {
    console.error('Error al obtener perfil del conductor:', error);
    res.status(500).json({ error: 'Error al obtener perfil del conductor' });
  }
});

// GET estudiantes del conductor autenticado
router.get('/estudiantes', verifyToken, async (req, res) => {
  try {
    const usuario = await conductorAutenticado(req, res);
    if (!usuario) return;
    const estudiantes = await Estudiante.find({ conductor_id: usuario._id })
      .populate('padre_id', 'nombre apellido correo ubicacion')
      .populate('ruta_id', 'nombre escuela zona')
      .sort({ nombre: 1 });

    const mappedEst = estudiantes.map(est => {
      const estDoc = est.toObject();
      if (est.padre_id) {
        estDoc.lat = est.padre_id.ubicacion?.lat || estDoc.lat || null;
        estDoc.lng = est.padre_id.ubicacion?.lng || estDoc.lng || null;
        
        const parts = [
          est.padre_id.ubicacion?.provincia,
          est.padre_id.ubicacion?.distrito,
          est.padre_id.ubicacion?.corregimiento,
          est.padre_id.ubicacion?.numero_casa
        ].filter(Boolean);
        estDoc.direccion = parts.length > 0 ? parts.join(', ') : (estDoc.direccion || 'Sin ubicación de recogida');
        estDoc.zona = est.padre_id.ubicacion?.corregimiento || 'Sin corregimiento';
      }
      return estDoc;
    });

    res.json({ estudiantes: mappedEst });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET rutas del conductor — alias plural para el mobile
router.get('/rutas', verifyToken, async (req, res) => {
  try {
    const usuario = await conductorAutenticado(req, res);
    if (!usuario) return;
    const rutas = await Ruta.find({ conductor_id: usuario._id });
    
    const Estudiante = require('../models/Estudiante');
    const rutasMapped = [];
    for (const r of rutas) {
      const doc = r.toObject();
      doc.totalEstudiantes = await Estudiante.countDocuments({ conductor_id: usuario._id, ruta_id: r._id });
      if (doc.horario_salida && doc.horario_llegada) {
        doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
      } else {
        doc.horario = doc.horario || '6:30 AM — 7:15 AM';
      }
      rutasMapped.push(doc);
    }
    res.json({ rutas: rutasMapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ruta del conductor autenticado (lista y primer elemento)
router.get('/ruta', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const rutas = await Ruta.find({ conductor_id: usuario._id }).populate('escuela_id');

    const rutasMapped = [];
    for (const r of rutas) {
      const doc = r.toObject();
      doc.totalEstudiantes = await Estudiante.countDocuments({ conductor_id: usuario._id, ruta_id: r._id });
      if (doc.horario_salida && doc.horario_llegada) {
        doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
      } else {
        doc.horario = doc.horario || '6:30 AM — 7:15 AM';
      }
      rutasMapped.push(doc);
    }

    let activeRuta = null;
    if (req.query.id_ruta) {
      activeRuta = rutasMapped.find(r => String(r._id) === String(req.query.id_ruta));
    }
    if (!activeRuta) {
      activeRuta = rutasMapped.length > 0 ? rutasMapped[0] : null;
    }
    let activeEstudiantes = [];
    if (activeRuta) {
      const studentsFromDb = await Estudiante.find({ conductor_id: usuario._id, ruta_id: activeRuta._id }).populate('padre_id', 'ubicacion');
      const orderMap = {};
      const rawRuta = rutas.find(r => String(r._id) === String(activeRuta._id));
      if (rawRuta && rawRuta.estudiantes) {
        rawRuta.estudiantes.forEach(item => {
          orderMap[String(item.estudiante_id)] = item.orden;
        });
      }
      activeEstudiantes = studentsFromDb.map(student => {
        const doc = student.toObject();
        doc.orden = orderMap[String(student._id)] !== undefined ? orderMap[String(student._id)] : 999;
        if (student.padre_id) {
          doc.lat = student.padre_id.ubicacion?.lat || doc.lat || null;
          doc.lng = student.padre_id.ubicacion?.lng || doc.lng || null;
          
          const parts = [
            student.padre_id.ubicacion?.provincia,
            student.padre_id.ubicacion?.distrito,
            student.padre_id.ubicacion?.corregimiento,
            student.padre_id.ubicacion?.numero_casa
          ].filter(Boolean);
          doc.direccion = parts.length > 0 ? parts.join(', ') : (doc.direccion || 'Sin ubicación de recogida');
          doc.zona = student.padre_id.ubicacion?.corregimiento || 'Sin corregimiento';
        }
        return doc;
      }).sort((a, b) => a.orden - b.orden);
    }

    res.json({ rutas: rutasMapped, ruta: activeRuta, estudiantes: activeEstudiantes });
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    res.status(500).json({ error: 'Error interno al obtener la ruta' });
  }
});

// GET detalle de una ruta específica
router.get('/ruta/:rutaId', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findById(req.params.rutaId).populate('escuela_id');
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

    if (String(ruta.conductor_id) !== String(usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta ruta' });
    }

    const doc = ruta.toObject();
    if (doc.horario_salida && doc.horario_llegada) {
      doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
    } else {
      doc.horario = doc.horario || '6:30 AM — 7:15 AM';
    }

    const studentsFromDb = await Estudiante.find({ conductor_id: usuario._id, ruta_id: req.params.rutaId }).populate('padre_id', 'ubicacion');
    const orderMap = {};
    if (ruta.estudiantes) {
      ruta.estudiantes.forEach(item => {
        orderMap[String(item.estudiante_id)] = item.orden;
      });
    }
    const sortedStudents = sortedStudentsMapping = studentsFromDb.map(student => {
      const sDoc = student.toObject();
      sDoc.orden = orderMap[String(student._id)] !== undefined ? orderMap[String(student._id)] : 999;
      if (student.padre_id) {
        sDoc.lat = student.padre_id.ubicacion?.lat || sDoc.lat || null;
        sDoc.lng = student.padre_id.ubicacion?.lng || sDoc.lng || null;
        
        const parts = [
          student.padre_id.ubicacion?.provincia,
          student.padre_id.ubicacion?.distrito,
          student.padre_id.ubicacion?.corregimiento,
          student.padre_id.ubicacion?.numero_casa
        ].filter(Boolean);
        sDoc.direccion = parts.length > 0 ? parts.join(', ') : (sDoc.direccion || 'Sin ubicación de recogida');
        sDoc.zona = student.padre_id.ubicacion?.corregimiento || 'Sin corregimiento';
      }
      return sDoc;
    }).sort((a, b) => a.orden - b.orden);

    res.json({ ruta: doc, estudiantes: sortedStudents });
  } catch (error) {
    console.error('Error al obtener detalle de la ruta:', error);
    res.status(500).json({ error: 'Error interno al obtener detalle de la ruta' });
  }
});

// POST crear nueva ruta
router.post('/ruta', verifyToken, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Escuela = mongoose.model('escuelas');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { escuela_id, nombre_ruta, zona, horario_salida, horario_llegada, frecuencia, escuela_lat, escuela_lng, hora_salida_vuelta } = req.body;

    if (!escuela_id || !nombre_ruta || !zona || !horario_salida || !horario_llegada) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: escuela_id, nombre_ruta, zona, horario_salida, horario_llegada' });
    }

    const escuelaExiste = await Escuela.findById(escuela_id);
    if (!escuelaExiste) return res.status(400).json({ error: 'La escuela especificada no existe' });

    // Validar coincidencia provincial con la placa del bus del conductor
    const Vehiculo = require('../models/Vehiculo');
    const vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    if (!vehiculo || !vehiculo.placa) {
      return res.status(400).json({ error: 'No tienes un vehículo registrado con número de placa en BusWay.' });
    }

    const obtenerProvinciaPorPlaca = (placa) => {
      if (!placa) return null;
      const cleanPlaca = placa.trim().toUpperCase();
      const match = cleanPlaca.match(/^\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        switch (num) {
          case 1: return 'Bocas del Toro';
          case 2: return 'Coclé';
          case 3: return 'Colón';
          case 4: return 'Chiriquí';
          case 5: return 'Darién';
          case 6: return 'Herrera';
          case 7: return 'Los Santos';
          case 8: return 'Panamá';
          case 9: return 'Veraguas';
          case 10: return 'Guna Yala';
          case 11: return 'Emberá-Wounaan';
          case 12: return 'Ngäbe-Buglé';
          case 13: return 'Panamá Oeste';
          default: break;
        }
      }
      const innerMatch = cleanPlaca.match(/(?:^|[A-Z-])(\d+)(?:[A-Z-]|$)/);
      if (innerMatch) {
        const num = parseInt(innerMatch[1], 10);
        switch (num) {
          case 1: return 'Bocas del Toro';
          case 2: return 'Coclé';
          case 3: return 'Colón';
          case 4: return 'Chiriquí';
          case 5: return 'Darién';
          case 6: return 'Herrera';
          case 7: return 'Los Santos';
          case 8: return 'Panamá';
          case 9: return 'Veraguas';
          case 10: return 'Guna Yala';
          case 11: return 'Emberá-Wounaan';
          case 12: return 'Ngäbe-Buglé';
          case 13: return 'Panamá Oeste';
          default: break;
        }
      }
      return null;
    };

    const provinciaConductor = obtenerProvinciaPorPlaca(vehiculo.placa);
    if (!provinciaConductor) {
      return res.status(400).json({ error: 'El formato de tu placa de bus no corresponde a una provincia válida.' });
    }

    if (escuelaExiste.provincia !== provinciaConductor) {
      return res.status(400).json({ error: `Tu placa de colegial (${vehiculo.placa}) solo te autoriza a crear rutas en la provincia de ${provinciaConductor}. La escuela seleccionada pertenece a ${escuelaExiste.provincia}.` });
    }

    let freqArray = frecuencia || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    if (typeof freqArray === 'string') {
      if (freqArray === 'Lunes a Viernes') freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      else if (freqArray === 'Todos los días') freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      else freqArray = [freqArray];
    }

    // Verificar si ya existe una ruta del mismo conductor con colisiones de horario (salida, llegada o vuelta)
    const queryColision = {
      conductor_id: usuario._id,
      $or: [
        { horario_salida: horario_salida },
        { horario_llegada: horario_llegada }
      ]
    };
    if (hora_salida_vuelta) {
      queryColision.$or.push({ hora_salida_vuelta: hora_salida_vuelta });
    }

    const rutaExistente = await Ruta.findOne(queryColision);
    if (rutaExistente) {
      let detalleError = '';
      if (rutaExistente.horario_salida === horario_salida) {
        detalleError = `Ya tienes otra ruta con la misma hora de salida (${horario_salida}).`;
      } else if (rutaExistente.horario_llegada === horario_llegada) {
        detalleError = `Ya tienes otra ruta con la misma hora de llegada (${horario_llegada}).`;
      } else if (hora_salida_vuelta && rutaExistente.hora_salida_vuelta === hora_salida_vuelta) {
        detalleError = `Ya tienes otra ruta con la misma hora de salida de vuelta (${hora_salida_vuelta}).`;
      } else {
        detalleError = 'Ya tienes otra ruta con horarios que coinciden.';
      }
      return res.status(400).json({ error: detalleError });
    }

    const nuevaRuta = new Ruta({
      conductor_id: usuario._id,
      escuela_id,
      nombre_ruta,
      zona,
      horario_salida,
      horario_llegada,
      frecuencia: freqArray,
      estado: 'activa',
      estudiantes: [],
      escuela: escuelaExiste.nombre,
      nombre: nombre_ruta,
      escuela_lat: escuelaExiste.lat || null,
      escuela_lng: escuelaExiste.lng || null,
      hora_salida_vuelta: hora_salida_vuelta || null
    });

    await nuevaRuta.save();

    const doc = nuevaRuta.toObject();
    doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;

    res.status(201).json({ ruta: doc });
  } catch (error) {
    console.error('Error al crear ruta:', error);
    res.status(500).json({ error: 'Error interno al crear la ruta' });
  }
});

// PATCH actualizar ruta del conductor
router.patch('/ruta/:rutaId', verifyToken, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findById(req.params.rutaId);
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

    if (String(ruta.conductor_id) !== String(usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta ruta' });
    }

    const { escuela_id, nombre_ruta, escuela, zona, horario_salida, horario_llegada, frecuencia, estado, escuela_lat, escuela_lng, hora_salida_vuelta } = req.body;

    const checkSalida = horario_salida !== undefined ? horario_salida : ruta.horario_salida;
    const checkLlegada = horario_llegada !== undefined ? horario_llegada : ruta.horario_llegada;
    const checkVuelta = hora_salida_vuelta !== undefined ? hora_salida_vuelta : ruta.hora_salida_vuelta;

    const queryColision = {
      conductor_id: usuario._id,
      _id: { $ne: req.params.rutaId },
      $or: [
        { horario_salida: checkSalida },
        { horario_llegada: checkLlegada }
      ]
    };
    if (checkVuelta) {
      queryColision.$or.push({ hora_salida_vuelta: checkVuelta });
    }

    const rutaExistente = await Ruta.findOne(queryColision);
    if (rutaExistente) {
      let detalleError = '';
      if (rutaExistente.horario_salida === checkSalida) {
        detalleError = `Ya tienes otra ruta con la misma hora de salida (${checkSalida}).`;
      } else if (rutaExistente.horario_llegada === checkLlegada) {
        detalleError = `Ya tienes otra ruta con la misma hora de llegada (${checkLlegada}).`;
      } else if (checkVuelta && rutaExistente.hora_salida_vuelta === checkVuelta) {
        detalleError = `Ya tienes otra ruta con la misma hora de salida de vuelta (${checkVuelta}).`;
      } else {
        detalleError = 'Ya tienes otra ruta con horarios que coinciden.';
      }
      return res.status(400).json({ error: detalleError });
    }

    if (escuela_id !== undefined) {
      const Escuela = mongoose.model('escuelas');
      const escuelaExiste = await Escuela.findById(escuela_id);
      if (!escuelaExiste) return res.status(400).json({ error: 'La escuela especificada no existe' });

      // Validar coincidencia provincial con la placa del bus del conductor
      const Vehiculo = require('../models/Vehiculo');
      const vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
      if (!vehiculo || !vehiculo.placa) {
        return res.status(400).json({ error: 'No tienes un vehículo registrado con número de placa en BusWay.' });
      }

      const obtenerProvinciaPorPlaca = (placa) => {
        if (!placa) return null;
        const cleanPlaca = placa.trim().toUpperCase();
        const match = cleanPlaca.match(/^\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          switch (num) {
            case 1: return 'Bocas del Toro';
            case 2: return 'Coclé';
            case 3: return 'Colón';
            case 4: return 'Chiriquí';
            case 5: return 'Darién';
            case 6: return 'Herrera';
            case 7: return 'Los Santos';
            case 8: return 'Panamá';
            case 9: return 'Veraguas';
            case 10: return 'Guna Yala';
            case 11: return 'Emberá-Wounaan';
            case 12: return 'Ngäbe-Buglé';
            case 13: return 'Panamá Oeste';
            default: break;
          }
        }
        const innerMatch = cleanPlaca.match(/(?:^|[A-Z-])(\d+)(?:[A-Z-]|$)/);
        if (innerMatch) {
          const num = parseInt(innerMatch[1], 10);
          switch (num) {
            case 1: return 'Bocas del Toro';
            case 2: return 'Coclé';
            case 3: return 'Colón';
            case 4: return 'Chiriquí';
            case 5: return 'Darién';
            case 6: return 'Herrera';
            case 7: return 'Los Santos';
            case 8: return 'Panamá';
            case 9: return 'Veraguas';
            case 10: return 'Guna Yala';
            case 11: return 'Emberá-Wounaan';
            case 12: return 'Ngäbe-Buglé';
            case 13: return 'Panamá Oeste';
            default: break;
          }
        }
        return null;
      };

      const provinciaConductor = obtenerProvinciaPorPlaca(vehiculo.placa);
      if (!provinciaConductor) {
        return res.status(400).json({ error: 'El formato de tu placa de bus no corresponde a una provincia válida.' });
      }

      if (escuelaExiste.provincia !== provinciaConductor) {
        return res.status(400).json({ error: `Tu placa de colegial (${vehiculo.placa}) solo te autoriza a modificar rutas en la provincia de ${provinciaConductor}. La escuela seleccionada pertenece a ${escuelaExiste.provincia}.` });
      }

      ruta.escuela_id = escuela_id;
      ruta.escuela = escuelaExiste.nombre;
      ruta.escuela_lat = escuelaExiste.lat || null;
      ruta.escuela_lng = escuelaExiste.lng || null;
    }
    if (nombre_ruta !== undefined) { ruta.nombre_ruta = nombre_ruta; ruta.nombre = nombre_ruta; }
    if (escuela !== undefined) ruta.escuela = escuela;
    if (zona !== undefined) ruta.zona = zona;
    if (horario_salida !== undefined) ruta.horario_salida = horario_salida;
    if (horario_llegada !== undefined) ruta.horario_llegada = horario_llegada;
    if (frecuencia !== undefined) {
      let freqArray = frecuencia;
      if (typeof freqArray === 'string') {
        if (freqArray === 'Lunes a Viernes') freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        else if (freqArray === 'Todos los días') freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        else freqArray = [freqArray];
      }
      ruta.frecuencia = freqArray;
    }
    if (estado !== undefined) ruta.estado = estado;
    if (escuela_lat !== undefined && escuela_id === undefined) ruta.escuela_lat = escuela_lat;
    if (escuela_lng !== undefined && escuela_id === undefined) ruta.escuela_lng = escuela_lng;
    if (hora_salida_vuelta !== undefined) ruta.hora_salida_vuelta = hora_salida_vuelta;

    await ruta.save();

    const doc = ruta.toObject();
    if (doc.horario_salida && doc.horario_llegada) {
      doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
    } else {
      doc.horario = doc.horario || '6:30 AM — 7:15 AM';
    }

    res.json({ ruta: doc });
  } catch (error) {
    console.error('Error al actualizar la ruta:', error);
    res.status(500).json({ error: 'Error interno al actualizar la ruta' });
  }
});

// DELETE eliminar ruta del conductor
router.delete('/ruta/:rutaId', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findById(req.params.rutaId);
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

    if (String(ruta.conductor_id) !== String(usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta ruta' });
    }

    // Unset the route from any students assigned to it
    const Estudiante = require('../models/Estudiante');
    await Estudiante.updateMany(
      { ruta_id: ruta._id },
      { $unset: { ruta_id: "" } }
    );

    await Ruta.findByIdAndDelete(req.params.rutaId);

    res.json({ success: true, message: 'Ruta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la ruta:', error);
    res.status(500).json({ error: 'Error interno al eliminar la ruta' });
  }
});

// GET ruta de un conductor por su ID (usado por padres)
router.get('/:id/ruta', verifyToken, async (req, res) => {
  try {
    const filter = { conductor_id: req.params.id };
    if (req.query.ruta_id) {
      filter._id = req.query.ruta_id;
    }
    const ruta = await Ruta.findOne(filter).populate('escuela_id');
    if (!ruta) return res.json({ ruta: null, mensaje: 'El conductor no tiene una ruta asignada actualmente.' });

    const doc = ruta.toObject();
    if (doc.horario_salida && doc.horario_llegada) {
      doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
    } else {
      doc.horario = doc.horario || '6:30 AM — 7:15 AM';
    }

    const studentsFromDb = await Estudiante.find({ conductor_id: req.params.id, ruta_id: ruta._id }).populate('padre_id', 'ubicacion');
    const orderMap = {};
    if (ruta.estudiantes) {
      ruta.estudiantes.forEach(item => {
        orderMap[String(item.estudiante_id)] = item.orden;
      });
    }
    const sortedStudents = studentsFromDb.map(student => {
      const sDoc = student.toObject();
      sDoc.orden = orderMap[String(student._id)] !== undefined ? orderMap[String(student._id)] : 999;
      if (student.padre_id) {
        sDoc.lat = student.padre_id.ubicacion?.lat || sDoc.lat || null;
        sDoc.lng = student.padre_id.ubicacion?.lng || sDoc.lng || null;
        
        const parts = [
          student.padre_id.ubicacion?.provincia,
          student.padre_id.ubicacion?.distrito,
          student.padre_id.ubicacion?.corregimiento,
          student.padre_id.ubicacion?.numero_casa
        ].filter(Boolean);
        sDoc.direccion = parts.length > 0 ? parts.join(', ') : (sDoc.direccion || 'Sin ubicación de recogida');
      }
      return sDoc;
    }).sort((a, b) => a.orden - b.orden);

    res.json({ ruta: doc, estudiantes: sortedStudents });
  } catch (error) {
    console.error('Error in GET /:id/ruta:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial de viajes' });
  }
});

// POST iniciar viaje
router.post('/viajes/iniciar', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const vehiculo = await Vehiculo.findOne({ conductor_id: conductor._id });
    res.json({ conductor, vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo iniciar el viaje' });
  }
});

// PATCH registrar asistencia en viaje
router.patch('/viajes/:id/asistencia', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const { estudiante_id, tipo, metodo_registro = 'manual', latitud, longitud } = req.body;
    if (!['subida', 'bajada'].includes(tipo)) return res.status(400).json({ error: 'Tipo de asistencia inválido' });
    const estudiante = await Estudiante.findOne({ _id: estudiante_id, conductor_id: conductor._id });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no asignado al conductor' });

    const actualizacion = {
      $push: { asistencias: { hijo_id: estudiante._id, tipo, metodo_registro, fecha_hora: new Date(), latitud, longitud } },
    };
    if (tipo === 'subida') actualizacion.$addToSet = { estudiantes_abordo: estudiante._id };
    else actualizacion.$pull = { estudiantes_abordo: estudiante._id };

    const viaje = await Viaje.findOneAndUpdate(
      { _id: req.params.id, conductor_id: conductor._id, estado: 'en_curso' },
      actualizacion,
      { new: true }
    );
    if (!viaje) return res.status(404).json({ error: 'Viaje activo no encontrado' });
    res.json({ viaje });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo registrar la asistencia' });
  }
});

// PATCH finalizar viaje
router.patch('/viajes/:id/finalizar', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const viaje = await Viaje.findOneAndUpdate(
      { _id: req.params.id, conductor_id: conductor._id, estado: 'en_curso' },
      { estado: 'finalizado', hora_llegada: new Date(), estudiantes_abordo: [] },
      { new: true }
    );
    if (!viaje) return res.status(404).json({ error: 'Viaje activo no encontrado' });
    res.json({ viaje });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo finalizar el viaje' });
  }
});

// GET conductores disponibles para el Marketplace del padre
router.get('/disponibles', verifyToken, async (req, res) => {
  try {
    const { zona, escuela } = req.query;

    const filtro = { estado: 'activa' };
    if (zona) filtro.zona = zona;
    if (escuela) filtro.escuela = escuela;

    const rutas = await Ruta.find(filtro).populate('conductor_id', 'nombre apellido foto_perfil datos_conductor');

    const conductoresMap = new Map();
    for (const ruta of rutas) {
      if (!ruta.conductor_id) continue;
      const cid = ruta.conductor_id._id.toString();
      if (!conductoresMap.has(cid)) {
        const vehiculo = await Vehiculo.findOne({ conductor_id: cid });
        const Estudiante = require('../models/Estudiante');
        const numAsientos = vehiculo ? (vehiculo.num_asientos || 15) : 15;
        const occupiedSeats = await Estudiante.countDocuments({ conductor_id: cid });
        const plazasDisponibles = Math.max(0, numAsientos - occupiedSeats);

        const rating = (ruta.conductor_id.datos_conductor?.calificacion_promedio) || 5.0;
        const reviews = (ruta.conductor_id.datos_conductor?.total_reviews) || 0;
        const telefono = ruta.conductor_id.datos_conductor?.telefono || '';

        conductoresMap.set(cid, {
          _id: ruta.conductor_id._id,
          nombre: ruta.conductor_id.nombre,
          apellido: ruta.conductor_id.apellido,
          foto_perfil: ruta.conductor_id.foto_perfil,
          telefono,
          rating,
          reviews,
          vehiculo: vehiculo || null,
          plazasDisponibles,
          rutas: [],
        });
      }
      conductoresMap.get(cid).rutas.push({
        _id: ruta._id,
        escuela: ruta.escuela,
        zona: ruta.zona,
        nombre: ruta.nombre,
        nombre_ruta: ruta.nombre_ruta || ruta.nombre,
      });
    }

    const conductores = Array.from(conductoresMap.values());
    res.json({ conductores });
  } catch (error) {
    console.error('Error obteniendo conductores disponibles:', error);
    res.status(500).json({ error: 'Error interno al obtener los conductores disponibles' });
  }
});

module.exports = router;