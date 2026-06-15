const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');

exports.getPagos = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const pagos = await Pago.find({ padre_id: usuario._id }).sort({ fecha: -1 });

    const formateados = pagos.map((p) => ({
      id: p._id,
      fecha: new Date(p.fecha).toLocaleDateString('es-PA'),
      monto: `$${p.monto.toFixed(2)}`,
      detalle: p.detalle || 'Mensualidad',
      estado: p.estado,
    }));

    res.json({ pagos: formateados });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener pagos' });
  }
};