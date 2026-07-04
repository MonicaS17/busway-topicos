const mongoose = require('mongoose');

const escuelaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  distrito: { type: String, required: true },
  rutas: { type: Number, default: 0 },
  conductores: { type: Number, default: 0 },
  estado: { type: String, enum: ['Activa', 'Inactiva'], default: 'Activa' },
  fecha_registro: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.models.escuelas || mongoose.model('escuelas', escuelaSchema);
