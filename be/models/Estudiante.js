const mongoose = require('mongoose');

const estudianteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  padre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', default: null },
  ruta_id: { type: mongoose.Schema.Types.ObjectId, ref: 'rutas', default: null },
  qr_code: { type: String, required: true },
  estado: { type: String, default: 'Activo' },
  fecha_registro: { type: Date, default: Date.now }
});

const Estudiante = mongoose.models.Estudiante || mongoose.model('Estudiante', estudianteSchema);

if (!mongoose.models.estudiantes) {
  mongoose.model('estudiantes', estudianteSchema);
}

module.exports = Estudiante;
module.exports = mongoose.models.estudiantes || mongoose.model('estudiantes', estudianteSchema);
