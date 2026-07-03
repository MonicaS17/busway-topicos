const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Escuela = require('../models/Escuela');
const requireRole = require('../middleware/requireRole');

router.use(verifyToken, requireRole('administrador'));

// GET todas las escuelas
router.get('/', async (req, res) => {
  try {
    const escuelas = await Escuela.find().sort({ fecha_registro: -1 });
    res.json({ escuelas });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST crear escuela
router.post('/', async (req, res) => {
  try {
    const { nombre, distrito } = req.body;
    if (!nombre || !distrito) {
      return res.status(400).json({ error: 'Nombre y distrito son obligatorios' });
    }
    const escuela = new Escuela({ nombre, distrito });
    await escuela.save();
    res.status(201).json({ mensaje: 'Escuela creada', escuela });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE eliminar escuela
router.delete('/:id', async (req, res) => {
  try {
    const escuela = await Escuela.findByIdAndDelete(req.params.id);
    if (!escuela) return res.status(404).json({ error: 'Escuela no encontrada' });
    res.json({ mensaje: 'Escuela eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
