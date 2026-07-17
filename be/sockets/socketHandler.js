const Viaje = require('../models/Viaje');
const Estudiante = require('../models/Estudiante');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');
const { sendPushNotification } = require('../utils/notificaciones');

// Última posición GPS conocida por ruta, en memoria (sin persistencia ni TTL)
const ultimaPosicionPorRuta = new Map();

// ─── NOTIFICACIÓN ─────────────────────────────────────────────────────────
// Función auxiliar para notificar al padre de un estudiante
async function notificarPadre(hijo_id, viaje_id, tipo_evento, titulo, mensaje) {
  try {
    const estudiante = await Estudiante.findById(hijo_id);
    if (!estudiante) return;
    const padre = await Usuario.findById(estudiante.padre_id);
    if (!padre) return;

    // Verificar si el padre tiene un acuerdo activo con pago efectivo (stripe_subscription_id)
    const Acuerdo = require('../models/Acuerdo');
    const acuerdoActivo = await Acuerdo.findOne({
      padre_id: padre._id,
      estado: 'activo'
    });
    if (!acuerdoActivo || !acuerdoActivo.stripe_subscription_id) {
      console.log(`[Notification Blocked] El padre ${padre.nombre} no ha realizado el pago efectivo. Notificación omitida.`);
      return;
    }

    const nombreNino = estudiante.nombre;
    let tituloPersonalizado = titulo;
    let mensajePersonalizado = mensaje;

    if (tipo_evento === 'viaje_iniciado') {
      mensajePersonalizado = mensaje.replace('rumbo a la escuela.', `rumbo a la escuela para ${nombreNino}.`)
                                   .replace('de regreso a casa.', `de regreso a casa para ${nombreNino}.`);
    } else if (tipo_evento === 'en_escuela') {
      mensajePersonalizado = `${nombreNino} ha llegado a la escuela.`;
    } else if (tipo_evento === 'entregado_en_casa') {
      mensajePersonalizado = mensaje.replace('Su hijo', nombreNino)
                                   .replace('llego a casa', `${nombreNino} llegó a casa.`);
    } else if (tipo_evento === 'recogido_en_casa') {
      mensajePersonalizado = `${nombreNino} abordó el bus camino a la escuela.`;
    } else if (tipo_evento === 'regreso_iniciado') {
      mensajePersonalizado = `${nombreNino} abordó el bus camino a casa.`;
    } else {
      mensajePersonalizado = mensaje.replace('Su hijo', nombreNino)
                                   .replace('hijo/a', nombreNino);
    }

    // Buscar el viaje para obtener el conductor
    const viaje = await Viaje.findById(viaje_id);
    const conductor_id = viaje ? viaje.conductor_id : estudiante.conductor_id;

    if (conductor_id) {
      // Guardar la notificación en la base de datos para que aparezca en el panel de avisos
      await Notificacion.create({
        conductor_id: conductor_id,
        tipo: 'individual',
        mensaje: `${tituloPersonalizado} - ${mensajePersonalizado}`,
        destinatarios: [padre._id],
        hijos_ids: [hijo_id],
        viaje_id: viaje_id,
        audiencia: 'individual',
        fecha: new Date(),
      });
    }

    // Si el padre tiene fcm_token, usar el primero, si no usar un mock para verificar el flujo
    const token = (padre.fcm_token && padre.fcm_token.length > 0) ? padre.fcm_token[0] : 'mock_fcm_token';

    await sendPushNotification({
      token: token,
      titulo: tituloPersonalizado,
      mensaje: mensajePersonalizado,
      data: {
        tipo: tipo_evento,
        estudianteId: String(hijo_id),
        viajeId: String(viaje_id)
      }
    });
  } catch (err) {
    console.error('Error al enviar notificación push al padre:', err);
  }
}


