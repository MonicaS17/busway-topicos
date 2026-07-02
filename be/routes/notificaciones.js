const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Viaje = require('../models/Viaje');
const Notificacion = require('../models/Notificacion');

async function usuarioAutenticado(req, res) {
  const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return null;
  }
  return usuario;
}

function formatearNotificacion(notificacion, usuarioId) {
  const lecturas = notificacion.lecturas || [];
  const leida = lecturas.some((lectura) => String(lectura.usuario_id) === String(usuarioId));

  return {
    _id: notificacion._id,
    conductor_id: notificacion.conductor_id,
    tipo: notificacion.tipo,
    audiencia: notificacion.audiencia,
    mensaje: notificacion.mensaje,
    destinatarios: notificacion.destinatarios,
    hijos_ids: notificacion.hijos_ids,
    viaje_id: notificacion.viaje_id,
    enviados: notificacion.enviados,
    fallidos: notificacion.fallidos,
    fecha: notificacion.fecha,
    createdAt: notificacion.createdAt,
    leida,
  };
}

async function obtenerAsistentesDelDia(conductor) {
  const viaje = await Viaje.findOne({
    conductor_id: conductor._id,
    estado: 'en_curso',
  }).sort({ createdAt: -1, hora_salida: -1 });

  if (!viaje) {
    return { estudiantes: [], viajeId: null };
  }

  const hijosIds = [...new Set((viaje.estudiantes_abordo || []).map(String))];
  if (hijosIds.length === 0) {
    return { estudiantes: [], viajeId: viaje._id };
  }

  const estudiantes = await Estudiante.find({
    _id: { $in: hijosIds },
    conductor_id: conductor._id,
    estado: 'Activo',
  })
    .select('_id nombre padre_id')
    .populate('padre_id', 'nombre apellido correo');

  return { estudiantes, viajeId: viaje._id };
}

async function obtenerDestinatarios(conductor, audiencia, estudianteId) {
  if (audiencia === 'asistentes' || audiencia === 'individual') {
    const { estudiantes, viajeId } = await obtenerAsistentesDelDia(conductor);

    if (audiencia === 'individual') {
      const estudiante = estudiantes.find((item) => String(item._id) === String(estudianteId));
      if (!estudiante?.padre_id?._id) return { padresIds: [], hijosIds: [], viajeId };

      return {
        padresIds: [estudiante.padre_id._id],
        hijosIds: [estudiante._id],
        viajeId,
      };
    }

    const estudiantesConPadre = estudiantes.filter((estudiante) => estudiante.padre_id?._id);
    const padresIds = [...new Set(estudiantesConPadre.map((estudiante) => String(estudiante.padre_id._id)))];
    return {
      padresIds,
      hijosIds: estudiantesConPadre.map((estudiante) => estudiante._id),
      viajeId,
    };
  }

  const estudiantes = await Estudiante.find({
    conductor_id: conductor._id,
    estado: 'Activo',
  }).select('_id padre_id');

  return {
    padresIds: [...new Set(estudiantes.map((estudiante) => String(estudiante.padre_id)))],
    hijosIds: estudiantes.map((estudiante) => estudiante._id),
    viajeId: null,
  };
}

router.get('/conductor/asistentes', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const { estudiantes, viajeId } = await obtenerAsistentesDelDia(conductor);
    const asistentes = estudiantes.filter((estudiante) => estudiante.padre_id?._id).map((estudiante) => ({
      _id: estudiante._id,
      nombre: estudiante.nombre,
      padre: estudiante.padre_id,
    }));

    res.json({ asistentes, viaje_id: viajeId });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron obtener los asistentes de hoy' });
  }
});

