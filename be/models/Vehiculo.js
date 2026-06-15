const mongoose = require('mongoose');

const vehiculoSchema = new mongoose.Schema({
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  placa: { type: String, required: true, unique: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  anio: { type: Number, required: true },
  num_asientos: { type: Number, required: true },
  estado_verificacion: { type: String, default: 'pendiente' },
  fecha_vencimiento_verificacion: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.vehiculos || mongoose.model('vehiculos', vehiculoSchema);