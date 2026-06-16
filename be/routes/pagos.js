const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');

const pagoSchema = new mongoose.Schema({
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  monto: { type: Number, required: true },
  estado: { type: String, enum: ['Exitoso', 'Fallido', 'Pendiente'], default: 'Pendiente' },
  fecha: { type: Date, default: Date.now },
  stripe_id: { type: String, default: null },
});

const Pago = mongoose.model('pagos', pagoSchema);

// GET todos los pagos (admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate('padre_id', 'nombre apellido correo')
      .populate('conductor_id', 'nombre apellido correo')
      .sort({ fecha: -1 });

    const formateados = pagos.map((p) => ({
      id: p._id,
      padre: p.padre_id ? `${p.padre_id.nombre} ${p.padre_id.apellido}` : 'N/A',
      conductor: p.conductor_id ? `${p.conductor_id.nombre} ${p.conductor_id.apellido}` : 'N/A',
      monto: `$${p.monto.toFixed(2)}`,
      fecha: new Date(p.fecha).toLocaleDateString('es-PA'),
      status: p.estado,
    }));

    const totalMes = pagos
      .filter((p) => {
        const now = new Date();
        const fecha = new Date(p.fecha);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear() && p.estado === 'Exitoso';
      })
      .reduce((acc, p) => acc + p.monto, 0);

    const totalAnio = pagos
      .filter((p) => new Date(p.fecha).getFullYear() === new Date().getFullYear() && p.estado === 'Exitoso')
      .reduce((acc, p) => acc + p.monto, 0);

    res.json({ pagos: formateados, totalMes, totalAnio });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// GET pagos del padre autenticado
router.get('/mis-pagos', verifyToken, async (req, res) => {
  try {
    const padre = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!padre) return res.status(404).json({ error: 'Padre no encontrado' });

    const pagos = await Pago.find({ padre_id: padre._id })
      .populate('conductor_id', 'nombre apellido')
      .sort({ fecha: -1 });

    const formateados = pagos.map((p) => ({
      id: p._id,
      conductor: p.conductor_id ? `${p.conductor_id.nombre} ${p.conductor_id.apellido}` : 'N/A',
      monto: `$${p.monto.toFixed(2)}`,
      fecha: new Date(p.fecha).toLocaleDateString('es-PA'),
      status: p.estado,
    }));

    res.json({ pagos: formateados });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;