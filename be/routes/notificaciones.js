const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Viaje = require('../models/Viaje');
const Notificacion = require('../models/Notificacion');
const Acuerdo = require('../models/Acuerdo');
const Solicitud = require('../models/Solicitud');

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
    fecha: notificacion.fecha,
    createdAt: notificacion.createdAt,
    leida,
  };
}

// Devuelve el subconjunto de hijos cuyo acuerdo (vía su solicitud aceptada)
// está activo y con pago efectivo. Mismo criterio hijo→solicitud→acuerdo que socketHandler.
async function filtrarHijosPagados(hijosIds) {
  if (!hijosIds || hijosIds.length === 0) return [];

  const solicitudes = await Solicitud.find({
    hijos_ids: { $in: hijosIds },
    estado: 'aceptada'
  }).select('_id hijos_ids');

  if (solicitudes.length === 0) return [];

  const acuerdos = await Acuerdo.find({
    solicitud_id: { $in: solicitudes.map(s => s._id) },
    estado: 'activo',
    stripe_subscription_id: { $exists: true, $ne: null }
  }).select('solicitud_id');

  const solicitudesPagadas = new Set(acuerdos.map(a => String(a.solicitud_id)));
  const hijosPagados = new Set();
  for (const solicitud of solicitudes) {
    if (solicitudesPagadas.has(String(solicitud._id))) {
      for (const hijo of solicitud.hijos_ids) hijosPagados.add(String(hijo));
    }
  }

  return hijosIds.filter(id => hijosPagados.has(String(id)));
}

async function obtenerAsistentesDelDia(conductor, chosenRutaId) {
  let rutaId = chosenRutaId;

  if (!rutaId) {
    const viaje = await Viaje.findOne({
      conductor_id: conductor._id,
      estado: { $in: ['activo', 'en_curso'] },
    }).sort({ createdAt: -1, hora_salida: -1 });

    rutaId = viaje ? viaje.ruta_id : null;
  }

  if (!rutaId) {
    // Si no hay viaje activo, buscar la primera ruta activa del conductor
    const Ruta = require('../models/Ruta');
    const ruta = await Ruta.findOne({ conductor_id: conductor._id, estado: 'activa' });
    if (ruta) {
      rutaId = ruta._id;
    }
  }

  if (!rutaId) {
    return { estudiantes: [], viajeId: null };
  }

  const estudiantes = await Estudiante.find({
    ruta_id: rutaId,
    conductor_id: conductor._id,
    estado: 'Activo',
  })
    .select('_id nombre padre_id')
    .populate('padre_id', 'nombre apellido correo');

  // Obtener el viaje id si existe para esta ruta específica
  const viaje = await Viaje.findOne({
    conductor_id: conductor._id,
    ruta_id: rutaId,
    estado: { $in: ['activo', 'en_curso'] },
  }).sort({ createdAt: -1 });

  return { estudiantes, viajeId: viaje ? viaje._id : null, rutaId };
}

async function obtenerDestinatarios(conductor, audiencia, estudianteId, chosenRutaId) {
  let result;
  if (audiencia === 'individual') {
    const estudiante = await Estudiante.findById(estudianteId).populate('padre_id', 'nombre apellido correo');
    if (!estudiante?.padre_id?._id) return { padresIds: [], hijosIds: [], viajeId: null };

    result = {
      padresIds: [estudiante.padre_id._id],
      hijosIds: [estudiante._id],
      viajeId: null,
    };
  } else if (audiencia === 'asistentes') {
    const { estudiantes, viajeId } = await obtenerAsistentesDelDia(conductor, chosenRutaId);

    const estudiantesConPadre = estudiantes.filter((estudiante) => estudiante.padre_id?._id);
    const padresIds = [...new Set(estudiantesConPadre.map((estudiante) => String(estudiante.padre_id._id)))];
    result = {
      padresIds,
      hijosIds: estudiantesConPadre.map((estudiante) => estudiante._id),
      viajeId,
    };
  } else {
    // Todos (de una ruta específica si se pasa chosenRutaId, sino de todas)
    const filter = {
      conductor_id: conductor._id,
      estado: 'Activo',
    };
    if (chosenRutaId) {
      filter.ruta_id = chosenRutaId;
    }
    const estudiantes = await Estudiante.find(filter).select('_id padre_id');

    result = {
      padresIds: [...new Set(estudiantes.map((estudiante) => String(estudiante.padre_id)))],
      hijosIds: estudiantes.map((estudiante) => estudiante._id),
      viajeId: null,
    };
  }

  // Filtrado por-hijo: solo hijos con acuerdo pagado; los padres se re-derivan de esos hijos.
  result.hijosIds = await filtrarHijosPagados(result.hijosIds);
  const estudiantesPagados = await Estudiante.find({ _id: { $in: result.hijosIds } }).select('padre_id');
  result.padresIds = [...new Set(estudiantesPagados.map((estudiante) => String(estudiante.padre_id)))];
  return result;
}

