const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');

const escuelaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  distrito: { type: String, required: true },
  rutas: { type: Number, default: 0 },
  conductores: { type: Number, default: 0 },
  estado: { type: String, default: 'Activa' },
  fecha_registro: { type: Date, default: Date.now },
});

const Escuela = mongoose.model('escuelas', escuelaSchema);

// GET todas las escuelas
router.get('/', verifyToken, async (req, res) => {
  try {
    const escuelas = await Escuela.find().sort({ fecha_registro: -1 });
    res.json({ escuelas });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST crear escuela
router.post('/', verifyToken, async (req, res) => {
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
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Escuela.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Escuela eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;