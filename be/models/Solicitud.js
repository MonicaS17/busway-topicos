const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  hijos_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes' }],
  tarifa_mensual: { type: Number, required: true },
  escuela: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'aceptada', 'rechazada'], default: 'pendiente' },
  fecha_solicitud: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.solicitudes || mongoose.model('solicitudes', solicitudSchema);
