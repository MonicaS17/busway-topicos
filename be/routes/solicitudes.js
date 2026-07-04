const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Acuerdo = require('../models/Acuerdo');

async function obtenerUsuario(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return null;
  }
  return usuario;
}

const MEMBRESIA_DEFAULT = 5.99;
const TOTAL_MESES_DEFAULT = 10;

// POST /api/solicitudes — Padre crea una solicitud
router.post('/', verifyToken, async (req, res) => {
  try {
    const padre = await obtenerUsuario(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Solo los padres pueden enviar solicitudes' });
    }

    const { conductor_id, hijos_ids, tarifa_mensual, escuela } = req.body;
    if (!conductor_id || !hijos_ids || !hijos_ids.length || !tarifa_mensual || !escuela) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: conductor_id, hijos_ids, tarifa_mensual, escuela',
      });
    }

    const conductor = await Usuario.findOne({ _id: conductor_id, tipo: 'conductor' });
    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    const hijos = await Estudiante.find({ _id: { $in: hijos_ids }, padre_id: padre._id });
    if (hijos.length !== hijos_ids.length) {
      return res.status(400).json({ error: 'Uno o más hijos no te pertenecen o no existen' });
    }

    const solicitud = await Solicitud.create({
      padre_id: padre._id,
      conductor_id,
      hijos_ids,
      tarifa_mensual,
      escuela,
      estado: 'pendiente',
    });

    res.status(201).json({ mensaje: 'Solicitud enviada correctamente', solicitud });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno al crear la solicitud' });
  }
});

// GET /api/solicitudes/mis-solicitudes — Padre ve sus solicitudes
router.get('/mis-solicitudes', verifyToken, async (req, res) => {
  try {
    const padre = await obtenerUsuario(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    const solicitudes = await Solicitud.find({ padre_id: padre._id })
      .populate('conductor_id', 'nombre apellido correo foto_perfil')
      .populate('hijos_ids', 'nombre')
      .sort({ createdAt: -1 });

    res.json({ solicitudes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener tus solicitudes' });
  }
});

// GET /api/solicitudes/recibidas — Conductor ve solicitudes recibidas
router.get('/recibidas', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitudes = await Solicitud.find({ conductor_id: conductor._id })
      .populate('padre_id', 'nombre apellido correo foto_perfil')
      .populate('hijos_ids', 'nombre')
      .sort({ createdAt: -1 });

    res.json({ solicitudes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener las solicitudes recibidas' });
  }
});

// PATCH /api/solicitudes/:id/aceptar — Conductor acepta → crea Acuerdo
router.patch('/:id/aceptar', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitud = await Solicitud.findOne({ _id: req.params.id, conductor_id: conductor._id });
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no te pertenece' });
    }
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }

    solicitud.estado = 'aceptada';
    await solicitud.save();

    await Estudiante.updateMany(
      { _id: { $in: solicitud.hijos_ids } },
      { conductor_id: conductor._id }
    );

    const membresia = MEMBRESIA_DEFAULT;
    const total_mensual = solicitud.tarifa_mensual + membresia;

    const acuerdo = await Acuerdo.create({
      solicitud_id: solicitud._id,
      padre_id: solicitud.padre_id,
      conductor_id: conductor._id,
      tarifa_mensual: solicitud.tarifa_mensual,
      membresia,
      total_mensual,
      mes_actual: 1,
      total_meses: TOTAL_MESES_DEFAULT,
      estado: 'activo',
      fecha_inicio: new Date(),
    });

    res.json({
      mensaje: 'Solicitud aceptada y contrato creado',
      solicitud,
      acuerdo,
    });
  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    res.status(500).json({ error: 'Error interno al aceptar la solicitud' });
  }
});

// PATCH /api/solicitudes/:id/rechazar — Conductor rechaza
router.patch('/:id/rechazar', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitud = await Solicitud.findOneAndUpdate(
      { _id: req.params.id, conductor_id: conductor._id, estado: 'pendiente' },
      { estado: 'rechazada' },
      { new: true }
    );

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya fue procesada' });
    }

    res.json({ mensaje: 'Solicitud rechazada', solicitud });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al rechazar la solicitud' });
  }
});

module.exports = router;
