const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  monto: { type: Number, required: true },
  detalle: { type: String, default: 'Mensualidad' },
  estado: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('pagos', pagoSchema);