router.get('/conductor/asistentes', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const { estudiantes, viajeId, rutaId } = await obtenerAsistentesDelDia(conductor, req.query.ruta_id);
    const asistentes = estudiantes.filter((estudiante) => estudiante.padre_id?._id).map((estudiante) => ({
      _id: estudiante._id,
      nombre: estudiante.nombre,
      padre: estudiante.padre_id,
    }));

    res.json({ asistentes, viaje_id: viajeId, ruta_id: rutaId });
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

    const { padresIds, hijosIds, viajeId } = await obtenerDestinatarios(conductor, audiencia, estudianteId, req.body.ruta_id);
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

    const notificaciones = await Notificacion.find({ conductor_id: conductor._id, tipo: { $ne: 'solicitud' } })
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

    // Determinar los hijos del padre con acuerdo pagado (gating por-hijo)
    const misHijos = await Estudiante.find({ padre_id: padre._id }).select('_id');
    const hijosPagados = new Set(
      (await filtrarHijosPagados(misHijos.map((hijo) => hijo._id))).map(String)
    );
    if (hijosPagados.size === 0) {
      // Ningún hijo con pago efectivo: no puede ver notificaciones
      return res.json({ notificaciones: [], sinLeer: 0 });
    }

    const notificaciones = await Notificacion.find({ destinatarios: padre._id })
      .sort({ fecha: -1 })
      .limit(50)
      .populate('conductor_id', 'nombre apellido correo telefono datos_conductor')
      .populate('hijos_ids', 'nombre padre_id');

    const datos = notificaciones
      .map((notificacion) => {
        const base = formatearNotificacion(notificacion, padre._id);
        const hijos = (notificacion.hijos_ids || [])
          .filter((hijo) => String(hijo.padre_id) === String(padre._id) && hijosPagados.has(String(hijo._id)))
          .map((hijo) => ({ _id: hijo._id, nombre: hijo.nombre }));

        return { ...base, hijos_afectados: hijos };
      })
      // Ocultar notificaciones que solo afectan a hijos sin pago efectivo
      .filter((notificacion) => notificacion.hijos_afectados.length > 0);

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

router.get('/conductor/recibidas', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const notificaciones = await Notificacion.find({
      destinatarios: conductor._id,
      tipo: 'solicitud',
    })
      .sort({ fecha: -1 })
      .limit(50)
      .populate({
        path: 'hijos_ids',
        select: 'nombre padre_id',
        populate: {
          path: 'padre_id',
          select: 'nombre apellido correo telefono datos_padre'
        }
      });

    const datos = notificaciones.map((notificacion) => {
      return formatearNotificacion(notificacion, conductor._id);
    });

    res.json({
      notificaciones: datos,
      sinLeer: datos.filter((n) => !n.leida).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron obtener las notificaciones' });
  }
});

router.patch('/conductor/:id/leida', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, destinatarios: conductor._id, 'lecturas.usuario_id': { $ne: conductor._id } },
      { $push: { lecturas: { usuario_id: conductor._id, fecha_lectura: new Date() } } },
      { new: true }
    );

    if (!notificacion) {
      const existente = await Notificacion.findOne({ _id: req.params.id, destinatarios: conductor._id });
      if (!existente) return res.status(404).json({ error: 'Notificacion no encontrada' });
      return res.json({ notificacion: formatearNotificacion(existente, conductor._id) });
    }

    res.json({ notificacion: formatearNotificacion(notificacion, conductor._id) });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo marcar como leida' });
  }
});

router.patch('/conductor/marcar-leidas/todas', verifyToken, async (req, res) => {
  try {
    const conductor = await usuarioAutenticado(req, res);
    if (!conductor) return;
    if (conductor.tipo !== 'conductor') {
      return res.status(403).json({ error: 'Acceso exclusivo para conductores' });
    }

    await Notificacion.updateMany(
      { destinatarios: conductor._id, 'lecturas.usuario_id': { $ne: conductor._id } },
      { $push: { lecturas: { usuario_id: conductor._id, fecha_lectura: new Date() } } }
    );

    res.json({ mensaje: 'Notificaciones marcadas como leidas' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron marcar las notificaciones' });
  }
});

module.exports = router;
