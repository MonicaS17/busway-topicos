const mongoose = require('mongoose');

const RutaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  escuela: { type: String, required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  zona: { type: String },
  frecuencia: { type: String },
  estado: { type: String, default: 'activa' },
  puntos_trayectoria: { type: Array, default: [] }
}, { 
  collection: 'rutas', 
  timestamps: true 
});

module.exports = mongoose.models.Ruta || mongoose.model('Ruta', RutaSchema);
