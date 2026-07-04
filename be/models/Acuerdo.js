const mongoose = require('mongoose');

const acuerdoSchema = new mongoose.Schema({
  solicitud_id: { type: mongoose.Schema.Types.ObjectId, ref: 'solicitudes', required: true },
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  tarifa_mensual: { type: Number, required: true },
  membresia: { type: Number, default: 5.99 },
  total_mensual: { type: Number, required: true },
  stripe_customer_id: String,
  stripe_subscription_id: String,
  ultimos_4_digitos: String,
  mes_actual: { type: Number, default: 1 },
  total_meses: { type: Number, default: 10 },
  estado: { type: String, enum: ['activo', 'finalizado', 'cancelado'], default: 'activo' },
  fecha_inicio: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.models.acuerdos || mongoose.model('acuerdos', acuerdoSchema);
