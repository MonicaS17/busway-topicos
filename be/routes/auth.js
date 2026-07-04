const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');
const Vehiculo = require('../models/Vehiculo');
const Log = require('../models/Log');
const requireRole = require('../middleware/requireRole');

//VALIDACIONES BACKEND 
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

//REGISTRO
router.post('/register', async (req, res) => {
  try {
    const {
      firebase_uid, nombre, apellido,
      correo, cedula, tipo, foto_perfil,
      datos_conductor, datos_padre, vehiculo
    } = req.body;

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

    const correoExiste = await Usuario.findOne({ correo });
    if (correoExiste) {
      return res.status(400).json({ error: 'Este correo ya está registrado en BusWay' });
    }

    const cedulaExiste = await Usuario.findOne({ cedula });
    if (cedulaExiste) {
      return res.status(400).json({ error: 'Esta cédula ya está registrada en BusWay' });
    }

    const nuevoUsuario = new Usuario({
      firebase_uid,
      nombre,
      apellido,
      correo,
      cedula,
      tipo,
      foto_perfil: foto_perfil || null,
      datos_conductor: datos_conductor || null,
      datos_padre: datos_padre || null,
    });

    await nuevoUsuario.save();

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

//LOGIN 
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

    const usuarioRespuesta = usuario.toObject();
    if (usuario.tipo === 'conductor') {
      usuarioRespuesta.vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    }

    res.json({
      mensaje: 'Login exitoso',
      usuario: usuarioRespuesta
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo' });
  }
});

//PERFIL (ruta protegida)
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioRespuesta = usuario.toObject();
    if (usuario.tipo === 'conductor') {
      usuarioRespuesta.vehiculo = await Vehiculo.findOne({ conductor_id: usuario._id });
    }

    res.json({ usuario: usuarioRespuesta });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//LISTA DE USUARIOS
router.get('/usuarios', verifyToken, requireRole('administrador'), async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH cambiar estado de usuario
router.patch('/usuarios/:id/estado', verifyToken, requireRole('administrador'), async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['activo', 'bloqueado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado de cuenta inválido' });
    }
    const usuario = await Usuario.findOneAndUpdate(
      { _id: req.params.id, tipo: { $in: ['conductor', 'padre'] } },
      { estado },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ error: 'Cuenta de conductor o padre no encontrada' });
    await Log.create({
      tipo: estado === 'bloqueado' ? 'bloqueo' : 'activacion',
      usuario_id: usuario._id,
      descripcion: `${req.usuario.nombre} ${req.usuario.apellido} cambió el estado de la cuenta a ${estado}`,
    });
    res.json({ mensaje: 'Estado actualizado', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Guardar ubicación del padre
router.patch('/ubicacion', verifyToken, async (req, res) => {
  try {
    const { provincia, distrito, corregimiento } = req.body;
    if (!provincia || !distrito || !corregimiento) {
      return res.status(400).json({ error: 'Provincia, distrito y corregimiento son obligatorios' });
    }

    const usuario = await Usuario.findOneAndUpdate(
      { firebase_uid: req.user.uid },
      { ubicacion: { provincia, distrito, corregimiento } },
      { new: true }
    );

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ mensaje: 'Ubicación guardada correctamente', ubicacion: usuario.ubicacion });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al guardar la ubicación' });
  }
});

module.exports = router;
