import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import io from 'socket.io-client';
import { auth } from '../config/firebase';
import api from '../config/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function PreviaRutaPadre({ route, navigation }) {
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);

  //    estadoRuta inicia siempre en 'espera'.
  //    Solo pasa a 'progreso' cuando llega el evento 'ruta:iniciada' por socket
  //    o si hay un viaje activo detectado en la carga inicial de la API.
  const [estadoRuta, setEstadoRuta] = useState('espera'); // 'espera' | 'progreso' | 'finalizada'

  //    datosViaje inicia en null.
  //    La pantalla de espera depende de (datosViaje === null).
  //    Solo se puebla al recibir 'ruta:iniciada' o al detectar viaje activo en la API.
  const [datosViaje, setDatosViaje] = useState(null);
  
  const [hijoId, setHijoId] = useState(null);
  const [nombreEstudiante, setNombreEstudiante] = useState('');
  const [coordenadasHijo, setCoordenadasHijo] = useState(null);
  
  const [conductorId, setConductorId] = useState(null);
  const [nombreConductor, setNombreConductor] = useState('N/A');
  const [rutaInfo, setRutaInfo] = useState(null);

  // Estado del estudiante: 'pendiente' | 'abordado' | 'entregado' | 'ausente'
  const [estadoEstudiante, setEstadoEstudiante] = useState('pendiente');
  const [tipoViaje, setTipoViaje] = useState('ida');

  const [coordenadasBus, setCoordenadasBus] = useState({
    latitude: 8.9833,
    longitude: -79.5167,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });

  const socketRef = useRef(null);
  const rutaIdRef = useRef(null);

  const [logEventos, setLogEventos] = useState([]);
  const mapRef = useRef(null);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [mensajeError, setMensajeError] = useState('');

  const tipoViajeRef = useRef(tipoViaje);
  useEffect(() => {
    tipoViajeRef.current = tipoViaje;
  }, [tipoViaje]);

  // ──────────────────────────────────────────
  // CARGA DE DATOS DE LA API AL INICIAR EL COMPONENTE
  // ──────────────────────────────────────────
  useEffect(() => {
    const cargarDatosPadre = async () => {
      try {
        setCargandoDatos(true);
        setMensajeError('');

        if (!auth.currentUser) {
          setMensajeError('Por favor, inicia sesión para continuar.');
          setCargandoDatos(false);
          return;
        }

        const token = await auth.currentUser.getIdToken();

        // Obtener hijos del padre
        const resHijos = await api.get('/api/padre/mis-hijos', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!resHijos.data || !resHijos.data.hijos || resHijos.data.hijos.length === 0) {
          setMensajeError('No tienes hijos registrados actualmente.');
          setCargandoDatos(false);
          return;
        }

        const firstChild = resHijos.data.hijos[0];
        setHijoId(firstChild._id);
        setNombreEstudiante(firstChild.nombre);
        
        const lat = firstChild.latitud || firstChild.lat;
        const lng = firstChild.longitud || firstChild.lng;
        if (lat && lng) {
          setCoordenadasHijo({ latitude: Number(lat), longitude: Number(lng) });
        } else {
          setCoordenadasHijo({ latitude: 8.9833, longitude: -79.5167 });
        }

        const condId = firstChild.conductor_id;
        if (!condId) {
          setMensajeError('Este estudiante no tiene un conductor asignado actualmente.');
          setCargandoDatos(false);
          return;
        }
        setConductorId(condId);

        // Obtener el perfil y la ruta del conductor
        try {
          const resPerfil = await api.get(`/api/conductor/${condId}/perfil`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resPerfil.data && resPerfil.data.conductor) {
            const cond = resPerfil.data.conductor;
            setNombreConductor(`${cond.nombre} ${cond.apellido}`);
          }
        } catch (err) {
          console.log('Error al buscar perfil del conductor:', err.message);
        }

        let rutaObtenida = null;
        try {
          const resRuta = await api.get(`/api/conductor/${condId}/ruta`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resRuta.data && resRuta.data.ruta) {
            rutaObtenida = resRuta.data.ruta;
            setRutaInfo(resRuta.data.ruta);
          }
        } catch (err) {
          console.log('Error al buscar ruta del conductor:', err.message);
        }

        if (!rutaObtenida) {
          setMensajeError('El conductor asignado no tiene una ruta configurada.');
          setCargandoDatos(false);
          return;
        }

        // Obtener viaje activo
        try {
          const resViaje = await api.get(`/api/viajes/activo/padre`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resViaje.data && Array.isArray(resViaje.data) && resViaje.data.length > 0) {
            const viaje = resViaje.data.find(v => v.conductor_id === condId && v.estado === 'activo');
            if (viaje) {
              setEstadoRuta('progreso');
              setDatosViaje(viaje);
              setTipoViaje(viaje.tipo_viaje || 'ida');
              
              if (viaje.asistencias && viaje.asistencias.length > 0) {
                const miAsistencia = viaje.asistencias.filter(a => a.hijo_id === firstChild._id);
                if (miAsistencia.length > 0) {
                  const ultima = miAsistencia[miAsistencia.length - 1];
                  let tipoNormalizado = ultima.tipo;
                  if (ultima.tipo === 'subida' || ultima.tipo === 'abordado') tipoNormalizado = 'abordado';
                  if (ultima.tipo === 'bajada' || ultima.tipo === 'entregado') tipoNormalizado = 'entregado';
                  setEstadoEstudiante(tipoNormalizado);
                }
                setLogEventos(miAsistencia);
              }
            } else {
              setEstadoRuta('espera');
              setDatosViaje(null);
              setTipoViaje('ida');
            }
          } else {
            setEstadoRuta('espera');
            setDatosViaje(null);
            setTipoViaje('ida');
          }
        } catch (err) {
          if (err.response?.status !== 404) {
             console.log('Error al buscar viaje activo del padre:', err.response?.data || err.message);
          }
          setEstadoRuta('espera');
          setDatosViaje(null);
          setTipoViaje('ida');
        }

      } catch (error) {
        console.error('Error cargando datos del padre:', error);
        setMensajeError('Error al conectar con el servidor.');
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatosPadre();
  }, []);

  // ──────────────────────────────────────────
  // SOCKET.IO (conexión, listeners y eventos)
  // ──────────────────────────────────────────
  useEffect(() => {
    if (socketRef.current) return;

    console.log('🔌 Inicializando conexión de Socket para padre.');
    const socketClient = io(BACKEND_URL);
    socketRef.current = socketClient;
    setSocket(socketClient);

    socketClient.on('connect', () => {
      console.log('🔌 Socket conectado para padre. ID:', socketClient.id);
      setConectado(true);
    });

    socketClient.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado para padre. Razón:', reason);
      setConectado(false);
    });

    socketClient.on('ruta:iniciada', (data) => {
      console.log('📥 Evento "ruta:iniciada" recibido para padre:', data);
      setEstadoRuta('progreso');
      setDatosViaje(data);
      if (data && data.tipo_viaje) {
        setTipoViaje(data.tipo_viaje);
      }
    });

    socketClient.on('ruta:ida_finalizada', (data) => {
      console.log('📥 Evento "ruta:ida_finalizada" recibido para padre. El viaje de ida terminó.');
      setEstadoRuta('progreso');
      setDatosViaje(prev => prev || (data ? data : { tipo_viaje: 'ida' }));
      setTipoViaje('ida');
      setLogEventos([]);
    });

    socketClient.on('ruta:transicion_vuelta', (data) => {
      console.log('📥 Evento "ruta:transicion_vuelta" recibido para padre:', data);
      setEstadoRuta('espera');
      setDatosViaje(null);
      setEstadoEstudiante('pendiente');
      setLogEventos([]);
    });

    socketClient.on('ruta:finalizada', () => {
      console.log('📥 Evento "ruta:finalizada" recibido para padre.');
      setEstadoRuta('espera');
      setDatosViaje(null);
      setEstadoEstudiante('pendiente');
      setLogEventos([]);
      setTipoViaje('ida');
    });

    socketClient.on('padre:actualizar_mapa', (coor) => {
      const nuevasCoords = {
        latitude: Number(coor.lat),
        longitude: Number(coor.lng),
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      };
      setCoordenadasBus(nuevasCoords);
      if (mapRef.current) {
        mapRef.current.animateToRegion(nuevasCoords, 800);
      }
    });

    socketClient.on('asistencia:actualizada', (data) => {
      console.log('Notificación de asistencia recibida para padre:', data);
      const idRecibido = data.hijo_id || data.estudianteId;
      if (idRecibido) {
        let tipoNormalizado = 'pendiente';
        if (data.tipo === 'subida' || data.tipo === 'abordado') tipoNormalizado = 'abordado';
        if (data.tipo === 'bajada' || data.tipo === 'entregado') tipoNormalizado = 'entregado';
        if (data.tipo === 'ausente') tipoNormalizado = 'ausente';

        setEstadoEstudiante(tipoNormalizado);
        setLogEventos(prev => [data, ...prev]);
      }
    });

  }, []);

  useEffect(() => {
    if (!socketRef.current || !rutaInfo || !rutaInfo._id || !hijoId) return;
    if (rutaIdRef.current === rutaInfo._id && socketRef.current.connected) return;

    rutaIdRef.current = rutaInfo._id;
    socketRef.current.emit('join:ruta', {
      id_ruta: rutaInfo._id,
      rol: 'padre',
      id_estudiante: hijoId
    });
  }, [hijoId, rutaInfo?._id]);

  // ──────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────
  const formatLogText = (item) => {
    const timeStr = new Date(item.fecha_hora).toLocaleTimeString();
    let action = '';
    
    if (item.tipo === 'subida' || item.tipo === 'abordado') {
      action = tipoViajeRef.current === 'ida' ? 'fue recogido en casa.' : 'abordó el bus en la escuela.';
    } else if (item.tipo === 'bajada' || item.tipo === 'entregado') {
      action = tipoViajeRef.current === 'ida' ? 'llegó seguro al Colegio.' : 'ha sido entregado en casa.';
    } else if (item.tipo === 'ausente') {
      action = 'fue reportado como ausente hoy.';
    } else {
      action = item.tipo;
    }
    return `[${timeStr}] Alumno ${action}`;
  };

  const renderTimeline = () => {
    const isIda = tipoViaje === 'ida';
    
    let currentStep = 0;
    if (estadoEstudiante === 'abordado') {
      currentStep = 1;
    } else if (estadoEstudiante === 'entregado') {
      currentStep = 2;
    }

    const steps = isIda ? [
      { title: 'Esperando en Casa', desc: 'El autobús va en camino a su domicilio.', activeText: 'En espera 🏠' },
      { title: 'Recogido en Casa', desc: 'Estudiante a bordo. Viajando al Colegio.', activeText: 'En ruta 🚌' },
      { title: 'Dejado en la Escuela', desc: 'Estudiante ha ingresado seguro al Colegio.', activeText: 'Llegada exitosa 🏫' }
    ] : [
      { title: 'Esperando en la Escuela', desc: 'Abordaje de alumnos en la escuela.', activeText: 'Preparando salida 🏫' },
      { title: 'Abordó en la Escuela', desc: 'Estudiante a bordo. Viajando hacia casa.', activeText: 'De camino a casa 🚌' },
      { title: 'Entregado en Casa', desc: 'Estudiante en casa. ¡Trayecto concluido!', activeText: 'Seguro en casa 🏠' }
    ];

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <View key={idx} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && styles.timelineDotCompleted,
                  isActive && styles.timelineDotActive
                ]}>
                  {isCompleted ? (
                    <Text style={styles.dotIcon}>✓</Text>
                  ) : (
                    <View style={isActive ? styles.innerDotActive : styles.innerDot} />
                  )}
                </View>
                {idx < steps.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    idx < currentStep && styles.timelineLineCompleted
                  ]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[
                  styles.timelineTitle,
                  isCompleted && styles.timelineTextCompleted,
                  isActive && styles.timelineTextActive
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.timelineDesc}>{step.desc}</Text>
                {isActive && (
                  <Text style={styles.timelineStatusBadge}>{step.activeText}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const colegioCoords = useMemo(() => {
    if (rutaInfo?.escuela_lat && rutaInfo?.escuela_lng) {
      return { latitude: Number(rutaInfo.escuela_lat), longitude: Number(rutaInfo.escuela_lng) };
    }
    return { latitude: 8.9975, longitude: -79.5240 };
  }, [rutaInfo]);

  const obtenerCoordenadasBusOffset = () => {
    const busCoords = { latitude: coordenadasBus.latitude, longitude: coordenadasBus.longitude };
    const coincideConHogar = coordenadasHijo &&
                             Math.abs(coordenadasHijo.latitude - busCoords.latitude) < 0.0001 &&
                             Math.abs(coordenadasHijo.longitude - busCoords.longitude) < 0.0001;
                             
    const coincideConColegio = Math.abs(colegioCoords.latitude - busCoords.latitude) < 0.0001 &&
                               Math.abs(colegioCoords.longitude - busCoords.longitude) < 0.0001;

    if (coincideConHogar || coincideConColegio) {
      return {
        latitude: busCoords.latitude + 0.0004,  // desplazamiento al norte
        longitude: busCoords.longitude
      };
    }
    return busCoords;
  };

  //    la condición de "viaje inactivo" depende EXCLUSIVAMENTE de datosViaje.
  //    Antes se calculaba como `!datosViaje || Object.keys(datosViaje).length === 0`,
  //    que podía dar true si datosViaje era un objeto vacío {}. 
  //    Ahora es simplemente datosViaje === null para mayor predictibilidad.
  const esViajeInactivo = datosViaje === null;

  const haLlegado = estadoEstudiante === 'entregado' || estadoEstudiante === 'bajada';

  //    'item' de logEventos se usa solo en la confirmación de entrega.
  const primerLogEvento = logEventos.length > 0 ? logEventos[0] : null;

  // ──────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────
  if (cargandoDatos) {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Cargando información del estudiante...</Text>
      </View>
    );
  }

  if (mensajeError) {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center', alignItems: 'center', flex: 1, padding: 30 }]}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🎒</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 10 }}>
          Seguimiento de Ruta
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 }}>
          {mensajeError}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Volver al Menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const debeMostrarConfirmacion = datosViaje !== null && (estadoEstudiante === 'entregado' || estadoEstudiante === 'bajada');

  if (datosViaje === null || estadoRuta === 'espera') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Seguimiento de Ruta</Text>
        <Text style={styles.subtitle}>
          Estado: {conectado ? '🟢 Servidor Conectado' : '🔴 Servidor Desconectado'}
        </Text>

        <View style={[styles.mapEsperaCard, { height: 250, marginVertical: 20 }]}> 
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 15 }} />
          <Text style={[styles.mapEsperaText, { fontSize: 16, color: '#1E293B', fontWeight: 'bold' }]}>Esperando que el conductor inicie la ruta.</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center' }}>
            La aplicación se actualizará automáticamente en cuanto comience el recorrido.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Seguimiento de Ruta</Text>
      <Text style={styles.subtitle}>
        Estado: {conectado ? '🟢 Servidor Conectado' : '🔴 Servidor Desconectado'}
      </Text>

      {/* Ficha Informativa del Alumno (siempre visible) */}
      <View style={styles.estudianteCard}>
        <View style={styles.estudianteHeader}>
          <Text style={styles.estudianteLabel}>Estudiante Monitoreado:</Text>
          <View style={styles.estudianteBadge}>
            <Text style={styles.estudianteBadgeText}>{nombreEstudiante}</Text>
          </View>
        </View>
        <Text style={styles.estudianteDetail}>Ruta Asignada: {rutaInfo?.nombre || 'N/A'}</Text>
        <Text style={styles.estudianteDetail}>Conductor: {nombreConductor} (Escuela: {rutaInfo?.escuela || 'N/A'})</Text>
      </View>

      {/*
        ── ÁRBOL DE RENDERIZADO CONDICIONAL (flujo cronológico correcto) ──

        Paso 1 (ESPERA): datosViaje === null
          → Pantalla de espera limpia con ActivityIndicator y mensaje.
          → NO se muestra nada del mapa ni de la línea de tiempo.

        Paso 2 (EN PROGRESO): datosViaje !== null
          → Se evalúa el estado del estudiante para mostrar sub-pantallas:
            a) haLlegado === true       → Tarjeta de confirmación de entrega
            b) ausente                  → Tarjeta de alerta de ausencia
            c) en tránsito              → Línea de tiempo + mapa en vivo

        Paso 3 (VUELTA A ESPERA): al recibir 'ruta:finalizada', datosViaje vuelve a
          null y el padre regresa automáticamente al Paso 1.
      */}

      {haLlegado ? (
        // a) Confirmación de entrega segura
        <View style={styles.confirmacionCard}>
          <Text style={styles.confirmacionEmoji}>🎉</Text>
          <Text style={styles.confirmacionTitle}>¡Llegada Segura Confirmada!</Text>
              <Text style={styles.confirmacionDesc}>
                Su hijo(a) <Text style={{ fontWeight: 'bold' }}>{nombreEstudiante}</Text> ha sido{' '}
                {tipoViaje === 'ida' ? 'dejado(a) en la Escuela' : 'entregado(a) en Casa'} de forma segura.
              </Text>
              <View style={styles.confirmacionInfoBox}>
                <Text style={styles.confirmacionInfoText}>
                  🕒 Hora de Entrega: {primerLogEvento?.fecha_hora
                    ? new Date(primerLogEvento.fecha_hora).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </Text>
                <Text style={styles.confirmacionInfoText}>
                  📌 Destino: {tipoViaje === 'ida' ? (rutaInfo?.escuela || 'Colegio') : 'Hogar de la Estudiante'}
                </Text>
                <Text style={styles.confirmacionInfoText}>
                  🛡️ Verificado mediante: Lectura de Código QR o Confirmación Manual
                </Text>
              </View>
              <TouchableOpacity
                style={styles.btnCerrarConfirmacion}
                onPress={() => {
                  setDatosViaje(null);
                  setEstadoRuta('espera');
                  setEstadoEstudiante('pendiente');
                  setLogEventos([]);
                }}
              >
                <Text style={styles.btnCerrarConfirmacionText}>Entendido / Cerrar</Text>
              </TouchableOpacity>
            </View>

          ) : estadoEstudiante === 'ausente' ? (
            // b) Alerta de ausencia
            <View style={styles.alertaAusenteCard}>
              <Text style={styles.alertaAusenteText}>
                ⚠️ Estudiante reportado como ausente hoy
              </Text>
              <Text style={styles.alertaAusenteDesc}>
                El conductor ha registrado la ausencia del estudiante en este recorrido. Si considera que es un error, por favor comuníquese directamente.
              </Text>
            </View>

          ) : (
            // c) Viaje en tránsito: línea de tiempo + mapa en vivo
            <>
              <View style={styles.progresoCard}>
                <Text style={styles.sectionTitle}>Línea de Tiempo del Alumno</Text>
                {renderTimeline()}
              </View>

              <View style={styles.mapWrapper}>
                <Text style={styles.mapTitle}>🗺️ Mapa de Localización en Vivo:</Text>

                {/* ── FIX #11: el mapa SIEMPRE se muestra cuando datosViaje !== null.*/}
                <MapView
                  ref={mapRef}
                  style={styles.mapaFisico}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={coordenadasBus}
                  zoomEnabled={true}
                >
                  <Marker 
                    coordinate={obtenerCoordenadasBusOffset()}
                    title="Autobús Escolar"
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={99}
                  >
                    <View style={styles.customMarkerBus}>
                      <Text style={styles.markerEmoji}>🚌</Text>
                    </View>
                  </Marker>

                  {coordenadasHijo && (
                    <Marker
                      coordinate={coordenadasHijo}
                      title={`Hogar de ${nombreEstudiante}`}
                      description="Punto de Recogida/Entrega"
                      zIndex={5}
                    >
                      <View style={[styles.customMarkerHito, { backgroundColor: '#3B82F6' }]}>
                        <Text style={styles.markerEmojiSmall}>🏠</Text>
                      </View>
                    </Marker>
                  )}

                  <Marker
                    coordinate={colegioCoords}
                    title={rutaInfo?.escuela || 'Colegio'}
                    description="Destino / Origen Escolar"
                    zIndex={5}
                  >
                    <View style={[styles.customMarkerHito, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.markerEmojiSmall}>🏫</Text>
                    </View>
                  </Marker>
                </MapView>
              </View>
            </>
          )}

      <View style={styles.logsBox}>
        <Text style={styles.logTitle}>📋 Eventos del Alumno:</Text>
        {logEventos.length === 0 ? (
          <Text style={styles.emptyLogsText}>No se registran eventos de asistencia aún.</Text>
        ) : (
          logEventos.map((logItem, index) => (
            <Text key={index} style={[
              styles.logText,
              logItem.tipo === 'ausente' && { color: '#DC2626' },
              (logItem.tipo === 'subida' || logItem.tipo === 'abordado') && { color: '#16A34A' },
              (logItem.tipo === 'bajada' || logItem.tipo === 'entregado') && { color: '#2563EB' }
            ]}>
              ✅ {formatLogText(logItem)}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, backgroundColor: '#F8FAFC', paddingBottom: 50 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 40, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20, textAlign: 'center' },

  // Ficha estudiante
  estudianteCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  estudianteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  estudianteLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  estudianteBadge: { backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  estudianteBadgeText: { fontSize: 12, color: '#2563EB', fontWeight: 'bold' },
  estudianteDetail: { fontSize: 13, color: '#334155', marginVertical: 2 },

  // Confirmación Entrega Card
  confirmacionCard: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1.5, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  confirmacionEmoji: { fontSize: 48, marginBottom: 10 },
  confirmacionTitle: { fontSize: 18, fontWeight: 'bold', color: '#065F46', marginBottom: 6 },
  confirmacionDesc: { fontSize: 13, color: '#047857', textAlign: 'center', lineHeight: 20, marginBottom: 15 },
  confirmacionInfoBox: { backgroundColor: '#FFF', width: '100%', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  confirmacionInfoText: { fontSize: 12, color: '#065F46', marginVertical: 3, fontWeight: '500' },
  btnCerrarConfirmacion: { marginTop: 18, backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  btnCerrarConfirmacionText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },

  // Alerta Ausencia
  alertaAusenteCard: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  alertaAusenteText: { fontSize: 15, fontWeight: 'bold', color: '#DC2626', marginBottom: 6 },
  alertaAusenteDesc: { fontSize: 12, color: '#7F1D1D', lineHeight: 18 },

  // Card Progreso / Timeline
  progresoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Línea de tiempo (Vertical)
  timelineContainer: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', minHeight: 65 },
  timelineLeft: { alignItems: 'center', marginRight: 15, width: 30 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineDotActive: { backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#EFF6FF' },
  timelineDotCompleted: { backgroundColor: '#10B981' },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' },
  innerDotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  dotIcon: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  timelineLine: { width: 3, flex: 1, backgroundColor: '#E2E8F0', position: 'absolute', top: 24, bottom: -12, zIndex: 1 },
  timelineLineCompleted: { backgroundColor: '#10B981' },
  timelineRight: { flex: 1, paddingTop: 2 },
  timelineTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
  timelineTextCompleted: { color: '#10B981' },
  timelineTextActive: { color: '#3B82F6' },
  timelineDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2, lineHeight: 15 },
  timelineStatusBadge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: 'bold', color: '#FFF', backgroundColor: '#3B82F6', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginTop: 5, overflow: 'hidden' },

  // Mapa
  mapWrapper: { marginBottom: 20 },
  mapTitle: { color: '#1E293B', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  mapaFisico: { width: '100%', height: Dimensions.get('window').height * 0.32, borderRadius: 12 },
  mapEsperaCard: { width: '100%', height: Dimensions.get('window').height * 0.32, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', padding: 20 },
  mapEsperaText: { color: '#D97706', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  
  // Marcadores mapa
  customMarkerBus: { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  customMarkerHito: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', elevation: 3 },
  markerEmoji: { fontSize: 26 },
  markerEmojiSmall: { fontSize: 13 },

  // Logs
  logsBox: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, marginBottom: 25 },
  logTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  emptyLogsText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' },
  logText: { fontSize: 11, color: '#334155', fontFamily: 'monospace', marginVertical: 3 }
});