import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import * as Location from 'expo-location';
import { Alert, AppState } from 'react-native';
import useRuta from './useRuta';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

function reconstruirStep(viaje) {
  if (!viaje) return 'PRE_TRIP';
  switch (viaje.estado) {
    case 'activo':
      // Si el viaje está activo, significa que el conductor ya inició la ruta y está en curso.
      return 'ACTIVE_TRIP';
    case 'finalizado':
      if (viaje.tipo_viaje === 'ida') return 'MID_JOURNEY_CONFIRM';
      return 'COMPLETED';
    case 'en_espera':
      // Si el viaje está en espera, significa que aún no ha comenzado, por lo que el conductor está en la fase de pre-viaje.
      return 'PRE_TRIP';
    default:
      return 'PRE_TRIP';
  }
}

// Reconstruye el índice del estudiante actual basado en la lista de estudiantes y las asistencias registradas
function reconstruirIndiceActual(estudiantes, asistencias) {
  if (!asistencias || asistencias.length === 0) return 0;
  // El estudiante actual es el primer 'pendiente' en el orden de la ruta
  const primerPendiente = estudiantes.findIndex(
    e => !asistencias.some(a => String(a.hijo_id) === String(e.id))
  );
  return primerPendiente === -1 ? estudiantes.length : primerPendiente;
}

