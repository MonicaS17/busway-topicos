const mongoose = require('mongoose');

const RutaSchema = new mongoose.Schema({
  nombre: { type: String },
  escuela: { type: String },
  escuela_id: { type: mongoose.Schema.Types.ObjectId, ref: 'escuelas' },
  nombre_ruta: { type: String },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  zona: { type: String },
  horario_salida: { type: String },
  horario_llegada: { type: String },
  frecuencia: { type: [String], default: ["Lunes","Martes","Miércoles","Jueves","Viernes"] },
  estado: { type: String, default: 'activa' },
  estudiantes: [{
    estudiante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Estudiante' },
    orden: { type: Number }
  }],
  puntos_trayectoria: { type: Array, default: [] }
}, { 
  collection: 'rutas', 
  timestamps: true 
});

module.exports = mongoose.models.Ruta || mongoose.model('Ruta', RutaSchema);
