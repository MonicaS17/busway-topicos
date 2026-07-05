const mongoose = require('mongoose');

// Subesquema para los puntos de la trayectoria (Latitud y Longitud)
const puntoSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Esquema unificado y corregido para las Rutas
const RutaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  nombre_ruta: { type: String },
  escuela: { type: String, required: true },
  escuela_id: { type: mongoose.Schema.Types.ObjectId, ref: 'escuelas' },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  zona: { type: String, required: true },
  horario_salida: { type: String },
  horario_llegada: { type: String },
  frecuencia: { type: [String], default: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] },
  estado: { type: String, enum: ['activa', 'inactiva'], default: 'activa' },
  estudiantes: [{
    estudiante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Estudiante' },
    orden: { type: Number }
  }],
  // Usamos el puntoSchema definido arriba para que guarde el arreglo de coordenadas del GPS
  puntos_trayectoria: { type: [puntoSchema], default: [] }
}, { 
  collection: 'rutas', 
  timestamps: true 
});

// Exportación segura para evitar errores de recompilación en Mongoose
module.exports = mongoose.models.rutas || mongoose.model('rutas', RutaSchema);