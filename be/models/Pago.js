const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  acuerdo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'acuerdos', required: true },
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  monto_total: { type: Number, required: true },
  tarifa_conductor: { type: Number, required: true },
  membresia: { type: Number, default: 5.99 },
  estado: { type: String, enum: ['Exitoso', 'Fallido', 'Pendiente'], default: 'Pendiente' },
  stripe_payment_id: { type: String, default: null },
  mes_contrato: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.pagos || mongoose.model('pagos', pagoSchema);
