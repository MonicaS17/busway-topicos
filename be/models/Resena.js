const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  acuerdo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'acuerdos', required: true },
  calificacion: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String, default: null },
  fecha: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.models.resenas || mongoose.model('resenas', resenaSchema);
