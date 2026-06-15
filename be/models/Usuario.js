const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  firebase_uid: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  cedula: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['conductor', 'padre', 'administrador'], required: true },
  foto_perfil: { type: String, default: null },
  estado: { type: String, default: 'activo' },
  fcm_token: [{ type: String }],
  fecha_registro: { type: Date, default: Date.now },
  datos_conductor: { type: Object, default: null },
  datos_padre: { type: Object, default: null },
  datos_admin: { type: Object, default: null }
});

module.exports = mongoose.models.usuarios || mongoose.model('usuarios', usuarioSchema);