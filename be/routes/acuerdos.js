const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Acuerdo = require('../models/Acuerdo');
const Usuario = require('../models/Usuario');

async function obtenerUsuario(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return null;
  }
  return usuario;
}

// GET /api/acuerdos/mis-acuerdos — Padre obtiene su acuerdo activo
router.get('/mis-acuerdos', verifyToken, async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req, res);
    if (!usuario) return;
    if (usuario.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    const acuerdo = await Acuerdo.findOne({ padre_id: usuario._id, estado: 'activo' })
      .populate('conductor_id', 'nombre apellido correo foto_perfil')
      .populate({
        path: 'solicitud_id',
        select: 'escuela hijos_ids',
        populate: { path: 'hijos_ids', select: 'nombre' },
      });

    if (!acuerdo) {
      return res.json({ acuerdo: null, mensaje: 'No tienes un contrato activo' });
    }

    res.json({ acuerdo });
  } catch (error) {
    console.error('Error obteniendo acuerdos:', error);
    res.status(500).json({ error: 'Error interno al obtener tus acuerdos' });
  }
});

// GET /api/acuerdos/conductores — Conductor obtiene sus acuerdos activos
router.get('/conductores', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const acuerdos = await Acuerdo.find({ conductor_id: conductor._id, estado: 'activo' })
      .populate('padre_id', 'nombre apellido correo')
      .populate({
        path: 'solicitud_id',
        select: 'escuela hijos_ids',
        populate: { path: 'hijos_ids', select: 'nombre' },
      })
      .sort({ createdAt: -1 });

    res.json({ acuerdos, total: acuerdos.length });
  } catch (error) {
    console.error('Error obteniendo acuerdos del conductor:', error);
    res.status(500).json({ error: 'Error interno al obtener los acuerdos' });
  }
});

module.exports = router;
