const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Acuerdo = require('../models/Acuerdo');
const Notificacion = require('../models/Notificacion');

async function obtenerUsuario(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return null;
  }
  return usuario;
}

const MEMBRESIA_DEFAULT = 5.99;
const TOTAL_MESES_DEFAULT = 10;

// POST /api/solicitudes — Padre crea una solicitud
router.post('/', verifyToken, async (req, res) => {
  try {
    const padre = await obtenerUsuario(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Solo los padres pueden enviar solicitudes' });
    }

    const { conductor_id, hijos_ids, tarifa_mensual, escuela, ruta_id } = req.body;
    if (!conductor_id || !hijos_ids || !hijos_ids.length || tarifa_mensual === undefined || tarifa_mensual === null || !escuela) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: conductor_id, hijos_ids, tarifa_mensual, escuela',
      });
    }

    const conductor = await Usuario.findOne({ _id: conductor_id, tipo: 'conductor' });
    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Validar si alguno de los estudiantes ya tiene una solicitud activa (pendiente/aceptada)
    const solicitudDuplicada = await Solicitud.findOne({
      hijos_ids: { $in: hijos_ids },
      estado: { $in: ['pendiente', 'aceptada'] }
    });
    if (solicitudDuplicada) {
      const estudiante = await Estudiante.findOne({ _id: { $in: hijos_ids } });
      const nombreEst = estudiante ? estudiante.nombre : 'el estudiante';
      return res.status(400).json({ error: `Ya existe una solicitud pendiente o aprobada para ${nombreEst}.` });
    }

    // Validar si alguno de los estudiantes ya está asignado a un conductor/ruta activo
    const estudianteAsignado = await Estudiante.findOne({
      _id: { $in: hijos_ids },
      conductor_id: { $ne: null }
    });
    if (estudianteAsignado) {
      return res.status(400).json({ error: `${estudianteAsignado.nombre} ya tiene una ruta asignada actualmente.` });
    }

    const hijos = await Estudiante.find({ _id: { $in: hijos_ids }, padre_id: padre._id });
    if (hijos.length !== hijos_ids.length) {
      return res.status(400).json({ error: 'Uno o más hijos no te pertenecen o no existen' });
    }

    const solicitud = await Solicitud.create({
      padre_id: padre._id,
      conductor_id,
      ruta_id,
      hijos_ids,
      tarifa_mensual,
      escuela,
      estado: 'pendiente',
    });

    // Crear notificación para el conductor
    await Notificacion.create({
      conductor_id,
      tipo: 'solicitud',
      mensaje: `Te llegó una nueva solicitud de servicio de ${padre.nombre} ${padre.apellido || ''} para su hijo/a en ${escuela}.`,
      destinatarios: [conductor_id],
      fecha: new Date(),
    });

    res.status(201).json({ mensaje: 'Solicitud enviada correctamente', solicitud });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno al crear la solicitud' });
  }
});

