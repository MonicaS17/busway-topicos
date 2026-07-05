const mongoose = require('mongoose');

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
