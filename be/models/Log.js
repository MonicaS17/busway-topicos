const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  tipo: { type: String, required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', default: null },
  descripcion: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.models.logs || mongoose.model('logs', logSchema);
