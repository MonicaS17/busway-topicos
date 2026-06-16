const Viaje = require('../models/Viaje');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('join:ruta', ({ id_ruta, rol }) => {
      socket.join(`sala:ruta:${id_ruta}`);
      console.log(`👤 Usuario [${rol}] se unió a la sala de la ruta: ${id_ruta}`);
    });

    // Obtener detalles de la ruta y estudiantes asignados
    socket.on('ruta:obtener_detalles', async ({ id_ruta }) => {
      try {
        const Ruta = require('../models/Ruta');
        const Estudiante = require('../models/Estudiante');

        // Buscar la ruta
        const ruta = await Ruta.findById(id_ruta);
        if (!ruta) {
          console.log(`⚠️ Ruta ${id_ruta} no encontrada en la base de datos.`);
          socket.emit('ruta:detalles', { error: 'Ruta no encontrada' });
          return;
        }

        // Buscar estudiantes asignados al conductor de esta ruta
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

    // Inicio de ruta por el conductor
    socket.on('ruta:iniciar', async ({ id_ruta, id_conductor, tipo_viaje }) => {
      try {
        // Verificar si ya existe un viaje activo para esta ruta/conductor
        let viajeActivo = await Viaje.findOne({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          estado: 'activo'
        });

        if (viajeActivo) {
          console.log(`ℹ️ Reutilizando viaje activo existente ID: ${viajeActivo._id} (${viajeActivo.tipo_viaje})`);
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:iniciada', { 
            id_viaje: viajeActivo._id,
            estado: 'activo',
            tipo_viaje: viajeActivo.tipo_viaje
          });
          return;
        }

        // Si hay un viaje en espera para el mismo tipo de recorrido, activarlo.
        let viajeEnEspera = await Viaje.findOne({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          tipo_viaje: tipo_viaje || 'ida',
          estado: 'en_espera'
        });

        if (viajeEnEspera) {
          viajeActivo = await Viaje.findByIdAndUpdate(viajeEnEspera._id, {
            estado: 'activo',
            hora_salida: new Date()
          }, { returnDocument: 'after' });

          console.log(`▶️ Viaje en espera activado ID: ${viajeActivo._id} (${viajeActivo.tipo_viaje})`);
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:iniciada', { 
            id_viaje: viajeActivo._id,
            estado: 'activo',
            tipo_viaje: viajeActivo.tipo_viaje
          });
          return;
        }

        const nuevoViaje = await Viaje.create({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          estado: 'activo',
          tipo_viaje: tipo_viaje || 'ida',
          hora_salida: new Date()
        });

        console.log(`▶️ Viaje iniciado ID: ${nuevoViaje._id} (${tipo_viaje || 'ida'})`);
        
        io.to(`sala:ruta:${id_ruta}`).emit('ruta:iniciada', { 
          id_viaje: nuevoViaje._id,
          estado: 'activo',
          tipo_viaje: tipo_viaje || 'ida'
        });
      } catch (error) {
        console.error('Error al iniciar ruta:', error);
        socket.emit('error:servidor', { mensaje: 'No se pudo guardar el hito de inicio.' });
      }
    });

    // Transmisión GPS en tiempo real
    socket.on('conductor:coordenadas', ({ id_ruta, lat, lng, velocidad }) => {
      socket.to(`sala:ruta:${id_ruta}`).emit('padre:actualizar_mapa', {
        lat,
        lng,
        velocidad,
        timestamp: new Date()
      });
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
          // El viaje de ida termina, pero la vuelta se crea solo cuando el conductor
          // la inicie explícitamente desde la app.
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:ida_finalizada', {
            id_viaje: viajeFinalizado._id,
            estado: 'finalizado',
            tipo_viaje: 'ida'
          });
        } else {
          // Si era de tipo 'vuelta', la ruta diaria ha finalizado completamente.
          io.to(`sala:ruta:${id_ruta}`).emit('ruta:finalizada');
          io.in(`sala:ruta:${id_ruta}`).socketsLeave(`sala:ruta:${id_ruta}`);
        }
      } catch (error) {
        console.error('Error al finalizar viaje en BD:', error);
      }
    });

    // Crear viaje de vuelta bajo demanda
    socket.on('ruta:crear_vuelta', async ({ id_ruta, id_conductor }) => {
      try {
        const viajeVuelta = await Viaje.create({
          ruta_id: id_ruta,
          conductor_id: id_conductor,
          estado: 'en_espera',
          tipo_viaje: 'vuelta',
          hora_salida: null
        });

        console.log(`🌙 Viaje de vuelta creado bajo demanda ID: ${viajeVuelta._id}`);

        io.to(`sala:ruta:${id_ruta}`).emit('ruta:transicion_vuelta', {
          id_viaje: viajeVuelta._id,
          estado: 'en_espera',
          tipo_viaje: 'vuelta'
        });
      } catch (error) {
        console.error('Error al crear viaje de vuelta bajo demanda:', error);
        socket.emit('error:servidor', { mensaje: 'No se pudo crear el viaje de vuelta.' });
      }
    });

    // Registro de asistencia (subida o bajada)
    socket.on('asistencia:escanear', async ({ id_viaje, id_ruta, hijo_id, tipo, lat, lng }) => {
      try {
        const ahora = new Date();
        
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

        // Avisar en tiempo real a la sala de sockets
        io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
          hijo_id,
          tipo,
          fecha_hora: ahora
        });

        // MÓDULO DE NOTIFICACIONES SIMULADO (FIREBASE NOTIFICATION)
        console.log(`🔔 [FIREBASE SIMULACIÓN] Enviando Notificación: padre_${id_ruta}`);
        console.log(`📢 Título: ${tipo === 'subida' ? 'BusWay: Abordo' : 'BusWay: Destino Confirmado'}`);
        console.log(`📝 Mensaje: El estudiante ha [${tipo.toUpperCase()}]`);
        
        /* const payloadPush = {
          notification: {
            title: tipo === 'subida' ? '🚌 ¡Abordo!' : '🏫 ¡Llegada exitosa!',
            body: `Su hijo ha escaneado el QR de ${tipo} de manera segura.`
          },
          topic: `padre_${id_ruta}`
        };
        admin.messaging().send(payloadPush)
          .then(res => console.log("Push exitoso"))
          .catch(err => console.error("Error en Push", err));
        */

      } catch (error) {
        console.error('Error al registrar asistencia QR:', error);
      }
    });

    // Registro de asistencia manual o inasistencia/ausencia
    socket.on('asistencia:registrar_manual', async ({ id_viaje, id_ruta, hijo_id, tipo, estado, lat, lng }) => {
      try {
        const ahora = new Date();
        
        const nuevaAsistencia = {
          hijo_id,
          tipo: tipo || 'subida', // 'subida' o 'bajada'
          metodo_registro: 'manual',
          fecha_hora: ahora,
          latitud: lat || null,
          longitud: lng || null
        };

        await Viaje.findByIdAndUpdate(
          id_viaje,
          { 
            $push: { asistencias: nuevaAsistencia },
            ...(estado === 'abordado' && { $addToSet: { estudiantes_abordo: hijo_id } }),
            ...(estado === 'ausente' && { $pull: { estudiantes_abordo: hijo_id } }),
            ...(estado === 'entregado' && { $pull: { estudiantes_abordo: hijo_id } })
          }
        );

        console.log(`📲 Registro manual [${estado}] para el estudiante ${hijo_id}`);

        // Avisar en tiempo real a la sala de sockets
        io.to(`sala:ruta:${id_ruta}`).emit('asistencia:actualizada', {
          hijo_id,
          tipo: estado, // 'abordado', 'ausente', 'entregado'
          fecha_hora: ahora
        });
      } catch (error) {
        console.error('Error al registrar asistencia manual:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
};