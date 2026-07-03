const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// Importamos los modelos 
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
