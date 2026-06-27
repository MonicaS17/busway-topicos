const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// Importamos los modelos 
const Usuario = require('../models/Usuario');
const Vehiculo = require('../models/Vehiculo');
const Estudiante = require('../models/Estudiante');

// GET perfil del conductor + vehículo
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Conductor no encontrado' });

    const vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });

    res.json({ usuario, vehiculo });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET estudiantes asignados a este conductor
router.get('/estudiantes', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Busca en la colección unificada todos los niños que tengan el ID de este conductor
    const estudiantes = await Estudiante.find({ conductor_id: usuario._id });
    res.json({ estudiantes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET ruta del conductor autenticado
router.get('/ruta', verifyToken, async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ruta = await Ruta.findOne({ conductor_id: usuario._id });
    if (!ruta) {
      return res.json({ ruta: null, mensaje: 'El conductor no tiene una ruta asignada actualmente.' });
    }

    res.json({ ruta });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener la ruta' });
  }
});

// GET ruta de un conductor por su ID (usado por padres)
router.get('/:id/ruta', verifyToken, async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const ruta = await Ruta.findOne({ conductor_id: req.params.id });
    if (!ruta) {
      return res.json({ ruta: null, mensaje: 'El conductor no tiene una ruta asignada actualmente.' });
    }

    res.json({ ruta });
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