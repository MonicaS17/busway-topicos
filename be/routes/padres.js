const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

//POST REGISTRO BÁSICO DE HIJO
router.post('/registrar-hijo', verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) return res.status(400).json({ error: 'El nombre del hijo es obligatorio' });

    const padre = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!padre || padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso denegado. Solo los padres pueden registrar hijos' });
    }

    const nuevoEstudianteId = new mongoose.Types.ObjectId();

    const datosQR = JSON.stringify({
      estudiante_id: nuevoEstudianteId,
      nombre: nombre,
      padre_id: padre._id
    });

    const qrImagenBase64 = await QRCode.toDataURL(datosQR);

    const nuevoHijo = new Estudiante({
      _id: nuevoEstudianteId,
      nombre: nombre,
      padre_id: padre._id,
      qr_code: qrImagenBase64
    });

    await nuevoHijo.save();

    res.status(201).json({
      mensaje: 'Hijo registrado con éxito y QR generado',
      hijo: nuevoHijo
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno al registrar al hijo' });
  }
});

//GET OBTENER HIJOS DEL PADRE
router.get('/mis-hijos', verifyToken, async (req, res) => {
  try {
    const padre = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!padre) return res.status(404).json({ error: 'Padre no encontrado' });

    const hijos = await Estudiante.find({ padre_id: padre._id });
    res.json({ hijos });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener los hijos' });
  }
});

//DELETE HIJO
router.delete('/hijos/:id', verifyToken, async (req, res) => {
  try {
    const padre = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!padre) return res.status(404).json({ error: 'Padre no encontrado' });

    const hijo = await Estudiante.findOne({ _id: req.params.id, padre_id: padre._id });
    if (!hijo) return res.status(404).json({ error: 'Hijo no encontrado o no te pertenece' });

    await Estudiante.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Hijo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al eliminar al hijo' });
  }
});

module.exports = router;