// GET /api/solicitudes/mis-solicitudes — Padre ve sus solicitudes
router.get('/mis-solicitudes', verifyToken, async (req, res) => {
  try {
    const padre = await obtenerUsuario(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    const solicitudes = await Solicitud.find({ padre_id: padre._id })
      .populate('conductor_id', 'nombre apellido correo foto_perfil')
      .populate('hijos_ids', 'nombre')
      .sort({ createdAt: -1 });

    res.json({ solicitudes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener tus solicitudes' });
  }
});

// GET /api/solicitudes/recibidas — Conductor ve solicitudes recibidas
router.get('/recibidas', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitudes = await Solicitud.find({ conductor_id: conductor._id })
      .populate('padre_id', 'nombre apellido correo foto_perfil')
      .populate('hijos_ids', 'nombre')
      .sort({ createdAt: -1 });

    res.json({ solicitudes });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener las solicitudes recibidas' });
  }
});

// PATCH /api/solicitudes/:id/aceptar — Conductor acepta → crea Acuerdo
router.patch('/:id/aceptar', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitud = await Solicitud.findOne({ _id: req.params.id, conductor_id: conductor._id });
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no te pertenece' });
    }
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }

    // Validar información de cobro (banco/tarjeta) del conductor
    const tieneCobroConfigurado = conductor.datos_conductor?.banco_info &&
                                  conductor.datos_conductor.banco_info.banco_nombre &&
                                  (conductor.datos_conductor.banco_info.num_cuenta || 
                                   conductor.datos_conductor.banco_info.banco_cuenta);
    if (!tieneCobroConfigurado) {
      return res.status(400).json({
        error: 'No puedes aceptar solicitudes sin configurar primero tu información de cobro (banco o tarjeta) en la sección de Pagos.'
      });
    }

    // Validar capacidad de asientos del vehículo
    const Vehiculo = require('../models/Vehiculo');
    const vehiculo = await Vehiculo.findOne({ conductor_id: conductor._id });
    if (vehiculo) {
      const activeEstsCount = await Estudiante.countDocuments({ conductor_id: conductor._id, estado: 'Activo' });
      const availableSeats = vehiculo.num_asientos - activeEstsCount;
      const requestedSeats = solicitud.hijos_ids.length;

      if (availableSeats < requestedSeats) {
        return res.status(400).json({
          error: `No tienes suficientes asientos disponibles en tu vehículo. Puestos libres: ${availableSeats}, solicitados: ${requestedSeats}.`
        });
      }
    }

    const { tarifa_mensual } = req.body;
    const tarifaFinal = (tarifa_mensual !== undefined && tarifa_mensual !== null)
      ? Number(tarifa_mensual)
      : solicitud.tarifa_mensual;

    solicitud.estado = 'aceptada';
    solicitud.tarifa_mensual = tarifaFinal;
    await solicitud.save();

    // Buscar la ruta del conductor (usando el ruta_id seleccionado en la solicitud si existe, de lo contrario por escuela/defecto)
    const Ruta = require('../models/Ruta');
    let rutaConductor = null;
    if (solicitud.ruta_id) {
      rutaConductor = await Ruta.findById(solicitud.ruta_id);
    }
    if (!rutaConductor) {
      rutaConductor = await Ruta.findOne({ conductor_id: conductor._id, escuela: solicitud.escuela });
    }
    if (!rutaConductor) {
      rutaConductor = await Ruta.findOne({ conductor_id: conductor._id });
    }

    const updateFields = { conductor_id: conductor._id };
    if (rutaConductor) {
      updateFields.ruta_id = rutaConductor._id;
    }

    await Estudiante.updateMany(
      { _id: { $in: solicitud.hijos_ids } },
      updateFields
    );

    const membresia = MEMBRESIA_DEFAULT;
    const total_mensual = tarifaFinal + membresia;

    // Calcular meses totales de marzo a diciembre
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Enero, 11 = Diciembre
    let totalMeses = 10;
    if (currentMonth >= 2) { // Si es Marzo o posterior
      totalMeses = 11 - currentMonth + 1; // Meses restantes hasta diciembre inclusive
    }

    const acuerdo = await Acuerdo.create({
      solicitud_id: solicitud._id,
      padre_id: solicitud.padre_id,
      conductor_id: conductor._id,
      tarifa_mensual: tarifaFinal,
      membresia,
      total_mensual,
      mes_actual: 1,
      total_meses: totalMeses,
      estado: 'activo',
      fecha_inicio: new Date(),
    });

    // Crear notificación para el padre
    await Notificacion.create({
      conductor_id: conductor._id,
      tipo: 'solicitud',
      mensaje: `Tu solicitud de servicio para la escuela ${solicitud.escuela} ha sido ACEPTADA por el conductor ${conductor.nombre} ${conductor.apellido || ''}.`,
      destinatarios: [solicitud.padre_id],
      fecha: new Date(),
    });

    res.json({
      mensaje: 'Solicitud aceptada y contrato creado',
      solicitud,
      acuerdo,
    });
  } catch (error) {
    console.error('Error aceptando solicitud:', error);
    res.status(500).json({ error: 'Error interno al aceptar la solicitud' });
  }
});

// PATCH /api/solicitudes/:id/rechazar — Conductor rechaza
router.patch('/:id/rechazar', verifyToken, async (req, res) => {
  try {
    const conductor = await obtenerUsuario(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const solicitud = await Solicitud.findOneAndUpdate(
      { _id: req.params.id, conductor_id: conductor._id, estado: 'pendiente' },
      { estado: 'rechazada' },
      { new: true }
    );

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya fue procesada' });
    }

    // Crear notificación para el padre
    await Notificacion.create({
      conductor_id: conductor._id,
      tipo: 'solicitud',
      mensaje: `Tu solicitud de servicio para la escuela ${solicitud.escuela} ha sido RECHAZADA por el conductor ${conductor.nombre} ${conductor.apellido || ''}.`,
      destinatarios: [solicitud.padre_id],
      fecha: new Date(),
    });

    res.json({ mensaje: 'Solicitud rechazada', solicitud });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al rechazar la solicitud' });
  }
});

module.exports = router;