router.post('/conductor/enviar', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const mensaje = String(req.body.mensaje || '').trim();
    const audienciasValidas = ['todos', 'asistentes', 'individual'];
    const audiencia = audienciasValidas.includes(req.body.audiencia) ? req.body.audiencia : 'todos';
    const estudianteId = req.body.estudiante_id;
    if (!mensaje) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }
    if (audiencia === 'individual' && !estudianteId) {
      return res.status(400).json({ error: 'Selecciona un estudiante asistente' });
    }

    const { padresIds, hijosIds, viajeId } = await obtenerDestinatarios(conductor, audiencia, estudianteId);
    if (padresIds.length === 0) {
      const detalle = audiencia === 'todos'
        ? 'No hay padres vinculados a tu ruta'
        : audiencia === 'individual'
          ? 'El estudiante seleccionado no tiene asistencia registrada hoy'
          : 'No hay estudiantes asistentes registrados hoy';
      return res.status(400).json({ error: detalle });
    }

    const notificacion = await Notificacion.create({
      conductor_id: conductor._id,
      tipo: audiencia === 'todos' ? 'masiva' : audiencia === 'individual' ? 'individual' : 'emergencia',
      mensaje,
      destinatarios: padresIds,
      hijos_ids: hijosIds,
      viaje_id: viajeId,
      audiencia,
      enviados: padresIds.length,
      fallidos: 0,
      fecha: new Date(),
    });

    res.status(201).json({
      mensaje: 'Notificacion guardada correctamente',
      notificacion,
      enviados: padresIds.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo enviar la notificacion' });
  }
});

router.get('/conductor/historial', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const notificaciones = await Notificacion.find({ conductor_id: conductor._id })
      .sort({ fecha: -1 })
      .limit(50)
      .populate('hijos_ids', 'nombre')
      .populate('destinatarios', 'nombre apellido correo');

    res.json({ notificaciones });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo obtener el historial' });
  }
});

router.get('/padre', verifyToken, async (req, res) => {
  try {
    const padre = await usuarioAutenticado(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    const notificaciones = await Notificacion.find({ destinatarios: padre._id })
      .sort({ fecha: -1 })
      .limit(50)
      .populate('conductor_id', 'nombre apellido correo')
      .populate('hijos_ids', 'nombre padre_id');

    const datos = notificaciones.map((notificacion) => {
      const base = formatearNotificacion(notificacion, padre._id);
      const hijos = (notificacion.hijos_ids || [])
        .filter((hijo) => String(hijo.padre_id) === String(padre._id))
        .map((hijo) => ({ _id: hijo._id, nombre: hijo.nombre }));

      return { ...base, hijos_afectados: hijos };
    });

    res.json({
      notificaciones: datos,
      sinLeer: datos.filter((notificacion) => !notificacion.leida).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron obtener las notificaciones' });
  }
});

router.patch('/padre/:id/leida', verifyToken, async (req, res) => {
  try {
    const padre = await usuarioAutenticado(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, destinatarios: padre._id, 'lecturas.usuario_id': { $ne: padre._id } },
      { $push: { lecturas: { usuario_id: padre._id, fecha_lectura: new Date() } } },
      { new: true }
    );

    if (!notificacion) {
      const existente = await Notificacion.findOne({ _id: req.params.id, destinatarios: padre._id });
      if (!existente) return res.status(404).json({ error: 'Notificacion no encontrada' });
      return res.json({ notificacion: formatearNotificacion(existente, padre._id) });
    }

    res.json({ notificacion: formatearNotificacion(notificacion, padre._id) });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo marcar como leida' });
  }
});

router.patch('/padre/marcar-leidas/todas', verifyToken, async (req, res) => {
  try {
    const padre = await usuarioAutenticado(req, res);
    if (!padre) return;
    if (padre.tipo !== 'padre') {
      return res.status(403).json({ error: 'Acceso exclusivo para padres' });
    }

    await Notificacion.updateMany(
      { destinatarios: padre._id, 'lecturas.usuario_id': { $ne: padre._id } },
      { $push: { lecturas: { usuario_id: padre._id, fecha_lectura: new Date() } } }
    );

    res.json({ mensaje: 'Notificaciones marcadas como leidas' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron marcar las notificaciones' });
  }
});

module.exports = router;
