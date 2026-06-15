const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');

// Validaciones rápidas
const validarCedula = (cedula) => /^\d{1,2}-\d{3,4}-\d{1,6}$/.test(cedula);
const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

//REGISTRO
router.post('/register', async (req, res) => {
  try {
    const { firebase_uid, nombre, apellido, correo, cedula, tipo, datos_conductor, datos_padre } = req.body;

    if (!firebase_uid || !nombre || !apellido || !correo || !cedula || !tipo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!validarCedula(cedula)) return res.status(400).json({ error: 'Formato de cédula inválido (Ej: 8-123-4567)' });
    if (!validarCorreo(correo)) return res.status(400).json({ error: 'Formato de correo electrónico inválido' });

    const correoExiste = await Usuario.findOne({ correo });
    if (correoExiste) return res.status(400).json({ error: 'Este correo ya está registrado en BusWay' });

    const cedulaExiste = await Usuario.findOne({ cedula });
    if (cedulaExiste) return res.status(400).json({ error: 'Esta cédula ya está registrada en BusWay' });

    const nuevoUsuario = new Usuario({
      firebase_uid, nombre, apellido, correo, cedula, tipo,
      datos_conductor: datos_conductor || null,
      datos_padre: datos_padre || null
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
});

// ── LOGIN ──
router.post('/login', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });

    if (!usuario) return res.status(404).json({ error: 'No encontramos tu cuenta. Por favor regístrate' });
    if (usuario.estado !== 'activo') return res.status(403).json({ error: `Tu cuenta está ${usuario.estado}` });

    res.json({ mensaje: 'Login exitoso', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor en el login' });
  }
});

// ── PERFIL ──
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;