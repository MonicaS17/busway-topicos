const mongoose = require('mongoose');

const puntoSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  descripcion: { type: String, default: '' },
}, { _id: false });

const rutaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  escuela: { type: String, required: true },
  zona: { type: String, required: true },
  frecuencia: { type: String, required: true },
  puntos_trayectoria: { type: [puntoSchema], default: [] },
  estado: { type: String, enum: ['activa', 'inactiva'], default: 'activa' },
}, { timestamps: true });

module.exports = mongoose.models.rutas || mongoose.model('rutas', rutaSchema);
