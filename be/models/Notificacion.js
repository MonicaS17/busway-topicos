const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  tipo: { type: String, enum: ['masiva', 'individual', 'emergencia'], required: true },
  mensaje: { type: String, required: true },
  destinatarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' }],
  hijos_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes' }],
  viaje_id: { type: mongoose.Schema.Types.ObjectId, ref: 'viajes', default: null },
  audiencia: { type: String, enum: ['todos', 'asistentes', 'individual'], default: 'todos' },
  lecturas: [{
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    fecha_lectura: { type: Date, default: Date.now },
  }],
  enviados: { type: Number, default: 0 },
  fecha: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

notificacionSchema.index({ destinatarios: 1, fecha: -1 });
notificacionSchema.index({ conductor_id: 1, fecha: -1 });

module.exports = mongoose.models.notificaciones || mongoose.model('notificaciones', notificacionSchema);
