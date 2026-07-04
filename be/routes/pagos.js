const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
require('../models/Acuerdo');
require('../models/Solicitud');
require('../models/Estudiante');

const pagoValido = {
  tarifa_conductor: { $exists: true },
  mes_contrato: { $exists: true },
  fecha: { $exists: true },
  estado: { $in: ['Exitoso', 'Fallido', 'Pendiente'] },
};

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => new Intl.DateTimeFormat('es-PA', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Panama',
}).format(new Date(valor));

const serializarPago = (pago) => ({
  id: pago._id,
  acuerdoId: pago.acuerdo_id?._id || pago.acuerdo_id,
  padre: pago.padre_id?.nombre
    ? `${pago.padre_id.nombre} ${pago.padre_id.apellido}`
    : 'No disponible',
  conductor: pago.conductor_id?.nombre
    ? `${pago.conductor_id.nombre} ${pago.conductor_id.apellido}`
    : 'No disponible',
  monto: dinero(pago.monto_total),
  montoTotal: Number(pago.monto_total || 0),
  tarifaConductor: Number(pago.tarifa_conductor || 0),
  membresia: Number(pago.membresia || 0),
  mesContrato: pago.mes_contrato,
  fecha: fecha(pago.fecha),
  fechaISO: pago.fecha,
  status: pago.estado,
  estado: pago.estado,
  estudiantes: pago.acuerdo_id?.solicitud_id?.hijos_ids?.map((hijo) => hijo.nombre).join(', ') || 'No especificado',
});

const populateAcuerdo = {
  path: 'acuerdo_id',
  select: 'solicitud_id',
  populate: {
    path: 'solicitud_id',
    select: 'hijos_ids',
    populate: { path: 'hijos_ids', select: 'nombre' },
  },
};

async function obtenerUsuario(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) res.status(404).json({ error: 'Usuario no encontrado' });
  return usuario;
}

// Historial global para administradores.
router.get('/', verifyToken, async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req, res);
    if (!usuario) return;
    if (usuario.tipo !== 'administrador') {
      return res.status(403).json({ error: 'Acceso exclusivo para administradores' });
    }

    const pagos = await Pago.find(pagoValido)
      .populate(populateAcuerdo)
      .populate('padre_id', 'nombre apellido correo')
      .populate('conductor_id', 'nombre apellido correo')
      .sort({ fecha: -1 });

    const ahora = new Date();
    const exitosos = pagos.filter((p) => p.estado === 'Exitoso');
    const totalMes = exitosos
      .filter((p) => p.fecha.getMonth() === ahora.getMonth() && p.fecha.getFullYear() === ahora.getFullYear())
      .reduce((total, p) => total + Number(p.monto_total || 0), 0);
    const totalAnio = exitosos
      .filter((p) => p.fecha.getFullYear() === ahora.getFullYear())
      .reduce((total, p) => total + Number(p.monto_total || 0), 0);

    res.json({ pagos: pagos.map(serializarPago), totalMes, totalAnio });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener el historial de pagos' });
  }
});

router.get('/mis-pagos', verifyToken, async (req, res) => {
  try {
    const padre = await obtenerUsuario(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }
    const pagos = await Pago.find({ ...pagoValido, padre_id: padre._id })
      .populate(populateAcuerdo)
      .populate('conductor_id', 'nombre apellido')
      .sort({ fecha: -1 });
    res.json({ pagos: pagos.map(serializarPago) });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener tus pagos' });
  }
});

router.get('/recibidos', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }
    const pagos = await Pago.find({ ...pagoValido, conductor_id: conductor._id })
      .populate(populateAcuerdo)
      .populate('padre_id', 'nombre apellido')
      .sort({ fecha: -1 });
    const totalRecibido = pagos
      .filter((p) => p.estado === 'Exitoso')
      .reduce((total, p) => total + Number(p.tarifa_conductor || 0), 0);
    res.json({ pagos: pagos.map(serializarPago), totalRecibido });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener los pagos recibidos' });
  }
});

module.exports = router;
