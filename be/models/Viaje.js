const mongoose = require('mongoose');

const ViajeSchema = new mongoose.Schema({
  ruta_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ruta', // Hace referencia a la colección 'rutas'
    required: true 
  },
  conductor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', // Hace referencia a la colección 'usuarios'
    required: true 
  },
  padre_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario' // Hace referencia a la colección 'usuarios' (opcional)
  },
  estudiantes_abordo: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Estudiante' // IDs de estudiantes/hijos
  }],
  hora_salida: { 
    type: Date, 
    default: Date.now // Hora real de inicio del viaje
  },
  hora_llegada: { 
    type: Date // Hora real de llegada al destino
  },
  estado: { 
    type: String, 
    enum: ['en_espera', 'activo', 'finalizado'], 
    default: 'activo' 
  },
  tipo_viaje: {
    type: String,
    enum: ['ida', 'vuelta'],
    default: 'ida'
  },
  // Control de Asistencia QR
  asistencias: [{
    hijo_id: { 
      type: String, // Almacena el identificador único del hijo
      required: true
    },
    tipo: { 
      type: String, 
      enum: ['subida', 'bajada'], 
      required: true 
    },
    metodo_registro: { 
      type: String, 
      enum: ['qr', 'manual'], 
      default: 'qr' 
    },
    fecha_hora: { 
      type: Date, 
      default: Date.now 
    },
    latitud: { 
      type: Number 
    },
    longitud: { 
      type: Number 
    }
  }]
}, { 
  collection: 'viajes',
  timestamps: true 
});

module.exports = mongoose.model('Viaje', ViajeSchema);
const asistenciaSchema = new mongoose.Schema({
  hijo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes', required: true },
  tipo: { type: String, enum: ['subida', 'bajada'], required: true },
  metodo_registro: { type: String, enum: ['qr', 'manual'], required: true },
  fecha_hora: { type: Date, required: true },
  latitud: Number,
  longitud: Number,
});

const viajeSchema = new mongoose.Schema({
  ruta_id: { type: mongoose.Schema.Types.ObjectId, ref: 'rutas', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  estudiantes_abordo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'estudiantes' }],
  hora_salida: { type: Date, required: true },
  hora_llegada: { type: Date, default: null },
  estado: { type: String, enum: ['en_curso', 'finalizado'], required: true },
  tipo_viaje: { type: String, enum: ['ida', 'vuelta'], required: true },
  asistencias: { type: [asistenciaSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.models.viajes || mongoose.model('viajes', viajeSchema);