module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('join:ruta', ({ id_ruta, rol }) => {
      socket.join(`sala:ruta:${id_ruta}`);
      console.log(`👤 Usuario [${rol}] se unió a la sala de la ruta: ${id_ruta}`);

      const ultimaPosicion = ultimaPosicionPorRuta.get(id_ruta);
      if (ultimaPosicion) {
        socket.emit('padre:actualizar_mapa', ultimaPosicion);
      }
    });

    // Obtener detalles de la ruta y estudiantes asignados
    socket.on('ruta:obtener_detalles', async ({ id_ruta }) => {
      try {
        const Ruta = require('../models/Ruta');
        const Estudiante = require('../models/Estudiante');

        const ruta = await Ruta.findById(id_ruta);
        if (!ruta) {
          console.log(`⚠️ Ruta ${id_ruta} no encontrada en la base de datos.`);
          socket.emit('ruta:detalles', { error: 'Ruta no encontrada' });
          return;
        }

        const estudiantes = await Estudiante.find({ conductor_id: ruta.conductor_id });

        console.log(`📡 Enviando detalles de la ruta ${id_ruta} con ${estudiantes.length} estudiantes`);
        socket.emit('ruta:detalles', {
          _id: ruta._id,
          id_ruta: ruta._id,
          nombre: ruta.nombre,
          escuela: ruta.escuela,
          estudiantes: estudiantes || []
        });
      } catch (error) {
        console.error('Error al obtener detalles de la ruta:', error);
        socket.emit('ruta:detalles:error', { mensaje: 'Error al obtener los detalles de la ruta' });
      }
    });

    // ─── INICIO DE RUTA POR EL CONDUCTOR ─────────────────────────────────────────
    socket.on('ruta:iniciar', async ({ id_ruta, id_conductor, tipo_viaje }) => {
      try {
        const Estudiante = require('../models/Estudiante');
        const estudiantesRuta = await Estudiante.find({ ruta_id: id_ruta, estado: 'Activo' });

        if (estudiantesRuta.length === 0) {
          console.warn(`⚠️ Intento de iniciar ruta ${id_ruta} sin ningún estudiante registrado.`);
          socket.emit('error:servidor', {
            codigo: 'SIN_ESTUDIANTES_REGISTRADOS',
            mensaje: 'No puedes iniciar el viaje porque no tienes ningún estudiante registrado en esta ruta.'
          });
          return;
        }

        // Bloqueo estricto: solo bloquear si existe un viaje 'activo' para este conductor
        const viajeActivo = await Viaje.findOne({
          conductor_id: id_conductor,
          estado: 'activo'
        });

        if (viajeActivo) {
          console.log(`ℹ️ Conductor ${id_conductor} ya tiene un viaje activo ID: ${viajeActivo._id} (${viajeActivo.tipo_viaje}). Retornando existente.`);
          socket.emit('ruta:iniciada', {
            id_viaje: viajeActivo._id,
            estado: 'activo',
            tipo_viaje: viajeActivo.tipo_viaje
          });
          return;
        }

        const tipoEfectivo = tipo_viaje || 'ida';
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        // Validación 1: Si es viaje de vuelta, verificar que se haya iniciado la ida en la mañana
        if (tipoEfectivo === 'vuelta') {
          const viajeIda = await Viaje.findOne({
            ruta_id: id_ruta,
            conductor_id: id_conductor,
            tipo_viaje: 'ida',
            createdAt: { $gte: inicioDia }
          });
          if (!viajeIda || viajeIda.estado === 'en_espera') {
            socket.emit('error:servidor', {
              codigo: 'IDA_NO_INICIADA',
              mensaje: 'No puedes iniciar el viaje de vuelta porque no se inició el viaje de ida de esta mañana.'
            });
            return;
          }
        }

        // Validación 2: Si es viaje de ida, verificar si ya se hizo uno hoy sin haber completado el de vuelta
        if (tipoEfectivo === 'ida') {
          const viajeIdaExistente = await Viaje.findOne({
            ruta_id: id_ruta,
            conductor_id: id_conductor,
            tipo_viaje: 'ida',
            createdAt: { $gte: inicioDia }
          });

          if (viajeIdaExistente) {
            const viajeVueltaExistente = await Viaje.findOne({
              ruta_id: id_ruta,
              conductor_id: id_conductor,
              tipo_viaje: 'vuelta',
              createdAt: { $gte: inicioDia }
            });

            if (!viajeVueltaExistente) {
              socket.emit('error:servidor', {
                codigo: 'IDA_DUPLICADA',
                mensaje: 'Ya iniciaste un viaje de ida esta mañana. Debes completar el viaje de vuelta antes de poder iniciar otro viaje de ida.'
              });
              return;
            }
          }
        }

        // Buscar si existe viaje en_espera para esta sesión
        const viajeEnEspera = await Viaje.findOne({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          tipo_viaje: tipoEfectivo,
          estado: 'en_espera'
        });

        // Si existe un viaje 'en_espera' huérfano (de otra ruta o tipo),
        // finalizarlo antes de permitir la nueva jornada — NO bloquear.
        const viajeEnEsperaHuerfano = await Viaje.findOne({
          conductor_id: id_conductor,
          estado: 'en_espera',
          _id: { $ne: viajeEnEspera?._id }
        });

        if (viajeEnEsperaHuerfano) {
          console.warn(`⚠️ Viaje en_espera huérfano ID: ${viajeEnEsperaHuerfano._id}. Finalizando para permitir nueva jornada.`);
          await Viaje.findByIdAndUpdate(viajeEnEsperaHuerfano._id, {
            estado: 'finalizado',
            hora_llegada: new Date()
          });
        }

        // Si existe el viaje en_espera para esta sesión, activarlo; si no, crearlo directamente
        let nuevoViaje;
        if (viajeEnEspera) {
          nuevoViaje = await Viaje.findByIdAndUpdate(viajeEnEspera._id, {
            estado: 'activo',
            hora_salida: new Date()
          }, { new: true });
          console.log(`▶️ Viaje en_espera activado ID: ${nuevoViaje._id} (${tipoEfectivo})`);
        } else {
          nuevoViaje = await Viaje.create({
            ruta_id: id_ruta,
            conductor_id: id_conductor,
            estado: 'activo',
            tipo_viaje: tipoEfectivo,
            hora_salida: new Date()
          });
          console.log(`▶️ Nuevo viaje creado ID: ${nuevoViaje._id} (${tipoEfectivo})`);
        }



        io.to(`sala:ruta:${id_ruta}`).emit('ruta:iniciada', {
          id_viaje: nuevoViaje._id,
          estado: 'activo',
          tipo_viaje: tipoEfectivo
        });

        // Notificar a todos los padres de los niños de esta ruta que el viaje ha iniciado
        try {
          const titulo = tipoEfectivo === 'vuelta' ? '🚌 Viaje de vuelta iniciado' : '🚌 Viaje de ida iniciado';
          const mensaje = tipoEfectivo === 'vuelta'
            ? 'El conductor ha iniciado el viaje de regreso a casa.'
            : 'El conductor ha iniciado el viaje rumbo a la escuela.';
          for (const est of estudiantesRuta) {
            await notificarPadre(est._id, nuevoViaje._id, 'viaje_iniciado', titulo, mensaje);
          }
        } catch (err) {
          console.error('Error al enviar notificaciones de inicio de viaje:', err);
        }
      } catch (error) {
        console.error('Error al iniciar ruta:', error);
        socket.emit('error:servidor', { mensaje: 'No se pudo guardar el hito de inicio.' });
      }
    });


    // Transmisión GPS en tiempo real
    socket.on('conductor:coordenadas', ({ id_ruta, lat, lng, velocidad }) => {
      const posicion = { lat, lng, velocidad, timestamp: new Date() };
      ultimaPosicionPorRuta.set(id_ruta, posicion);
      socket.to(`sala:ruta:${id_ruta}`).emit('padre:actualizar_mapa', posicion);
    });

    // Finalización de ruta
    socket.on('ruta:finalizar', async ({ id_viaje, id_ruta }) => {
      try {
        const viajeFinalizado = await Viaje.findByIdAndUpdate(id_viaje, {
          estado: 'finalizado',
          hora_llegada: new Date()
        }, { returnDocument: 'after' });

        console.log(`⏹️ Viaje ${id_viaje} finalizado manualmente.`);

        if (!viajeFinalizado) {
          console.warn(`⚠️ No se encontró viaje ${id_viaje} para finalizar.`);
          return;
        }

        if (viajeFinalizado.tipo_viaje === 'ida') {
          // Notificar solo a los padres de los estudiantes que realmente subieron al bus
          const estudiantesAsistieron = viajeFinalizado.estudiantes_abordo || [];
          const ahora = new Date();

          // Generar registros de bajada para todos los que asistieron
          const nuevasAsistenciasBajada = estudiantesAsistieron.map(estId => ({
            hijo_id: estId,
            tipo: 'bajada',
            metodo_registro: 'automatico',
            fecha_hora: ahora
          }));

          // Actualizar el viaje agregando los registros de bajada en las asistencias
          await Viaje.findByIdAndUpdate(id_viaje, {
            $push: { asistencias: { $each: nuevasAsistenciasBajada } }
          });

          for (const estId of estudiantesAsistieron) {
            await notificarPadre(estId, viajeFinalizado._id, 'en_escuela', '🏫 ¡Llegada!', 'llego a la escuela');
          }

          // El viaje de ida termina; la vuelta se crea solo cuando el conductor la inicie.
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:ida_finalizada', {
            id_viaje: viajeFinalizado._id,
            estado: 'finalizado',
            tipo_viaje: 'ida'
          });
        } else {
          // Si era de tipo 'vuelta', notificar a los estudiantes que seguían a bordo y registrar su bajada
          const estudiantesAbordo = viajeFinalizado.estudiantes_abordo || [];
          const ahora = new Date();
          for (const estId of estudiantesAbordo) {
            // Registrar asistencia de bajada en la BD para que quede consistente
            await Viaje.findByIdAndUpdate(id_viaje, {
              $push: {
                asistencias: {
                  hijo_id: estId,
                  tipo: 'bajada',
                  metodo_registro: 'manual',
                  fecha_hora: ahora,
                  latitud: null,
                  longitud: null
                }
              }
            });
            // Notificar al padre
            await notificarPadre(estId, viajeFinalizado._id, 'entregado_en_casa', '🏠 ¡Llegada exitosa!', 'Su hijo ha sido entregado de forma segura en casa.');
          }
          // Limpiar estudiantes_abordo
          await Viaje.findByIdAndUpdate(id_viaje, { $set: { estudiantes_abordo: [] } });

          // Si era de tipo 'vuelta', la ruta diaria ha finalizado completamente.
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:finalizada');
          io.in(`sala:ruta:${id_ruta}`).socketsLeave(`sala:ruta:${id_ruta}`);
        }
      } catch (error) {
        console.error('Error al finalizar viaje en BD:', error);
      }
    });

    // ─── CREACIÓN DE VIAJE DE VUELTA BAJO DEMANDA ─────────────────────────────────────────
    // Solo si la ida está finalizada
    // Verifica que el viaje de ida esté 'finalizado' antes de crear la vuelta.
    socket.on('ruta:crear_vuelta', async ({ id_ruta, id_conductor }) => {
      try {
        // Verificar que el viaje de ida del día esté finalizado
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        const viajeIda = await Viaje.findOne({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          tipo_viaje: 'ida',
          createdAt: { $gte: inicioDia }
        }).sort({ createdAt: -1 });

        if (!viajeIda || viajeIda.estado === 'en_espera') {
          console.warn(`⚠️ El viaje de ida no fue iniciado para la ruta ${id_ruta}. No se puede crear vuelta.`);
          socket.emit('error:servidor', {
            codigo: 'IDA_NO_INICIADA',
            mensaje: 'No puedes iniciar el viaje de vuelta porque no se inició el viaje de ida de esta mañana.'
          });
          return;
        }

        // Si la ida no está finalizada, finalizarla primero
        if (viajeIda.estado !== 'finalizado') {
          console.warn(`⚠️ Viaje de ida ${viajeIda._id} no está finalizado (estado: ${viajeIda.estado}). Finalizando antes de crear vuelta.`);
          await Viaje.findByIdAndUpdate(viajeIda._id, {
            estado: 'finalizado',
            hora_llegada: new Date()
          });
          console.log(`✅ Viaje de ida ${viajeIda._id} cerrado automáticamente.`);
        }

        // Crear el viaje de vuelta activo directamente
        const viajeVuelta = await Viaje.create({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          estado: 'activo',
          tipo_viaje: 'vuelta',
          hora_salida: new Date()
        });

        console.log(`Viaje de vuelta creado bajo demanda ID: ${viajeVuelta._id}`);

        // Notificar a todos los padres de los niños de esta ruta que el viaje de vuelta ha iniciado
        try {
          const Estudiante = require('../models/Estudiante');
          const estudiantesRuta = await Estudiante.find({ ruta_id: id_ruta, estado: 'Activo' });
          const titulo = '🚌 Viaje de vuelta iniciado';
          const mensaje = 'El conductor ha iniciado el viaje de regreso a casa.';
          for (const est of estudiantesRuta) {
            await notificarPadre(est._id, viajeVuelta._id, 'viaje_iniciado', titulo, mensaje);
          }
        } catch (err) {
          console.error('Error al enviar notificaciones de inicio de viaje de vuelta:', err);
        }

        // ACK con el id del nuevo viaje de vuelta activo
        io.to(`sala:ruta:${id_ruta}`).emit('ruta:transicion_vuelta', {
          id_viaje: viajeVuelta._id,
          estado: 'activo',
          tipo_viaje: 'vuelta'
        });
      } catch (error) {
        console.error('Error al crear viaje de vuelta bajo demanda:', error);
        socket.emit('error:servidor', { mensaje: 'No se pudo crear el viaje de vuelta.' });
      }
    });

    // ─── REGISTRO DE ASISTENCIA ─────────────────────────────────────────────────────────
    //(subida o bajada) — idempotente
    socket.on('asistencia:escanear', async ({ id_viaje, id_ruta, hijo_id, tipo, lat, lng }) => {
      try {
        const ahora = new Date();

        // Verificar si ya existe un registro para este estudiante en este viaje con el mismo tipo
        const viajeActual = await Viaje.findById(id_viaje, { asistencias: 1, tipo_viaje: 1 });
        if (!viajeActual) {
          console.warn(`⚠️ Viaje ${id_viaje} no encontrado para registrar asistencia.`);
          return;
        }

        const yaRegistrado = viajeActual.asistencias.some(
          a => String(a.hijo_id) === String(hijo_id) && a.tipo === tipo
        );

        if (yaRegistrado) {
          console.log(`ℹ️ Asistencia [${tipo}] ya registrada para estudiante ${hijo_id} en viaje ${id_viaje}. Respondiendo con ACK sin duplicar.`);
          // Responder ACK exitoso sin duplicar
          io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
            hijo_id,
            tipo,
            fecha_hora: ahora
          });
          return;
        }

        const nuevaAsistencia = {
          hijo_id,
          tipo,
          metodo_registro: 'qr',
          fecha_hora: ahora,
          latitud: lat || null,
          longitud: lng || null
        };

        await Viaje.findByIdAndUpdate(
          id_viaje,
          {
            $push: { asistencias: nuevaAsistencia },
            ...(tipo === 'subida' && { $addToSet: { estudiantes_abordo: hijo_id } }),
            ...(tipo === 'bajada' && { $pull: { estudiantes_abordo: hijo_id } })
          }
        );

        console.log(`📲 Registro [${tipo}] exitoso para el estudiante ${hijo_id}`);

        io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
          hijo_id,
          tipo,
          fecha_hora: ahora
        });

        // ─── NOTIFICACIÓN ─────────────────────────────────────────────────────────
        // Enviar notificación push al padre usando el stub (para registro QR)
        const tipoViaje = viajeActual.tipo_viaje || 'ida';
        let tipoNotificacion = null;
        let tituloNotif = '';
        let mensajeNotif = '';

        if (tipoViaje === 'ida') {
          if (tipo === 'subida') {
            tipoNotificacion = 'recogido_en_casa';
            tituloNotif = '🚌 ¡Abordo!';
            mensajeNotif = 'abordo camino a la escuela';
          }
        } else if (tipoViaje === 'vuelta') {
          if (tipo === 'subida') {
            tipoNotificacion = 'regreso_iniciado';
            tituloNotif = '🚌 ¡Abordo!';
            mensajeNotif = 'abordo camino a casa';
          } else if (tipo === 'bajada') {
            tipoNotificacion = 'entregado_en_casa';
            tituloNotif = '🏠 ¡Llegada!';
            mensajeNotif = 'llego a casa';
          }
        }

        if (tipoNotificacion) {
          await notificarPadre(hijo_id, id_viaje, tipoNotificacion, tituloNotif, mensajeNotif);
        }

      } catch (error) {
        console.error('Error al registrar asistencia QR:', error);
      }
    });

    // ─── REGISTRO DE ASISTENCIA MANUAL ───────────────────────────────────────────────────────
    socket.on('asistencia:registrar_manual', async ({ id_viaje, id_ruta, hijo_id, tipo, estado, lat, lng }) => {
      try {
        const ahora = new Date();
        const tipoEfectivo = tipo || 'subida';

        // Verificar si ya existe un registro con el mismo hijo_id y tipo en este viaje
        const viajeActual = await Viaje.findById(id_viaje, { asistencias: 1, tipo_viaje: 1 });
        if (!viajeActual) {
          console.warn(`⚠️ Viaje ${id_viaje} no encontrado para registrar asistencia manual.`);
          return;
        }

        const yaRegistrado = viajeActual.asistencias.some(
          a => String(a.hijo_id) === String(hijo_id) && a.tipo === tipoEfectivo
        );

        if (yaRegistrado) {
          console.log(`ℹ️ Asistencia manual [${estado}] ya registrada para estudiante ${hijo_id}. Respondiendo con ACK sin duplicar.`);
          io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
            hijo_id,
            tipo: estado,
            fecha_hora: ahora
          });
          return;
        }

        const nuevaAsistencia = {
          hijo_id,
          tipo: estado === 'ausente' ? 'ausente' : tipoEfectivo,
          metodo_registro: 'manual',
          fecha_hora: ahora,
          latitud: lat || null,
          longitud: lng || null
        };

        const viajeActualizado = await Viaje.findByIdAndUpdate(
          id_viaje,
          {
            $push: { asistencias: nuevaAsistencia },
            ...((estado === 'abordado' || estado === 'abordo') && { $addToSet: { estudiantes_abordo: hijo_id } }),
            ...(estado === 'ausente' && { $pull: { estudiantes_abordo: hijo_id } }),
            ...(estado === 'entregado' && { $pull: { estudiantes_abordo: hijo_id } })
          },
          { new: true }
        );

        // Verificar si todos los estudiantes de la ruta están ausentes
        const Estudiante = require('../models/Estudiante');
        const estudiantesRuta = await Estudiante.find({ ruta_id: id_ruta, estado: 'Activo' });
        const totalAusentes = viajeActualizado.asistencias.filter(a => a.tipo === 'ausente').length;

        if (totalAusentes === estudiantesRuta.length && estudiantesRuta.length > 0) {
          console.log(`ℹ️ Todos los estudiantes (${totalAusentes}/${estudiantesRuta.length}) están ausentes. Finalizando ruta automáticamente.`);
          await Viaje.findByIdAndUpdate(id_viaje, {
            estado: 'finalizado',
            hora_llegada: ahora,
            estudiantes_abordo: []
          });
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:finalizada');
          socket.emit('error:servidor', {
            codigo: 'TODOS_AUSENTES',
            mensaje: 'La ruta ha sido finalizada automáticamente porque todos los estudiantes fueron marcados como ausentes.'
          });
        }

        console.log(`📲 Registro manual [${estado}] para el estudiante ${hijo_id}`);

        io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
          hijo_id,
          tipo: estado,
          fecha_hora: ahora
        });

        // ─── NOTIFICACIÓN ─────────────────────────────────────────────────────────
        // Enviar notificación push al padre usando el stub (para registro manual)
        const tipoViaje = viajeActual.tipo_viaje || 'ida';
        let tipoNotificacion = null;
        let tituloNotif = '';
        let mensajeNotif = '';

        if (tipoViaje === 'ida') {
          if (estado === 'abordado' || estado === 'abordo') {
            tipoNotificacion = 'recogido_en_casa';
            tituloNotif = '🚌 ¡Abordo!';
            mensajeNotif = 'abordo camino a la escuela';
          } else if (estado === 'ausente') {
            tipoNotificacion = 'ausente';
            tituloNotif = '⚠️ Reporte de inasistencia';
            mensajeNotif = 'ausente';
          }
        } else if (tipoViaje === 'vuelta') {
          if (estado === 'abordado' || estado === 'abordo') {
            tipoNotificacion = 'regreso_iniciado';
            tituloNotif = '🚌 ¡Abordo!';
            mensajeNotif = 'abordo camino a casa';
          } else if (estado === 'entregado') {
            tipoNotificacion = 'entregado_en_casa';
            tituloNotif = '🏠 ¡Llegada!';
            mensajeNotif = 'llego a casa';
          } else if (estado === 'ausente') {
            tipoNotificacion = 'ausente';
            tituloNotif = '⚠️ Reporte de inasistencia';
            mensajeNotif = 'ausente';
          }
        }

        if (tipoNotificacion) {
          await notificarPadre(hijo_id, id_viaje, tipoNotificacion, tituloNotif, mensajeNotif);
        }
      } catch (error) {
        console.error('Error al registrar asistencia manual:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
};