export default function useViaje({ usuario, esPadre, selectedHijoId, selectedRutaId }) {
  const rutaData = useRuta({ usuario, esPadre, selectedHijoId, selectedRutaId });

  // Conductor state
  const [currentStep, setCurrentStep] = useState('PRE_TRIP');
  const [tipoViaje, setTipoViaje] = useState('ida');
  const [idViaje, setIdViaje] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [posicionBus, setPosicionBus] = useState({
    latitude: 8.9833,
    longitude: -79.5167,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });

  // Padre state
  const [rutaActiva, setRutaActiva] = useState(false);
  const [faseViaje, setFaseViaje] = useState('sin_viaje');
  const [coordenadasBus, setCoordenadasBus] = useState({
    latitude: 8.9833,
    longitude: -79.5167,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });
  const [hijos, setHijos] = useState([]);

  const socketRef = useRef(null);
  const [ultimoEscaneado, setUltimoEscaneado] = useState(null);

  // Referencias para el mecanismo de reintentos de ruta:transicion_vuelta
  const vueltaAckRef = useRef(false);
  const vueltaRetryCountRef = useRef(0);
  const vueltaRetryTimerRef = useRef(null);
  const MAX_VUELTA_RETRIES = 3;
  const VUELTA_ACK_TIMEOUT_MS = 8000;

  // Para reconstruir el estado inicial del viaje al cargar la pantalla
  useEffect(() => {
    if (rutaData.loading) return;

    if (esPadre) {
      const activeTrip = rutaData.activeTripInitial;
      const mappedHijos = rutaData.hijos.map(h => {
        let estado = 'pendiente';
        if (activeTrip && activeTrip.asistencias) {
          const miAsistencia = activeTrip.asistencias.filter(a => a.hijo_id === h._id);
          if (miAsistencia.length > 0) {
            const ultima = miAsistencia[miAsistencia.length - 1];
            if (ultima.tipo === 'subida' || ultima.tipo === 'abordado') estado = 'abordo';
            else if (ultima.tipo === 'bajada' || ultima.tipo === 'entregado') estado = 'entregado';
            else if (ultima.tipo === 'ausente') estado = 'ausente';
          }
        }
        return { id: h._id, nombre: h.nombre, estado };
      });
      setHijos(mappedHijos);

      // Reconstruir lista completa de estudiantes para el mapa del padre
      if (rutaData.estudiantes) {
        setEstudiantes(rutaData.estudiantes.map((e, idx) => {
          let estado = 'pendiente';
          if (activeTrip && activeTrip.asistencias) {
            const miAsistencia = activeTrip.asistencias.filter(a => a.hijo_id === e._id);
            if (miAsistencia.length > 0) {
              const ultima = miAsistencia[miAsistencia.length - 1];
              if (ultima.tipo === 'subida' || ultima.tipo === 'abordado') estado = 'abordo';
              else if (ultima.tipo === 'bajada' || ultima.tipo === 'entregado') estado = 'entregado';
              else if (ultima.tipo === 'ausente') estado = 'ausente';
            }
          }
          return {
            id: e._id,
            _id: e._id,
            nombre: `${e.nombre} ${e.apellido || ''}`.trim(),
            zona: e.zona || 'Arraiján',
            qr: e.qr_code,
            lat: e.lat,
            lng: e.lng,
            direccion: e.direccion,
            orden: e.orden || (idx + 1),
            estado
          };
        }));
      }

      // Reconstruir fase desde la respuesta de la API
      if (rutaData.faseViaje) {
        setFaseViaje(rutaData.faseViaje);
      }
      setRutaActiva(!!activeTrip);

      // Sincronizar tipoViaje e idViaje para el padre
      if (activeTrip) {
        setTipoViaje(activeTrip.tipo_viaje || 'ida');
        setIdViaje(activeTrip._id);
      } else {
        setIdViaje(null);
        if (rutaData.faseViaje === 'entre_viajes') {
          setTipoViaje('vuelta');
        } else {
          setTipoViaje('ida');
        }
      }
    } else {
      const activeTrip = rutaData.activeTripInitial;
      const mappedEst = rutaData.estudiantes.map(e => {
        let estado = 'pendiente';
        if (activeTrip && activeTrip.asistencias) {
          const miAsistencia = activeTrip.asistencias.filter(a => a.hijo_id === e._id);
          if (miAsistencia.length > 0) {
            const ultima = miAsistencia[miAsistencia.length - 1];
            if (ultima.tipo === 'subida') estado = 'abordo';
            else if (ultima.tipo === 'bajada') estado = 'entregado';
            else if (ultima.tipo === 'ausente') estado = 'ausente';
          }
        }
        return {
          id: e._id,
          nombre: `${e.nombre} ${e.apellido || ''}`.trim(),
          zona: e.zona || 'Arraiján',
          qr: e.qr_code,
          estado
        };
      });
      setEstudiantes(mappedEst);

      if (activeTrip && activeTrip.estado === 'activo') {
        // Si hay un viaje activo, reconstruir el estado del viaje
        setIdViaje(activeTrip._id);
        setTipoViaje(activeTrip.tipo_viaje || 'ida');
        setCurrentStep(reconstruirStep(activeTrip));
      } else {
        // No hay viaje activo, iniciar siempre en PRE_TRIP para poder seleccionar la ruta
        setCurrentStep('PRE_TRIP');
        setIdViaje(null);
        setTipoViaje(rutaData.faseViaje === 'entre_viajes' ? 'vuelta' : 'ida');
      }
    }
  }, [rutaData.loading, rutaData.estudiantes, rutaData.hijos, rutaData.activeTripInitial, esPadre, rutaData.faseViaje]);

  // Resetear estado del viaje al cambiar de hijo/ruta seleccionado (evita mostrar el estado del hijo anterior mientras carga el nuevo)
  useEffect(() => {
    if (!esPadre) return;
    setRutaActiva(false);
    setFaseViaje('sin_viaje');
    setCoordenadasBus({
      latitude: 8.9833,
      longitude: -79.5167,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });
    setHijos([]);
  }, [selectedHijoId, selectedRutaId, esPadre]);

  // ─── CONEXIÓN A SOCKET Y ESCUCHA DE EVENTOS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (rutaData.loading || !rutaData.rutaInfo?._id) return;

    const socketClient = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socketClient;

    socketClient.on('connect', () => {
      if (esPadre) {
        const activeHijo = rutaData.hijos.find(h => String(h._id) === String(selectedHijoId)) || rutaData.hijos[0];
        const activeRutaId = (activeHijo?.ruta_id && typeof activeHijo.ruta_id === 'object')
          ? activeHijo.ruta_id._id
          : (activeHijo?.ruta_id || rutaData.rutaInfo._id);
        socketClient.emit('join:ruta', {
          id_ruta: activeRutaId,
          rol: 'padre',
          id_estudiante: activeHijo?._id
        });
      } else {
        socketClient.emit('join:ruta', { id_ruta: rutaData.rutaInfo._id, rol: 'conductor' });
        socketClient.emit('ruta:obtener_detalles', { id_ruta: rutaData.rutaInfo._id });
      }
    });

    if (esPadre) {
      socketClient.on('ruta:iniciada', (data) => {
        setRutaActiva(true);
        setFaseViaje('en_curso');
        setTipoViaje(data.tipo_viaje || 'ida');
        setIdViaje(data.id_viaje);
      });
      socketClient.on('padre:actualizar_mapa', (coor) => {
        setCoordenadasBus({
          latitude: Number(coor.lat),
          longitude: Number(coor.lng),
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        });
      });
      socketClient.on('asistencia:actualizada', (data) => {
        setHijos(prev => prev.map(h => {
          if (h.id === data.hijo_id) {
            let estado = h.estado;
            if (data.tipo === 'subida' || data.tipo === 'abordado') estado = 'abordo';
            else if (data.tipo === 'bajada' || data.tipo === 'entregado') estado = 'entregado';
            else if (data.tipo === 'ausente') estado = 'ausente';
            return { ...h, estado };
          }
          return h;
        }));
      });
      socketClient.on('ruta:finalizada', () => {
        setRutaActiva(false);
        setFaseViaje('sin_viaje');
        setHijos(prev => prev.map(h => ({ ...h, estado: 'pendiente' })));
      });
      socketClient.on('ruta:ida_finalizada', () => {
        setRutaActiva(false);
        setFaseViaje('entre_viajes'); // [E-09]
      });
      socketClient.on('ruta:transicion_vuelta', () => {
        setRutaActiva(false);
        setFaseViaje('entre_viajes');
        setHijos(prev => prev.map(h => ({ ...h, estado: 'pendiente' })));
      });
    } else {
      socketClient.on('ruta:iniciada', (data) => {
        // Actualizar idViaje, tipoViaje y currentStep tras confirmación del backend (regla global)
        setIdViaje(data.id_viaje);
        setTipoViaje(data.tipo_viaje);
        setCurrentStep('ACTIVE_TRIP');
      });
      socketClient.on('asistencia:actualizada', (data) => {
        setEstudiantes(prev => prev.map(est => {
          if (est.id === data.hijo_id) {
            let estado = est.estado;
            if (data.tipo === 'subida' || data.tipo === 'abordado') estado = 'abordo';
            else if (data.tipo === 'bajada' || data.tipo === 'entregado') estado = 'entregado';
            else if (data.tipo === 'ausente') estado = 'ausente';
            return { ...est, estado };
          }
          return est;
        }));
      });
      socketClient.on('ruta:finalizada', () => {
        setCurrentStep('COMPLETED');
      });

      // Listener de ACK para ruta:transicion_vuelta
      // Solo actualiza idViaje y currentStep tras confirmar el ACK del servidor
      socketClient.on('ruta:transicion_vuelta', (data) => {
        vueltaAckRef.current = true; // Marcar ACK recibido
        if (vueltaRetryTimerRef.current) {
          clearTimeout(vueltaRetryTimerRef.current);
          vueltaRetryTimerRef.current = null;
        }
        vueltaRetryCountRef.current = 0;

        // Actualizar estado local tras confirmación del backend
        setIdViaje(data.id_viaje);
        setTipoViaje('vuelta');
        setEstudiantes(prev => prev.map(e => ({ ...e, estado: 'pendiente' })));
        setCurrentStep('SCHOOL_CHECKIN');
      });
    }

    return () => {
      socketClient.disconnect();
    };
  }, [rutaData.loading, rutaData.rutaInfo?._id, rutaData.hijos, esPadre, selectedHijoId]);

  // ─── SEGUIMIENTO GPS DEL CONDUCTOR ─────────────────────────────────────────────────────────
  useEffect(() => {
    let GPSsubscription = null;
    const iniciarSeguimientoGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        GPSsubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (location) => {
            const { latitude, longitude, speed } = location.coords;
            const nuevasCoordenadas = {
              latitude,
              longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            };
            setPosicionBus(nuevasCoordenadas);
            if (socketRef.current?.connected && rutaData.rutaInfo) {
              socketRef.current.emit('conductor:coordenadas', {
                id_ruta: rutaData.rutaInfo._id,
                lat: latitude,
                lng: longitude,
                velocidad: speed ? Math.round(speed * 3.6) : 0
              });
            }
          }
        );
      } catch (err) {
        console.warn('Error al iniciar el seguimiento GPS real:', err);
      }
    };

    if (currentStep === 'ACTIVE_TRIP' && idViaje && !esPadre) {
      iniciarSeguimientoGPS();
    }

    return () => {
      if (GPSsubscription) GPSsubscription.remove();
    };
  }, [currentStep, idViaje, esPadre, rutaData.rutaInfo]);

  // Revalidar al volver al foreground (solo para padre)
  useEffect(() => {
    if (!esPadre) return;

    const revalidarEstadoPadre = async () => {
      try {
        const token = rutaData.token; // token provisto por useRuta
        if (!token) return;
        const hijoIdParaFetch = selectedHijoId || rutaData.hijos[0]?._id || '';
        const rutaIdParaFetch = selectedRutaId || rutaData.rutaInfo?._id || '';
        const resp = await fetch(`${BACKEND_URL}/api/viajes/activo/padre?estudiante_id=${hijoIdParaFetch}&ruta_id=${rutaIdParaFetch}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        // Actualizar fase según respuesta
        const fase = data.fase || (data.viaje ? 'en_curso' : 'sin_viaje');
        setFaseViaje(fase);
        setRutaActiva(fase === 'en_curso');
        if (data.viaje) {
          setTipoViaje(data.viaje.tipo_viaje || 'ida');
          setIdViaje(data.viaje._id);
        } else {
          setIdViaje(null);
          if (fase === 'entre_viajes') {
            setTipoViaje('vuelta');
          } else {
            setTipoViaje('ida');
          }
        }
      } catch (err) {
        console.warn('Error al revalidar estado del padre en foreground:', err);
      }
    };

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        revalidarEstadoPadre();
      }
    });

    return () => subscription.remove();
  }, [esPadre, rutaData.token, selectedHijoId, selectedRutaId]);

  // ─── FUNCIONES DE ACCIÓN ─────────────────────────────────────────────────────────

  const marcarEstado = (id, nuevoEstado) => {
    setEstudiantes(prev => prev.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e));

    if (idViaje && socketRef.current) {
      if (nuevoEstado === 'abordo') {
        socketRef.current.emit('asistencia:escanear', {
          id_viaje: idViaje,
          id_ruta: rutaData.rutaInfo._id,
          hijo_id: id,
          tipo: 'subida',
          lat: posicionBus.latitude,
          lng: posicionBus.longitude
        });
      } else if (nuevoEstado === 'ausente') {
        socketRef.current.emit('asistencia:registrar_manual', {
          id_viaje: idViaje,
          id_ruta: rutaData.rutaInfo._id,
          hijo_id: id,
          tipo: 'subida',
          estado: 'ausente',
          lat: posicionBus.latitude,
          lng: posicionBus.longitude
        });
      } else if (nuevoEstado === 'entregado') {
        socketRef.current.emit('asistencia:escanear', {
          id_viaje: idViaje,
          id_ruta: rutaData.rutaInfo._id,
          hijo_id: id,
          tipo: 'bajada',
          lat: posicionBus.latitude,
          lng: posicionBus.longitude
        });
      }
    }
  };

  const handleQRScanned = ({ data }) => {
    if (ultimoEscaneado === data) return;
    setUltimoEscaneado(data);

    let childId = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.estudiante_id) {
        childId = parsed.estudiante_id;
      }
    } catch {}

    const est = estudiantes.find(e => e.id === childId || e.qr === data);
    if (est) {
      if (est.estado === 'abordo') {
        Alert.alert('Ya registrado', `${est.nombre} ya está a bordo.`);
      } else {
        marcarEstado(est.id, 'abordo');
        Alert.alert('QR escaneado', `${est.nombre} marcado como a bordo.`);
      }
    } else {
      Alert.alert('QR no reconocido', 'Este código no corresponde a ningún estudiante de tu ruta.');
    }
    setTimeout(() => setUltimoEscaneado(null), 3000);
  };

  const handleParentQRScanned = ({ data }) => {
    if (ultimoEscaneado === data) return;
    setUltimoEscaneado(data);

    let childId = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.estudiante_id) {
        childId = parsed.estudiante_id;
      }
    } catch {}

    const currentStudent = estudiantes.find(e => e.estado === 'abordo');
    if (currentStudent && (currentStudent.id === childId || currentStudent.qr === data)) {
      marcarEstado(currentStudent.id, 'entregado');
      Alert.alert('Entrega confirmada', `Estudiante ${currentStudent.nombre} entregado exitosamente al padre.`);
    } else {
      Alert.alert('QR no válido', 'El código QR no corresponde al estudiante actual en esta parada.');
    }
    setTimeout(() => setUltimoEscaneado(null), 3000);
  };

  const comenzarAsistencia = () => {
    if (tipoViaje === 'vuelta') {
      // Para el retorno (vuelta), pasamos lista antes de iniciar el viaje
      setEstudiantes(prev => prev.map(e => ({ ...e, estado: 'pendiente' })));
      setCurrentStep('SCHOOL_CHECKIN');
    } else {
      // Para la ida, se inicia el viaje directamente
      if (socketRef.current && rutaData.rutaInfo) {
        socketRef.current.emit('ruta:iniciar', {
          id_ruta: rutaData.rutaInfo._id,
          id_conductor: usuario._id,
          tipo_viaje: tipoViaje
        });
      }
    }
  };

  const iniciarRuta = () => {
    if (socketRef.current && rutaData.rutaInfo) {
      // Si se llama desde SCHOOL_CHECKIN el tipo es siempre 'vuelta',
      // independientemente del valor reactivo de tipoViaje en ese momento.
      const tipoEfectivo = currentStep === 'SCHOOL_CHECKIN' ? 'vuelta' : tipoViaje;

      if (tipoEfectivo === 'vuelta') {
        const algunEstudianteAsistiendo = estudiantes.some(e => e.estado === 'abordo');
        if (!algunEstudianteAsistiendo) {
          Alert.alert(
            'No se puede iniciar la ruta',
            'No puedes iniciar la ruta de regreso si no hay ningún estudiante a bordo (todos están ausentes o sin registrar asistencia).'
          );
          return;
        }
      }

      socketRef.current.emit('ruta:iniciar', {
        id_ruta: rutaData.rutaInfo._id,
        id_conductor: usuario._id,
        tipo_viaje: tipoEfectivo
      });
      // Asegurar que el estado local refleja el tipo correcto
      if (tipoEfectivo !== tipoViaje) {
        setTipoViaje(tipoEfectivo);
      }
    }
  };

  const finalizarRuta = () => {
    const title = tipoViaje === 'ida' ? 'Llegar a la escuela' : 'Finalizar ruta';
    const message = tipoViaje === 'ida'
      ? '¿Confirmas que han llegado a la escuela?'
      : '¿Confirmas que deseas finalizar esta ruta?';

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            if (socketRef.current && idViaje && rutaData.rutaInfo) {
              socketRef.current.emit('ruta:finalizar', {
                id_viaje: idViaje,
                id_ruta: rutaData.rutaInfo._id
              });
            }
            if (tipoViaje === 'ida') {
              setCurrentStep('MID_JOURNEY_CONFIRM');
            } else {
              setEstudiantes(prev => prev.map(e => ({ ...e, estado: e.estado === 'abordo' ? 'entregado' : e.estado })));
              setCurrentStep('COMPLETED');
            }
          },
        },
      ]
    );
  };

  // iniciarRutaVuelta sin emit de socket (el viaje de vuelta se crea en ruta:iniciar de forma activa)
  const iniciarRutaVuelta = () => {
    setTipoViaje('vuelta');
    setEstudiantes(prev => prev.map(e => ({ ...e, estado: 'pendiente' })));
    setCurrentStep('SCHOOL_CHECKIN');
  };

  const reiniciarJornada = () => {
    // Limpia SOLO el estado local — NO emite ningún socket.
    setCurrentStep('PRE_TRIP');
    setTipoViaje('ida');  // reset explícito del tipo para la nueva jornada
    setIdViaje(null);
    setEstudiantes(prev => prev.map(e => ({ ...e, estado: 'pendiente' })));
  };

  return {
    ...rutaData,
    currentStep,
    setCurrentStep,
    tipoViaje,
    setTipoViaje,
    idViaje,
    estudiantes,
    posicionBus,
    rutaActiva,
    faseViaje,        // expuesto para la pantalla del padre
    coordenadasBus,
    hijos,
    rawHijos: rutaData.hijos,
    marcarEstado,
    handleQRScanned,
    handleParentQRScanned,
    comenzarAsistencia,
    iniciarRuta,
    finalizarRuta,
    iniciarRutaVuelta,
    reiniciarJornada
  };
}
