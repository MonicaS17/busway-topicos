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

// GET perfil del conductor + vehículo
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

// GET estudiantes asignados a este conductor
router.get('/estudiantes', verifyToken, async (req, res) => {
  try {
    const usuario = await conductorAutenticado(req, res);
    if (!usuario) return;

    // Busca en la colección unificada todos los niños que tengan el ID de este conductor
    const estudiantes = await Estudiante.find({ conductor_id: usuario._id })
      .populate('padre_id', 'nombre apellido correo')
      .populate('ruta_id', 'nombre escuela zona')
      .sort({ nombre: 1 });
    res.json({ estudiantes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET ruta del conductor autenticado (lista y primer elemento)
router.get('/ruta', verifyToken, async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const Estudiante = require('../models/Estudiante');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const rutas = await Ruta.find({ conductor_id: usuario._id }).populate('escuela_id');
    
    // Mapear cada ruta para incluir el campo horario calculado y el conteo de estudiantes real
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

    const activeRuta = rutasMapped.length > 0 ? rutasMapped[0] : null;
    let activeEstudiantes = [];
    if (activeRuta) {
      const studentsFromDb = await Estudiante.find({ conductor_id: usuario._id, ruta_id: activeRuta._id });
      // Ordenar estudiantes según el orden almacenado en la ruta
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
        return doc;
      }).sort((a, b) => a.orden - b.orden);
    }

    res.json({ 
      rutas: rutasMapped,
      ruta: activeRuta,
      estudiantes: activeEstudiantes
    });
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    res.status(500).json({ error: 'Error interno al obtener la ruta' });
  }
});

// GET detalle de una ruta específica
router.get('/ruta/:rutaId', verifyToken, async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const Estudiante = require('../models/Estudiante');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findById(req.params.rutaId).populate('escuela_id');
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    // Verificar que el conductor es el dueño
    if (String(ruta.conductor_id) !== String(usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta ruta' });
    }

    const doc = ruta.toObject();
    if (doc.horario_salida && doc.horario_llegada) {
      doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
    } else {
      doc.horario = doc.horario || '6:30 AM — 7:15 AM';
    }

    // Consultar estudiantes de la colección Estudiante filtrando por ruta_id
    const studentsFromDb = await Estudiante.find({ conductor_id: usuario._id, ruta_id: req.params.rutaId });
    // Ordenar estudiantes según el orden almacenado en la ruta
    const orderMap = {};
    if (ruta.estudiantes) {
      ruta.estudiantes.forEach(item => {
        orderMap[String(item.estudiante_id)] = item.orden;
      });
    }
    const sortedStudents = studentsFromDb.map(student => {
      const sDoc = student.toObject();
      sDoc.orden = orderMap[String(student._id)] !== undefined ? orderMap[String(student._id)] : 999;
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
    const Ruta = require('../models/Ruta');
    const mongoose = require('mongoose');
    const Escuela = mongoose.model('escuelas');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { escuela_id, nombre_ruta, zona, horario_salida, horario_llegada, frecuencia } = req.body;

    if (!escuela_id || !nombre_ruta || !zona || !horario_salida || !horario_llegada) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: escuela_id, nombre_ruta, zona, horario_salida, horario_llegada' });
    }

    // Validar que la escuela existe
    const escuelaExiste = await Escuela.findById(escuela_id);
    if (!escuelaExiste) {
      return res.status(400).json({ error: 'La escuela especificada no existe' });
    }

    let freqArray = frecuencia || ["Lunes","Martes","Miércoles","Jueves","Viernes"];
    if (typeof freqArray === 'string') {
      if (freqArray === 'Lunes a Viernes') {
        freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      } else if (freqArray === 'Todos los días') {
        freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      } else {
        freqArray = [freqArray];
      }
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
      nombre: nombre_ruta
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
    const Ruta = require('../models/Ruta');
    const mongoose = require('mongoose');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findById(req.params.rutaId);
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    if (String(ruta.conductor_id) !== String(usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta ruta' });
    }

    const { escuela_id, nombre_ruta, escuela, zona, horario_salida, horario_llegada, frecuencia, estado } = req.body;

    if (escuela_id !== undefined) {
      const Escuela = mongoose.model('escuelas');
      const escuelaExiste = await Escuela.findById(escuela_id);
      if (!escuelaExiste) {
        return res.status(400).json({ error: 'La escuela especificada no existe' });
      }
      ruta.escuela_id = escuela_id;
      ruta.escuela = escuelaExiste.nombre; 
    }
    if (nombre_ruta !== undefined) {
      ruta.nombre_ruta = nombre_ruta;
      ruta.nombre = nombre_ruta; 
    }
    if (escuela !== undefined) ruta.escuela = escuela;
    if (zona !== undefined) ruta.zona = zona;
    if (horario_salida !== undefined) ruta.horario_salida = horario_salida;
    if (horario_llegada !== undefined) ruta.horario_llegada = horario_llegada;
    if (frecuencia !== undefined) {
      let freqArray = frecuencia;
      if (typeof freqArray === 'string') {
        if (freqArray === 'Lunes a Viernes') {
          freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        } else if (freqArray === 'Todos los días') {
          freqArray = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        } else {
          freqArray = [freqArray];
        }
      }
      ruta.frecuencia = freqArray;
    }
    if (estado !== undefined) ruta.estado = estado;

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

// GET ruta de un conductor por su ID (usado por padres)
router.get('/:id/ruta', verifyToken, async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const Estudiante = require('../models/Estudiante');
    const ruta = await Ruta.findOne({ conductor_id: req.params.id }).populate('escuela_id');
    if (!ruta) {
      return res.json({ ruta: null, mensaje: 'El conductor no tiene una ruta asignada actualmente.' });
    }

    const doc = ruta.toObject();
    if (doc.horario_salida && doc.horario_llegada) {
      doc.horario = `${doc.horario_salida} — ${doc.horario_llegada}`;
    } else {
      doc.horario = doc.horario || '6:30 AM — 7:15 AM';
    }

    // Consultar estudiantes de la colección Estudiante filtrando por ruta_id
    const studentsFromDb = await Estudiante.find({ conductor_id: req.params.id, ruta_id: ruta._id });
    const orderMap = {};
    if (ruta.estudiantes) {
      ruta.estudiantes.forEach(item => {
        orderMap[String(item.estudiante_id)] = item.orden;
      });
    }
    const sortedStudents = studentsFromDb.map(student => {
      const sDoc = student.toObject();
      sDoc.orden = orderMap[String(student._id)] !== undefined ? orderMap[String(student._id)] : 999;
      return sDoc;
    }).sort((a, b) => a.orden - b.orden);

    res.json({ ruta: doc, estudiantes: sortedStudents });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener la ruta por ID' });
  }
});

// GET perfil de un conductor por su ID (usado por padres)
router.get('/:id/perfil', verifyToken, async (req, res) => {
  try {
    const conductor = await Usuario.findById(req.params.id);
    if (!conductor || conductor.tipo !== 'conductor') {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }
    const vehiculo = await Vehiculo.findOne({ conductor_id: conductor._id });
    res.json({ conductor, vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener perfil del conductor' });
  }
});

module.exports = router;
router.get('/rutas', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const rutasGuardadas = await Ruta.find({ conductor_id: conductor._id }).lean();
    const rutas = rutasGuardadas
      .map(serializarRuta)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ rutas });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener las rutas' });
  }
});

router.get('/viajes', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const viajes = await Viaje.find({ conductor_id: conductor._id })
      .populate('ruta_id', 'nombre escuela zona')
      .sort({ hora_salida: -1 });
    res.json({ viajes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener el historial de viajes' });
  }
});

router.post('/viajes/iniciar', verifyToken, async (req, res) => {
  try {
    const conductor = await conductorAutenticado(req, res);
    if (!conductor) return;
    const existente = await Viaje.findOne({ conductor_id: conductor._id, estado: 'en_curso' });
    if (existente) return res.json({ viaje: existente, reutilizado: true });

    const ruta = req.body.ruta_id
      ? await Ruta.findOne({ _id: req.body.ruta_id, conductor_id: conductor._id, estado: 'activa' })
      : await Ruta.findOne({ conductor_id: conductor._id, estado: 'activa' });
    if (!ruta) return res.status(400).json({ error: 'Necesitas una ruta activa para iniciar el viaje' });

    const idsSolicitados = [...new Set((req.body.estudiantes_abordo || []).map(String))];
    const validos = await Estudiante.find({ _id: { $in: idsSolicitados }, conductor_id: conductor._id }).select('_id');
    const ahora = new Date();
    const viaje = await Viaje.create({
      ruta_id: ruta._id,
      conductor_id: conductor._id,
      estudiantes_abordo: validos.map((e) => e._id),
      hora_salida: ahora,
      estado: 'en_curso',
      tipo_viaje: req.body.tipo_viaje === 'vuelta' ? 'vuelta' : 'ida',
      asistencias: validos.map((e) => ({
        hijo_id: e._id,
        tipo: 'subida',
        metodo_registro: 'manual',
        fecha_hora: ahora,
      })),
    });
    res.status(201).json({ viaje });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo iniciar el viaje' });
  }
});

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

module.exports = router;
