const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verifyToken');

// ── MODELOS ──────────────────────────────────────────────

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

const vehiculoSchema = new mongoose.Schema({
  conductor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
  placa: { type: String, required: true, unique: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  anio: { type: Number, required: true },
  num_asientos: { type: Number, required: true },
  estado_verificacion: { type: String, default: 'pendiente' },
  fecha_vencimiento_verificacion: { type: Date, default: null }
});

const Usuario = mongoose.model('usuarios', usuarioSchema);
const Vehiculo = mongoose.model('vehiculos', vehiculoSchema);

// ── VALIDACIONES BACKEND ─────────────────────────────────

const validarCedula = (cedula) => {
  const panameño = /^\d{1,2}-\d{3,4}-\d{1,6}$/;
  const extranjero = /^E-\d{1,2}-\d{1,6}$/;
  const pe = /^PE-\d{3,4}-\d{1,6}$/;
  return panameño.test(cedula) || extranjero.test(cedula) || pe.test(cedula);
};

const validarCorreo = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

// ── REGISTRO ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      firebase_uid, nombre, apellido,
      correo, cedula, tipo,
      datos_conductor, datos_padre, vehiculo
    } = req.body;

    // Validaciones
    if (!firebase_uid || !nombre || !apellido || !correo || !cedula || !tipo) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        campos: ['firebase_uid', 'nombre', 'apellido', 'correo', 'cedula', 'tipo']
      });
    }

    if (!validarCedula(cedula)) {
      return res.status(400).json({
        error: 'Formato de cédula inválido',
        mensaje: 'Formatos aceptados: 8-123-4567 / E-8-123456 / PE-123-456'
      });
    }

    if (!validarCorreo(correo)) {
      return res.status(400).json({
        error: 'Formato de correo inválido',
        mensaje: 'Ingresa un correo electrónico válido'
      });
    }

    // Verificar duplicados
    const correoExiste = await Usuario.findOne({ correo });
    if (correoExiste) {
      return res.status(400).json({ error: 'Este correo ya está registrado en BusWay' });
    }

    const cedulaExiste = await Usuario.findOne({ cedula });
    if (cedulaExiste) {
      return res.status(400).json({ error: 'Esta cédula ya está registrada en BusWay' });
    }

    // Crear usuario
    const nuevoUsuario = new Usuario({
      firebase_uid,
      nombre,
      apellido,
      correo,
      cedula,
      tipo,
      datos_conductor: datos_conductor || null,
      datos_padre: datos_padre || null,
    });

    await nuevoUsuario.save();

    // Si es conductor guardar vehículo
    if (tipo === 'conductor' && vehiculo) {
      const placaExiste = await Vehiculo.findOne({ placa: vehiculo.placa });
      if (placaExiste) {
        await Usuario.findByIdAndDelete(nuevoUsuario._id);
        return res.status(400).json({ error: 'Esta placa ya está registrada en BusWay' });
      }

      const nuevoVehiculo = new Vehiculo({
        conductor_id: nuevoUsuario._id,
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        num_asientos: vehiculo.num_asientos,
        estado_verificacion: 'pendiente',
        fecha_vencimiento_verificacion: null
      });

      await nuevoVehiculo.save();
    }

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: nuevoUsuario
    });

  } catch (error) {
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0];
      const mensajes = {
        correo: 'Este correo ya está registrado',
        cedula: 'Esta cédula ya está registrada',
        placa: 'Esta placa ya está registrada'
      };
      return res.status(400).json({ error: mensajes[campo] || 'Dato duplicado' });
    }
    res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────
router.post('/login', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });

    if (!usuario) {
      return res.status(404).json({ error: 'No encontramos tu cuenta. Por favor regístrate' });
    }

    if (usuario.estado === 'bloqueado') {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta a soporte' });
    }

    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva' });
    }

    // Si es conductor devolver también el vehículo
    let vehiculo = null;
    if (usuario.tipo === 'conductor') {
      vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    }

    res.json({
      mensaje: 'Login exitoso',
      usuario,
      vehiculo
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo' });
  }
});

// ── PERFIL (ruta protegida) ───────────────────────────────
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let vehiculo = null;
    if (usuario.tipo === 'conductor') {
      vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    }

    res.json({ usuario, vehiculo });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── LISTA DE USUARIOS ─────────────────────────────────────
router.get('/usuarios', verifyToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// PATCH cambiar estado de usuario
router.patch('/usuarios/:id/estado', verifyToken, async (req, res) => {
  try {
    const { estado } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Estado actualizado', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
module.exports = router;