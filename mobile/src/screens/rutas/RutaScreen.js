import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, TextInput, Alert, ActivityIndicator,
  Platform, Animated, Keyboard, FlatList, KeyboardAvoidingView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth } from '../../config/firebase';
import api from '../../config/api';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RutaScreen({ navigation, route }) {
  const { usuario } = route.params;
  const esPadre = usuario.tipo === 'padre';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerSub}>BusWay</Text>
              <Text style={styles.headerTitle}>
                {esPadre ? 'Mi Ruta' : 'Mis Rutas'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Card blanca */}
        <View style={styles.card}>
          {esPadre
            ? <RutaPadre navigation={navigation} usuario={usuario} route={route} />
            : <RutaConductor navigation={navigation} usuario={usuario} />
          }
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function turnoLabel(horaStr, sufijo) {
  const match = horaStr && horaStr.match(/\b(AM|PM)\b/i);
  if (!match) return sufijo;
  const turno = match[1].toUpperCase() === 'PM' ? 'Tarde' : 'Mañana';
  return `${turno} (${sufijo})`;
}

//  ── VISTA PADRE ──────────────────────────────────────────
function RutaPadre({ navigation, usuario, route }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ruta, setRuta] = useState(null);
  const [hijos, setHijos] = useState([]);
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);
  const [mostrarGrid, setMostrarGrid] = useState(false);

  const uniqueRutas = useMemo(() => Array.from(new Set(
    hijos.map(h => h.ruta_id?._id?.toString() || h.ruta_id?.toString()).filter(Boolean)
  )), [hijos]);

  // TODO: revisar si sigue siendo necesario tras quitar navigation.navigate('Ruta', { hijoSeleccionado })
  useEffect(() => {
    if (route?.params?.hijoSeleccionado) {
      setHijoSeleccionado(route.params.hijoSeleccionado);
      setMostrarGrid(false);
    }
  }, [route?.params?.hijoSeleccionado]);

  useEffect(() => {
    const cargarHijos = async () => {
      try {
        setLoading(true);
        setError('');

        if (!auth.currentUser) {
          setError('Por favor, inicia sesión para continuar.');
          setLoading(false);
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const resHijos = await api.get('/api/padre/mis-hijos', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!resHijos.data || !resHijos.data.hijos || resHijos.data.hijos.length === 0) {
          setError('No tienes hijos registrados actualmente.');
          setLoading(false);
          return;
        }

        const lista = resHijos.data.hijos;
        setHijos(lista);

        if (!hijoSeleccionado && !route?.params?.hijoSeleccionado) {
          setHijoSeleccionado(lista[0]);
        }
        setMostrarGrid(false);
      } catch (error) {
        console.error('Error cargando hijos:', error);
        setError('Error al conectar con el servidor.');
        setLoading(false);
      }
    };

    cargarHijos();

    const unsubscribe = navigation.addListener('focus', () => {
      cargarHijos();
    });

    return unsubscribe;
  }, [navigation, usuario]);

  useEffect(() => {
    if (!hijoSeleccionado?._id) return;

    const cargarDatosConductorYRuta = async () => {
      try {
        setLoading(true);
        setError('');

        const condId = hijoSeleccionado.conductor_id && typeof hijoSeleccionado.conductor_id === 'object'
          ? hijoSeleccionado.conductor_id._id
          : hijoSeleccionado.conductor_id;
        const activeRutaId = hijoSeleccionado.ruta_id && typeof hijoSeleccionado.ruta_id === 'object'
          ? hijoSeleccionado.ruta_id._id
          : hijoSeleccionado.ruta_id;

        if (!condId) {
          setRuta(null);
          setLoading(false);
          return;
        }

        const token = await auth.currentUser.getIdToken();

        let activeAgreement = null;
        try {
          const resAcuerdo = await api.get('/api/acuerdos/mis-acuerdos', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resAcuerdo.data && resAcuerdo.data.acuerdo) {
            activeAgreement = resAcuerdo.data.acuerdo;
          }
        } catch (err) {
          console.log('Error fetching active agreement:', err.message);
        }

        let condInfo = null;
        let vehiculoInfo = null;
        try {
          const resPerfil = await api.get(`/api/conductor/${condId}/perfil`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resPerfil.data) {
            condInfo = resPerfil.data.conductor;
            vehiculoInfo = resPerfil.data.vehiculo;
          }
        } catch (err) {
          console.log('Error al buscar perfil del conductor:', err.message);
        }

        let rutaInfo = null;
        try {
          const resRuta = await api.get(`/api/conductor/${condId}/ruta?ruta_id=${activeRutaId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resRuta.data && resRuta.data.ruta) {
            rutaInfo = resRuta.data.ruta;
          }
        } catch (err) {
          console.log('Error al buscar ruta del conductor:', err.message);
        }

        if (!rutaInfo) {
          setError('El conductor asignado no tiene una ruta configurada.');
          setLoading(false);
          return;
        }

        const destinoEscuela = rutaInfo.escuela_id
          ? (typeof rutaInfo.escuela_id === 'object' ? (rutaInfo.escuela_id.nombre || rutaInfo.escuela) : rutaInfo.escuela)
          : (rutaInfo.escuela || 'Escuela asignada');

        const paradasIdaList = [
          { descripcion: `Punto de recogida — Tu hogar`, hora: rutaInfo.horario?.split('—')[0]?.trim() || '6:30 AM' },
          { descripcion: `Destino — ${destinoEscuela}`, hora: rutaInfo.horario?.split('—')[1]?.trim() || '7:15 AM' }
        ];

        const paradasVueltaList = [
          { descripcion: `Punto de recogida — ${destinoEscuela}`, hora: 'Salida de clases' },
          { descripcion: `Destino — Hogar de ${hijoSeleccionado.nombre}`, hora: 'Retorno a casa' }
        ];

        const formatFrecuencia = (frec) => {
          if (!frec) return 'Lunes a Viernes';
          if (typeof frec === 'string') return frec;
          if (Array.isArray(frec)) {
            const hasLaV = frec.length === 5 && 
              frec.includes('Lunes') && 
              frec.includes('Martes') && 
              frec.includes('Miércoles') && 
              frec.includes('Jueves') && 
              frec.includes('Viernes');
            if (hasLaV) return 'Lunes a Viernes';
            if (frec.length === 7) return 'Todos los días';
            return frec.join(', ');
          }
          return 'Lunes a Viernes';
        };

        setRuta({
          conductor: {
            nombre: condInfo ? `${condInfo.nombre} ${condInfo.apellido}` : 'Carlos Pérez',
            telefono: condInfo?.telefono || condInfo?.datos_conductor?.telefono || '6500-1234',
            vehiculo: vehiculoInfo ? `${vehiculoInfo.marca} ${vehiculoInfo.modelo} (${vehiculoInfo.anio})` : 'Toyota Coaster 2020',
            placa: vehiculoInfo?.placa || 'BC-8888',
            asientos: vehiculoInfo?.num_asientos || 30,
            rating: condInfo?.datos_conductor?.calificacion_promedio || 4.8,
            reviews: condInfo?.datos_conductor?.total_reviews || 23,
            verificado: condInfo?.estado === 'activo',
          },
          escuela: destinoEscuela,
          zona: rutaInfo.zona || 'Arraiján',
          frecuencia: formatFrecuencia(rutaInfo.frecuencia),
          horario: rutaInfo.horario || '6:30 AM — 7:15 AM',
          tarifa: activeAgreement ? activeAgreement.tarifa_mensual : (condInfo?.datos_conductor?.tarifa || 80),
          mesActual: activeAgreement ? activeAgreement.mes_actual : 1,
          totalMeses: activeAgreement ? activeAgreement.total_meses : 10,
          paradasIda: paradasIdaList,
          paradasVuelta: paradasVueltaList,
          rutaIdActiva: activeRutaId != null ? String(activeRutaId) : null,
          hijos: hijos.map(h => ({
            id: h._id,
            nombre: h.nombre,
            estado: h.estado || 'Activo',
            ruta_id: h.ruta_id?._id?.toString() || h.ruta_id?.toString() || null,
          })),
        });
      } catch (error) {
        console.error('Error cargando datos de conductor/ruta:', error);
        setError('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosConductorYRuta();
  }, [hijoSeleccionado?._id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <ActivityIndicator size="large" color="#0D1B3E" />
        <Text style={{ marginTop: 10, color: '#888' }}>Cargando detalles de tu ruta...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EstadoVacio
        icon="alert-circle-outline"
        titulo="Error al cargar la ruta"
        desc={error}
        btnTexto="Volver"
        onPress={() => navigation.goBack()}
      />
    );
  }

  if (!hijoSeleccionado) return null;

  if (!ruta) {
    return (
      <EstadoVacio
        icon="map-outline"
        titulo="Sin ruta activa"
        desc="Cuando contrates a un conductor desde el Marketplace, aquí verás la ruta fija de tu hijo."
        btnTexto="Ir al Marketplace"
        onPress={() => navigation.navigate('Marketplace', { usuario })}
      />
    );
  }

  const progreso = (ruta.mesActual / ruta.totalMeses) * 100;
  const mostrarSelectorHijos = hijos.length > 1 && uniqueRutas.length > 1;
  const hijosEnEstaRuta = ruta.hijos.filter(h => h.ruta_id === ruta.rutaIdActiva);
  const gruposPorRuta = uniqueRutas.map(rutaId => {
    const hijosDeRuta = hijos.filter(h => (h.ruta_id?._id?.toString() || h.ruta_id?.toString()) === rutaId);
    return { rutaId, representante: hijosDeRuta[0], extra: hijosDeRuta.length - 1 };
  });

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      {/* Selector de hijos (chips) */}
      {mostrarSelectorHijos && (
        <>
          <Text style={styles.sectionLabel}>Rutas de tus hijos asignados</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hijosChipsRow}
          >
            {gruposPorRuta.map((grupo) => {
              const hijo = grupo.representante;
              const seleccionado = hijoSeleccionado?._id === hijo._id;
              return (
                <TouchableOpacity
                  key={grupo.rutaId}
                  style={[styles.hijoChip, seleccionado && styles.hijoChipSeleccionado]}
                  onPress={() => setHijoSeleccionado(hijo)}
                >
                  <View style={[styles.hijoAvatar, seleccionado && styles.hijoChipAvatarSeleccionado]}>
                    <Text style={[styles.hijoAvatarText, seleccionado && styles.hijoChipAvatarTextSeleccionado]}>
                      {hijo.nombre.charAt(0)}
                    </Text>
                    {grupo.extra > 0 && (
                      <View style={styles.hijoChipExtraBadge}>
                        <Text style={styles.hijoChipExtraBadgeText}>+{grupo.extra}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.hijoChipNombre, seleccionado && styles.hijoChipNombreSeleccionado]}>
                    {hijo.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Tarjeta del conductor */}
      <Text style={[styles.sectionLabel, { marginTop: mostrarSelectorHijos ? 20 : 0 }]}>Conductor asignado</Text>
      <View style={styles.conductorCard}>
        <View style={styles.conductorCardTop}>
          <View style={styles.avatarGrande}>
            <Text style={styles.avatarGrandeText}>{ruta.conductor.nombre.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowGap}>
              <Text style={styles.conductorNombre}>{ruta.conductor.nombre}</Text>
              {ruta.conductor.verificado && (
                <View style={styles.verificadoBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#0D1B3E" />
                  <Text style={styles.verificadoText}>Verificado</Text>
                </View>
              )}
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s} name={s <= Math.round(ruta.conductor.rating) ? 'star' : 'star-outline'} size={12} color="#FFD700" />
              ))}
              <Text style={styles.ratingTexto}>{ruta.conductor.rating} ({ruta.conductor.reviews} reseñas)</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.btnWhatsapp}
            onPress={async () => {
              const telefono = ruta.conductor.telefono;
              if (!telefono) {
                Alert.alert('Error', 'El conductor no tiene un número de teléfono registrado.');
                return;
              }
              const num = telefono.replace(/[^0-9]/g, '');
              const fullNum = num.startsWith('507') ? num : `507${num}`;
              const mensaje = `Hola, buenas. Quería consultarle sobre el servicio de BusWay.`;
              const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(mensaje)}`;
              try {
                const soportado = await Linking.canOpenURL(url);
                if (soportado) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
                }
              } catch (err) {
                console.log('Error opening whatsapp link:', err);
                Alert.alert('Error', 'No se pudo abrir WhatsApp.');
              }
            }}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <FilaInfo icon="bus-outline" label="Vehículo" valor={ruta.conductor.vehiculo} />
        <FilaInfo icon="card-outline" label="Placa" valor={ruta.conductor.placa} />
        <FilaInfo icon="call-outline" label="Teléfono" valor={ruta.conductor.telefono} last />
      </View>

      {/* Info de la ruta */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Detalles de la ruta</Text>
      <View style={styles.infoCard}>
        <FilaInfo icon="school-outline" label="Escuela" valor={ruta.escuela} />
        <FilaInfo icon="location-outline" label="Zona de recogida" valor={ruta.zona} />
        <FilaInfo icon="time-outline" label="Horario" valor={ruta.horario} />
        <FilaInfo icon="calendar-outline" label="Frecuencia" valor={ruta.frecuencia} />
        <FilaInfo icon="card-outline" label="Tarifa mensual" valor={`$${ruta.tarifa}/mes`} last />
      </View>

      {/* Hijos en esta ruta */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
        {hijosEnEstaRuta.length === 1 ? 'Hijo en esta ruta' : 'Hijos en esta ruta'}
      </Text>
      <View style={styles.infoCard}>
        {hijosEnEstaRuta.map((hijo, i) => (
          <View
            key={hijo.id}
            style={[styles.hijoRow, i < hijosEnEstaRuta.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}
          >
            <View style={styles.hijoAvatar}>
              <Text style={styles.hijoAvatarText}>{hijo.nombre.charAt(0)}</Text>
            </View>
            <Text style={styles.hijoNombre}>{hijo.nombre}</Text>
            <View style={styles.estadoActivoBadge}>
              <View style={styles.estadoPunto} />
              <Text style={styles.estadoActivoText}>{hijo.estado}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Paradas / Recorrido */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Recorrido</Text>
      <View style={{ gap: 12 }}>
        {/* Recorrido de Ida */}
        <View style={styles.paradasCard}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase' }}>{turnoLabel(ruta.paradasIda[0]?.hora, 'Ida')}</Text>
          {ruta.paradasIda.map((parada, i) => {
            const esUltima = i === ruta.paradasIda.length - 1;
            const esPrimera = i === 0;
            return (
              <View key={i} style={styles.paradaRow}>
                <View style={styles.paradaTimeline}>
                  <View style={[
                    styles.paradaPunto,
                    esPrimera && styles.paradaPuntoPrimero,
                    esUltima && styles.paradaPuntoUltimo,
                  ]} />
                  {!esUltima && <View style={styles.paradaLinea} />}
                </View>
                <View style={styles.paradaContenido}>
                  <Text style={[styles.paradaDesc, (esPrimera || esUltima) && { fontWeight: '700', color: '#0D1B3E' }]}>
                    {parada.descripcion}
                  </Text>
                  <Text style={styles.paradaHora}>{parada.hora}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recorrido de Vuelta */}
        <View style={styles.paradasCard}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase' }}>{turnoLabel(ruta.paradasVuelta[0]?.hora, 'Vuelta')}</Text>
          {ruta.paradasVuelta.map((parada, i) => {
            const esUltima = i === ruta.paradasVuelta.length - 1;
            const esPrimera = i === 0;
            return (
              <View key={i} style={styles.paradaRow}>
                <View style={styles.paradaTimeline}>
                  <View style={[
                    styles.paradaPunto,
                    esPrimera && { backgroundColor: '#FFD700' }, // Amarillo para escuela
                    esUltima && { backgroundColor: '#16A34A' }, // Verde para casa
                  ]} />
                  {!esUltima && <View style={styles.paradaLinea} />}
                </View>
                <View style={styles.paradaContenido}>
                  <Text style={[styles.paradaDesc, (esPrimera || esUltima) && { fontWeight: '700', color: '#0D1B3E' }]}>
                    {parada.descripcion}
                  </Text>
                  <Text style={styles.paradaHora}>{parada.hora}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Progreso del contrato */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Contrato activo</Text>
      <View style={styles.contratoCard}>
        <View style={styles.contratoHeader}>
          <Text style={styles.contratoMes}>Mes {ruta.mesActual} de {ruta.totalMeses}</Text>
          <Text style={styles.contratoPct}>{Math.round(progreso)}%</Text>
        </View>
        <View style={styles.barraBase}>
          <View style={[styles.barraRelleno, { width: `${progreso}%` }]} />
        </View>
        <Text style={styles.contratoNote}>
          Quedan {ruta.totalMeses - ruta.mesActual} meses para completar el contrato.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── VISTA CONDUCTOR ──────────────────────────────────────────
// ─── Componentes Auxiliares para Frecuencia ───────────────────────────────────
function DayChip({ label, selected, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.dayChip,
          selected ? styles.dayChipSelected : styles.dayChipUnselected
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.dayChipText,
          selected ? styles.dayChipTextSelected : styles.dayChipTextUnselected
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function renderFrecuenciaTextoUChips(frecuencia) {
  let dias = [];
  if (typeof frecuencia === 'string') {
    if (frecuencia === 'Lunes a Viernes') {
      dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    } else if (frecuencia === 'Todos los días') {
      dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    } else {
      return <Text style={styles.rutaStatText}>{frecuencia}</Text>;
    }
  } else if (Array.isArray(frecuencia)) {
    dias = frecuencia;
  } else {
    return <Text style={styles.rutaStatText}>Lunes a Viernes</Text>;
  }

  const esLaV = dias.length === 5 && 
    dias.includes('Lunes') && 
    dias.includes('Martes') && 
    dias.includes('Miércoles') && 
    dias.includes('Jueves') && 
    dias.includes('Viernes');

  const esTodos = dias.length === 7;

  if (esLaV) {
    return <Text style={styles.rutaStatText}>Lunes a Viernes</Text>;
  }
  if (esTodos) {
    return <Text style={styles.rutaStatText}>Todos los días</Text>;
  }

  const dMap = {
    'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'X', 'Jueves': 'J',
    'Viernes': 'V', 'Sábado': 'S', 'Domingo': 'D'
  };

  const ordenSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <View style={styles.miniChipsContainer}>
      {ordenSemana.map(d => {
        const selected = dias.includes(d);
        return (
          <View
            key={d}
            style={[
              styles.miniChip,
              selected ? styles.miniChipSelected : styles.miniChipUnselected
            ]}
          >
            <Text style={[
              styles.miniChipText,
              selected ? styles.miniChipTextSelected : styles.miniChipTextUnselected
            ]}>
              {dMap[d]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function RutaConductor({ navigation, usuario }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [formEscuelaLat, setFormEscuelaLat] = useState(null);
  const [formEscuelaLng, setFormEscuelaLng] = useState(null);

  // Formulario de creación
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [conductorVehiculo, setConductorVehiculo] = useState(null);
  const [formEscuelaId, setFormEscuelaId] = useState('');
  const [formNombreRuta, setFormNombreRuta] = useState('');
  const [formZona, setFormZona] = useState('');
  const [formSalidaDate, setFormSalidaDate] = useState(null);
  const [formLlegadaDate, setFormLlegadaDate] = useState(null);
  const [showSalidaPicker, setShowSalidaPicker] = useState(false);
  const [showLlegadaPicker, setShowLlegadaPicker] = useState(false);
  const [formSalidaVueltaDate, setFormSalidaVueltaDate] = useState(null);
  const [showSalidaVueltaPicker, setShowSalidaVueltaPicker] = useState(false);
  const [listaEscuelas, setListaEscuelas] = useState([]);
  
  // Frecuencia por chips
  const [formFrecuencia, setFormFrecuencia] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

  // Selector de escuelas
  const [mostrarListaEscuelas, setMostrarListaEscuelas] = useState(false);
  const [busquedaEscuela, setBusquedaEscuela] = useState('');
  
  const [formErrores, setFormErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [rutaIdEditando, setRutaIdEditando] = useState(null);

  const DAYS = [
    { key: 'Lunes', label: 'L' },
    { key: 'Martes', label: 'M' },
    { key: 'Miércoles', label: 'X' },
    { key: 'Jueves', label: 'J' },
    { key: 'Viernes', label: 'V' },
    { key: 'Sábado', label: 'S' },
    { key: 'Domingo', label: 'D' }
  ];

  const toggleDia = (dia) => {
    if (formFrecuencia.includes(dia)) {
      setFormFrecuencia(formFrecuencia.filter(d => d !== dia));
    } else {
      setFormFrecuencia([...formFrecuencia, dia]);
    }
  };

  const seleccionarPreset = (tipo) => {
    if (tipo === 'L-V') {
      setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    } else if (tipo === 'todos') {
      setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    }
  };

  const toggleListaEscuelas = () => {
    setMostrarListaEscuelas(!mostrarListaEscuelas);
  };

  const seleccionarEscuela = (escId) => {
    setFormEscuelaId(escId);
    setMostrarListaEscuelas(false);
    setBusquedaEscuela('');
    const escObj = listaEscuelas.find(e => e._id === escId);
    if (escObj) {
      if (escObj.distrito) {
        setFormZona(escObj.distrito);
      }
      if (escObj.lat) {
        setFormEscuelaLat(escObj.lat);
      }
      if (escObj.lng) {
        setFormEscuelaLng(escObj.lng);
      }
    }
  };

  const obtenerProvinciaPorPlaca = (placa) => {
    if (!placa) return null;
    const cleanPlaca = placa.trim().toUpperCase();
    const match = cleanPlaca.match(/^\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      switch (num) {
        case 1: return 'Bocas del Toro';
        case 2: return 'Coclé';
        case 3: return 'Colón';
        case 4: return 'Chiriquí';
        case 5: return 'Darién';
        case 6: return 'Herrera';
        case 7: return 'Los Santos';
        case 8: return 'Panamá';
        case 9: return 'Veraguas';
        case 10: return 'Guna Yala';
        case 11: return 'Emberá-Wounaan';
        case 12: return 'Ngäbe-Buglé';
        case 13: return 'Panamá Oeste';
        default: break;
      }
    }
    const innerMatch = cleanPlaca.match(/(?:^|[A-Z-])(\d+)(?:[A-Z-]|$)/);
    if (innerMatch) {
      const num = parseInt(innerMatch[1], 10);
      switch (num) {
        case 1: return 'Bocas del Toro';
        case 2: return 'Coclé';
        case 3: return 'Colón';
        case 4: return 'Chiriquí';
        case 5: return 'Darién';
        case 6: return 'Herrera';
        case 7: return 'Los Santos';
        case 8: return 'Panamá';
        case 9: return 'Veraguas';
        case 10: return 'Guna Yala';
        case 11: return 'Emberá-Wounaan';
        case 12: return 'Ngäbe-Buglé';
        case 13: return 'Panamá Oeste';
        default: break;
      }
    }
    return null;
  };

  const provinciaConductor = conductorVehiculo ? obtenerProvinciaPorPlaca(conductorVehiculo.placa) : null;

  const escuelasFiltradas = listaEscuelas.filter(esc => {
    const matchesSearch = esc.nombre.toLowerCase().includes(busquedaEscuela.toLowerCase());
    if (!provinciaConductor) return matchesSearch;
    return matchesSearch && esc.provincia === provinciaConductor;
  });

  const fetchConductorRutaYEstudiantes = async () => {
    try {
      setLoading(true);
      setError('');

      if (!auth.currentUser) {
        setError('Por favor, inicia sesión para continuar.');
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();

      // Obtener el perfil y vehículo del conductor para filtro por placa
      try {
        const resPerfil = await api.get('/api/auth/perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resPerfil.data && resPerfil.data.vehiculo) {
          setConductorVehiculo(resPerfil.data.vehiculo);
        }
      } catch (err) {
        console.log('Error fetching conductor profile/vehiculo:', err.message);
      }

      // Obtener la ruta del conductor
      const resRuta = await api.get('/api/conductor/ruta', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Obtener estudiantes asignados
      const resEst = await api.get('/api/conductor/estudiantes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const estudiantesObtenidos = resEst.data?.estudiantes || [];
      
      const conteoPorRuta = {};
      const mappedEstudiantes = estudiantesObtenidos.map((e) => {
        const rId = e.ruta_id && typeof e.ruta_id === 'object' ? e.ruta_id._id : (e.ruta_id || null);
        const rIdStr = rId ? rId.toString() : 'sin_ruta';
        
        if (conteoPorRuta[rIdStr] === undefined) {
          conteoPorRuta[rIdStr] = 0;
        }
        conteoPorRuta[rIdStr] += 1;
        const localIndex = conteoPorRuta[rIdStr];

        return {
          id: e._id,
          nombre: `${e.nombre} ${e.apellido || ''}`.trim(),
          zona: e.zona || 'Arraiján',
          escuela: e.escuela || (resRuta.data?.ruta?.escuela_id ? (typeof resRuta.data.ruta.escuela_id === 'object' ? resRuta.data.ruta.escuela_id.nombre : resRuta.data.ruta.escuela) : (resRuta.data?.ruta?.escuela || 'Colegio')),
          ruta_id: rId,
          inputPos: localIndex.toString(),
        };
      });

      setEstudiantes(mappedEstudiantes);

      if (resRuta.data) {
        const rutasBackend = resRuta.data.rutas || (resRuta.data.ruta ? [resRuta.data.ruta] : []);
        const mappedRutas = rutasBackend.map(r => ({
          id: r._id,
          nombre_ruta: r.nombre_ruta || r.nombre || 'Ruta sin nombre',
          escuela_id: r.escuela_id && typeof r.escuela_id === 'object' ? r.escuela_id._id : (r.escuela_id || null),
          escuela_nombre: r.escuela_id ? (typeof r.escuela_id === 'object' ? r.escuela_id.nombre : r.escuela) : (r.escuela || 'Escuela asignada'),
          zona: r.zona || 'Arraiján',
          zonas: r.zona ? [r.zona] : ['Arraiján'],
          alumnos: r.totalEstudiantes !== undefined ? r.totalEstudiantes : (r.estudiantes ? r.estudiantes.length : 0),
          activa: r.estado === 'activa',
          horario: (r.horario_salida && r.horario_llegada) ? `${r.horario_salida} — ${r.horario_llegada}` : (r.horario || '6:30 AM — 7:15 AM'),
          frecuencia: r.frecuencia,
          nombre: r.nombre,
          escuela_lat: r.escuela_lat || null,
          escuela_lng: r.escuela_lng || null,
          hora_salida_vuelta: r.hora_salida_vuelta || null
        }));
        setRutas(mappedRutas);
      } else {
        setRutas([]);
      }

    } catch (err) {
      console.error('Error cargando datos del conductor:', err);
      setError('Error al obtener la información de tu ruta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductorRutaYEstudiantes();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchConductorRutaYEstudiantes();
    });

    return unsubscribe;
  }, [navigation, usuario]);

  useEffect(() => {
    if (mostrarCrear) {
      const cargarEscuelas = async () => {
        try {
          const token = await auth.currentUser.getIdToken();
          const res = await api.get('/api/escuelas', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.escuelas) {
            setListaEscuelas(res.data.escuelas);
          }
        } catch (err) {
          console.error('Error al cargar escuelas:', err);
        }
      };
      cargarEscuelas();
    }
  }, [mostrarCrear]);

  const formatTime12h = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const validarFormulario = () => {
    const errores = {};
    if (!formEscuelaId) {
      errores.escuela_id = 'La escuela es obligatoria';
    }
    if (!formNombreRuta.trim()) {
      errores.nombre_ruta = 'El nombre de la ruta es obligatorio';
    }
    if (!formZona.trim()) {
      errores.zona = 'La zona es obligatoria';
    }
    if (!formSalidaDate) {
      errores.horario_salida = 'La hora de salida es obligatoria';
    }
    if (!formLlegadaDate) {
      errores.horario_llegada = 'La hora de llegada es obligatoria';
    }
    if (!formSalidaVueltaDate) {
      errores.hora_salida_vuelta = 'La hora de salida del colegio es obligatoria';
    }
    if (!formEscuelaLat || !formEscuelaLng) {
      errores.escuela_map = 'Debes marcar la ubicación de la escuela en el mapa';
    }
    if (formFrecuencia.length === 0) {
      errores.frecuencia = 'Selecciona al menos un día';
    }

    if (formSalidaDate && formLlegadaDate) {
      const salidaMinutos = formSalidaDate.getHours() * 60 + formSalidaDate.getMinutes();
      const llegadaMinutos = formLlegadaDate.getHours() * 60 + formLlegadaDate.getMinutes();
      if (llegadaMinutos <= salidaMinutos) {
        errores.horario_llegada = 'La hora de llegada debe ser posterior a la hora de salida';
      }
    }
    
    setFormErrores(errores);
    return Object.keys(errores).length === 0;
  };

  const handleCrearRuta = async () => {
    if (!validarFormulario()) return;
    
    try {
      setGuardando(true);
      setErrorGuardar('');
      const token = await auth.currentUser.getIdToken();
      
      const payload = {
        escuela_id: formEscuelaId,
        nombre_ruta: formNombreRuta.trim(),
        zona: formZona.trim(),
        horario_salida: formatTime12h(formSalidaDate),
        horario_llegada: formatTime12h(formLlegadaDate),
        frecuencia: formFrecuencia,
        escuela_lat: formEscuelaLat,
        escuela_lng: formEscuelaLng,
        hora_salida_vuelta: formatTime12h(formSalidaVueltaDate)
      };

      let res;
      if (rutaIdEditando) {
        res = await api.patch(`/api/conductor/ruta/${rutaIdEditando}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await api.post('/api/conductor/ruta', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (res.data && res.data.ruta) {
        // Guardamos si era la primera ruta antes de refrescar el state local
        const esPrimeraRuta = rutas.length === 0;

        await fetchConductorRutaYEstudiantes();
        
        // Limpiar formulario y cerrar
        setFormEscuelaId('');
        setFormNombreRuta('');
        setFormZona('');
        setFormSalidaDate(null);
        setFormLlegadaDate(null);
        setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
        setFormEscuelaLat(null);
        setFormEscuelaLng(null);
        setFormSalidaVueltaDate(null);
        setFormErrores({});
        setRutaIdEditando(null);
        setMostrarCrear(false);

        if (esPrimeraRuta) {
          Alert.alert(
            '¡Ruta Creada!',
            'Tu primera ruta ha sido creada con éxito. Ahora debes configurar tu cuenta de cobro para poder recibir pagos.',
            [
              {
                text: 'Configurar Cobro',
                onPress: () => {
                  navigation.navigate('Pagos', { usuario });
                }
              }
            ]
          );
        } else {
          Alert.alert('Registro Exitoso', 'La ruta ha sido guardada correctamente.');
        }
      }
    } catch (err) {
      console.log('Error al guardar ruta:', err.response?.data?.error || err.message);
      setErrorGuardar(err.response?.data?.error || 'Error al guardar la ruta. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const handlePrepararEdicion = (rut) => {
    setRutaIdEditando(rut.id);
    setFormNombreRuta(rut.nombre_ruta);
    setFormEscuelaId(rut.escuela_id);
    setFormZona(rut.zona);
    setFormEscuelaLat(rut.escuela_lat || null);
    setFormEscuelaLng(rut.escuela_lng || null);

    if (rut.hora_salida_vuelta) {
      const parseTimeStr = (str) => {
        const clean = str.trim();
        const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
        if (match) {
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const isPM = match[3].toUpperCase() === 'PM';
          if (isPM && h < 12) h += 12;
          if (!isPM && h === 12) h = 0;
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d;
        }
        return new Date();
      };
      setFormSalidaVueltaDate(parseTimeStr(rut.hora_salida_vuelta));
    } else {
      setFormSalidaVueltaDate(null);
    }

    if (rut.horario) {
      const times = rut.horario.split('—');
      if (times.length === 2) {
        const parseTimeStr = (str) => {
          const clean = str.trim();
          const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
          if (match) {
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          }
          return new Date();
        };
        setFormSalidaDate(parseTimeStr(times[0]));
        setFormLlegadaDate(parseTimeStr(times[1]));
      }
    } else {
      setFormSalidaDate(null);
      setFormLlegadaDate(null);
    }

    if (Array.isArray(rut.frecuencia)) {
      setFormFrecuencia(rut.frecuencia);
    } else if (typeof rut.frecuencia === 'string') {
      if (rut.frecuencia === 'Lunes a Viernes') {
        setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
      } else if (rut.frecuencia === 'Todos los días') {
        setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
      } else {
        setFormFrecuencia(rut.frecuencia.split(',').map(s => s.trim()));
      }
    }

    setMostrarCrear(true);
    setRutaSeleccionada(null);
  };

  const confirmarEliminarRuta = (rutaId) => {
    Alert.alert(
      'Eliminar Ruta',
      '¿Estás seguro de que deseas eliminar esta ruta? Los estudiantes asignados a esta ruta quedarán sin ruta asignada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await auth.currentUser.getIdToken();
              await api.delete(`/api/conductor/ruta/${rutaId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Ruta Eliminada', 'La ruta ha sido eliminada con éxito.');
              setRutaSeleccionada(null);
              await fetchConductorRutaYEstudiantes();
            } catch (err) {
              console.error('Error al eliminar ruta:', err);
              Alert.alert('Error', 'No se pudo eliminar la ruta.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const moverEstudiante = (index, direccion) => {
    const estudiantesDeRuta = estudiantes.filter(e => e.ruta_id === rutaSeleccionada.id);
    const destino = direccion === 'ARRIBA' ? index - 1 : index + 1;
    if (destino < 0 || destino >= estudiantesDeRuta.length) return;

    const est1 = estudiantesDeRuta[index];
    const est2 = estudiantesDeRuta[destino];

    const globalIdx1 = estudiantes.findIndex(e => e.id === est1.id);
    const globalIdx2 = estudiantes.findIndex(e => e.id === est2.id);

    if (globalIdx1 === -1 || globalIdx2 === -1) return;

    const nuevas = [...estudiantes];
    const temp = nuevas[globalIdx1];
    nuevas[globalIdx1] = nuevas[globalIdx2];
    nuevas[globalIdx2] = temp;

    const filteredAndReindexed = nuevas.filter(e => e.ruta_id === rutaSeleccionada.id);
    filteredAndReindexed.forEach((e, i) => {
      e.inputPos = (i + 1).toString();
    });

    setEstudiantes(nuevas);
  };

  const cambiarPosicion = (index, texto) => {
    const estudiantesDeRuta = estudiantes.filter(e => e.ruta_id === rutaSeleccionada.id);
    const est = estudiantesDeRuta[index];
    const globalIdx = estudiantes.findIndex(e => e.id === est.id);
    if (globalIdx === -1) return;

    const nuevas = [...estudiantes];
    nuevas[globalIdx].inputPos = texto;
    setEstudiantes(nuevas);

    const pos = parseInt(texto);
    if (isNaN(pos) || pos < 1 || pos > estudiantesDeRuta.length) return;

    const deRuta = nuevas.filter(e => e.ruta_id === rutaSeleccionada.id);
    const [alumno] = deRuta.splice(index, 1);
    deRuta.splice(pos - 1, 0, alumno);

    let deRutaIdx = 0;
    const finalNuevas = nuevas.map(e => {
      if (e.ruta_id === rutaSeleccionada.id) {
        const item = deRuta[deRutaIdx++];
        item.inputPos = deRutaIdx.toString();
        return item;
      }
      return e;
    });

    setEstudiantes(finalNuevas);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <ActivityIndicator size="large" color="#0D1B3E" />
        <Text style={{ marginTop: 10, color: '#888' }}>Cargando tus rutas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EstadoVacio
        icon="alert-circle-outline"
        titulo="Error al cargar la ruta"
        desc={error}
        btnTexto="Volver"
        onPress={() => navigation.goBack()}
      />
    );
  }

  // ── Vista Formulario de Creación ──────────────────────────────────────────
  if (mostrarCrear) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Botón volver */}
          <TouchableOpacity onPress={() => { 
            setMostrarCrear(false); 
            setFormErrores({}); 
            setErrorGuardar(''); 
            setRutaIdEditando(null);
            setFormEscuelaId('');
            setFormNombreRuta('');
            setFormZona('');
            setFormSalidaDate(null);
            setFormLlegadaDate(null);
            setFormFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
            setFormEscuelaLat(null);
            setFormEscuelaLng(null);
            setFormSalidaVueltaDate(null);
          }} style={styles.btnVolver}>
            <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
            <Text style={styles.btnVolverText}>Cancelar</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginBottom: 20 }]}>{rutaIdEditando ? 'Editar Ruta' : 'Crear Nueva Ruta'}</Text>



          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Nombre de la ruta *</Text>
            <TextInput
              style={[styles.formInput, formErrores.nombre_ruta && styles.formInputError]}
              placeholder="Ej: Ruta Arraiján mañana"
              value={formNombreRuta}
              onChangeText={setFormNombreRuta}
            />
            {formErrores.nombre_ruta && <Text style={styles.errorInline}>{formErrores.nombre_ruta}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Escuela *</Text>
            <TouchableOpacity
              style={[styles.formInputSelector, formErrores.escuela_id && styles.formInputError]}
              onPress={toggleListaEscuelas}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons 
                  name="school-outline" 
                  size={18} 
                  color={formEscuelaId ? '#0D1B3E' : '#888'} 
                  style={{ marginRight: 10 }} 
                />
                <Text 
                  numberOfLines={1} 
                  style={{ color: formEscuelaId ? '#0D1B3E' : '#888', fontSize: 14, flex: 1, fontWeight: formEscuelaId ? '600' : 'normal' }}
                >
                  {formEscuelaId 
                    ? (listaEscuelas.find(e => e._id === formEscuelaId)?.nombre || 'Escuela seleccionada')
                    : 'Selecciona una escuela'
                  }
                </Text>
              </View>
              <Ionicons name={mostrarListaEscuelas ? "chevron-up" : "chevron-down"} size={18} color="#888" />
            </TouchableOpacity>

            {/* Lista Desplegable Inline */}
            {mostrarListaEscuelas && (
              <View style={styles.dropdownContainer}>
                {/* Buscador */}
                <View style={styles.dropdownSearchContainer}>
                  <Ionicons name="search" size={16} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Buscar escuela..."
                    value={busquedaEscuela}
                    onChangeText={setBusquedaEscuela}
                    placeholderTextColor="#888"
                    autoFocus={true}
                  />
                  {busquedaEscuela ? (
                    <TouchableOpacity onPress={() => setBusquedaEscuela('')}>
                      <Ionicons name="close-circle" size={16} color="#888" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Lista de escuelas */}
                <ScrollView 
                  style={{ maxHeight: 150 }} 
                  nestedScrollEnabled={true} 
                  keyboardShouldPersistTaps="handled"
                >
                  {escuelasFiltradas.length === 0 ? (
                    <Text style={styles.dropdownEmptyText}>No se encontraron escuelas</Text>
                  ) : (
                    escuelasFiltradas.slice(0, 3).map(esc => {
                      const selected = formEscuelaId === esc._id;
                      return (
                        <TouchableOpacity
                           key={esc._id}
                           style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                           onPress={() => seleccionarEscuela(esc._id)}
                        >
                          <Ionicons name="school-outline" size={16} color={selected ? "#0D1B3E" : "#888"} style={{ marginRight: 10 }} />
                          <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
                            {esc.nombre}
                          </Text>
                          {selected && (
                            <Ionicons name="checkmark" size={16} color="#16A34A" style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {formEscuelaId ? (
              <Text style={{ fontSize: 12, color: '#16A34A', marginTop: 4, fontWeight: '600', marginLeft: 4 }}>
                ✓ Escuela confirmada
              </Text>
            ) : null}
            {formErrores.escuela_id && <Text style={styles.errorInline}>{formErrores.escuela_id}</Text>}

            {formEscuelaId ? (
              <>
                {(() => {
                  const escObj = listaEscuelas.find(e => e._id === formEscuelaId);
                  if (!escObj) return null;
                  return (
                    <View style={{
                      backgroundColor: '#F5F8FC',
                      borderRadius: 16,
                      padding: 16,
                      borderColor: '#E3ECF7',
                      borderWidth: 1,
                      marginTop: 4,
                      marginBottom: 16,
                      gap: 8
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D1B3E', marginBottom: 2 }}>Información de la escuela</Text>
                      <Text style={{ fontSize: 13, color: '#444' }}><Text style={{ fontWeight: '600' }}>Provincia:</Text> {escObj.provincia}</Text>
                      <Text style={{ fontSize: 13, color: '#444' }}><Text style={{ fontWeight: '600' }}>Distrito:</Text> {escObj.distrito}</Text>
                      {escObj.corregimiento ? (
                        <Text style={{ fontSize: 13, color: '#444' }}><Text style={{ fontWeight: '600' }}>Corregimiento:</Text> {escObj.corregimiento}</Text>
                      ) : null}
                      {(escObj.indicaciones || escObj.direccion) ? (
                        <Text style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 4 }}>
                          <Text style={{ fontWeight: '600', fontStyle: 'normal' }}>Indicaciones:</Text> {escObj.indicaciones || escObj.direccion}
                        </Text>
                      ) : null}
                    </View>
                  );
                })()}

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Ubicación geográfica de la escuela</Text>
                  <View style={styles.formMapContainer}>
                    <MapView
                      key={`${formEscuelaLat}_${formEscuelaLng}`}
                      style={styles.formMap}
                      provider={PROVIDER_DEFAULT}
                      initialRegion={{
                        latitude: formEscuelaLat || 8.9833,
                        longitude: formEscuelaLng || -79.5167,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.015,
                      }}
                    >
                      {formEscuelaLat && formEscuelaLng && (
                        <Marker
                          coordinate={{ latitude: formEscuelaLat, longitude: formEscuelaLng }}
                          title="Ubicación de la escuela"
                        >
                          <View style={styles.customMarkerHito}>
                            <Text style={{ fontSize: 13 }}>🏫</Text>
                          </View>
                        </Marker>
                      )}
                    </MapView>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Zona *</Text>
            <TextInput
              style={[styles.formInput, formErrores.zona && styles.formInputError]}
              placeholder="Ej: Arraiján, Vista Alegre..."
              value={formZona}
              onChangeText={setFormZona}
            />
            {formErrores.zona && <Text style={styles.errorInline}>{formErrores.zona}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Hora de salida *</Text>
            <TouchableOpacity
              style={[styles.formInput, formErrores.horario_salida && styles.formInputError, { justifyContent: 'center', minHeight: 48 }]}
              onPress={() => setShowSalidaPicker(true)}
            >
              <Text style={{ color: formSalidaDate ? '#0D1B3E' : '#888', fontSize: 14 }}>
                {formSalidaDate ? formatTime12h(formSalidaDate) : 'Selecciona hora de salida'}
              </Text>
            </TouchableOpacity>
            {formErrores.horario_salida && <Text style={styles.errorInline}>{formErrores.horario_salida}</Text>}
            
            {showSalidaPicker && (
              <DateTimePicker
                value={formSalidaDate || new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowSalidaPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormSalidaDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Hora de llegada *</Text>
            <TouchableOpacity
              style={[styles.formInput, formErrores.horario_llegada && styles.formInputError, { justifyContent: 'center', minHeight: 48 }]}
              onPress={() => setShowLlegadaPicker(true)}
            >
              <Text style={{ color: formLlegadaDate ? '#0D1B3E' : '#888', fontSize: 14 }}>
                {formLlegadaDate ? formatTime12h(formLlegadaDate) : 'Selecciona hora de llegada'}
              </Text>
            </TouchableOpacity>
            {formErrores.horario_llegada && <Text style={styles.errorInline}>{formErrores.horario_llegada}</Text>}
            
            {showLlegadaPicker && (
              <DateTimePicker
                value={formLlegadaDate || new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowLlegadaPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormLlegadaDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Hora de salida del colegio (Vuelta) *</Text>
            <TouchableOpacity
              style={[styles.formInput, formErrores.hora_salida_vuelta && styles.formInputError, { justifyContent: 'center', minHeight: 48 }]}
              onPress={() => setShowSalidaVueltaPicker(true)}
            >
              <Text style={{ color: formSalidaVueltaDate ? '#0D1B3E' : '#888', fontSize: 14 }}>
                {formSalidaVueltaDate ? formatTime12h(formSalidaVueltaDate) : 'Selecciona hora de salida del colegio'}
              </Text>
            </TouchableOpacity>
            {formErrores.hora_salida_vuelta && <Text style={styles.errorInline}>{formErrores.hora_salida_vuelta}</Text>}
            
            {showSalidaVueltaPicker && (
              <DateTimePicker
                value={formSalidaVueltaDate || new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowSalidaVueltaPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormSalidaVueltaDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Frecuencia *</Text>
            <View style={styles.chipsRow}>
              {DAYS.map(day => (
                <DayChip
                  key={day.key}
                  label={day.label}
                  selected={formFrecuencia.includes(day.key)}
                  onPress={() => toggleDia(day.key)}
                />
              ))}
            </View>
            {formErrores.frecuencia && <Text style={styles.errorInline}>{formErrores.frecuencia}</Text>}
            
            {/* Presets rápidos */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => seleccionarPreset('L-V')}
              >
                <Text style={styles.presetBtnText}>Lunes a Viernes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => seleccionarPreset('todos')}
              >
                <Text style={styles.presetBtnText}>Todos los días</Text>
              </TouchableOpacity>
            </View>
          </View>

          {errorGuardar ? (
            <View style={[styles.errorContainer, { marginTop: 20, marginBottom: -10 }]}>
              <Text style={styles.errorText}>{errorGuardar}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch' }]}
            onPress={handleCrearRuta}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color="#0D1B3E" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0D1B3E" />
                <Text style={styles.btnPrimaryText}>{rutaIdEditando ? 'Guardar Cambios' : 'Confirmar y Crear Ruta'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Detalle de ruta seleccionada ──────────────────────────────────────────
  if (rutaSeleccionada) {
    const estudiantesDeRuta = estudiantes.filter(e => e.ruta_id === rutaSeleccionada.id);

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Botón volver */}
          <TouchableOpacity onPress={() => { setRutaSeleccionada(null); setEditando(false); }} style={styles.btnVolver}>
            <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
            <Text style={styles.btnVolverText}>Mis rutas</Text>
          </TouchableOpacity>

          {/* Resumen de la ruta */}
          <View style={styles.rutaResumenCard}>
            <View style={styles.rutaResumenTop}>
              <View style={styles.rutaIconCircle}>
                <Ionicons name="bus-outline" size={22} color="#0D1B3E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rutaResumenNombrePrincipal}>{rutaSeleccionada.nombre_ruta}</Text>
                <Text style={styles.rutaResumenEscuelaSecundario}>{rutaSeleccionada.escuela_nombre}</Text>
                <Text style={styles.rutaResumenSub}>{rutaSeleccionada.horario} · {rutaSeleccionada.alumnos} estudiantes</Text>
              </View>
              <View style={[styles.estadoBadge, rutaSeleccionada.activa && styles.estadoBadgeActivo]}>
                <View style={[styles.estadoPunto, rutaSeleccionada.activa && { backgroundColor: '#16A34A' }]} />
                <Text style={[styles.estadoBadgeText, rutaSeleccionada.activa && { color: '#16A34A' }]}>
                  {rutaSeleccionada.activa ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            
            {/* Frecuencia en el detalle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="#888" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginRight: 4 }}>Frecuencia:</Text>
              {renderFrecuenciaTextoUChips(rutaSeleccionada.frecuencia)}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 6 }}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginRight: 4 }}>Salida Tarde (Vuelta):</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0D1B3E' }}>{rutaSeleccionada.hora_salida_vuelta || '2:30 PM (Aprox.)'}</Text>
            </View>
            
            <View style={styles.divider} />
            <View style={styles.zonasRow}>
              {rutaSeleccionada.zonas.map((z, i) => (
                <View key={i} style={styles.zonaChip}>
                  <Ionicons name="location-outline" size={11} color="#00AEEF" />
                  <Text style={styles.zonaChipText}>{z}</Text>
                </View>
              ))}
            </View>

            {rutaSeleccionada.escuela_lat && rutaSeleccionada.escuela_lng ? (
              <>
                <View style={styles.divider} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D1B3E', marginBottom: 8, marginTop: 8 }}>Ubicación de la escuela:</Text>
                <View style={styles.mapaContainer}>
                  <MapView
                    style={styles.mapaSimulado}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                      latitude: Number(rutaSeleccionada.escuela_lat),
                      longitude: Number(rutaSeleccionada.escuela_lng),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{ latitude: Number(rutaSeleccionada.escuela_lat), longitude: Number(rutaSeleccionada.escuela_lng) }}
                      title={rutaSeleccionada.escuela_nombre}
                    >
                      <View style={styles.customMarkerHito}><Text style={{ fontSize: 13 }}>🏫</Text></View>
                    </Marker>
                  </MapView>
                </View>
              </>
            ) : null}

            <View style={styles.divider} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 }}
                onPress={() => handlePrepararEdicion(rutaSeleccionada)}
              >
                <Ionicons name="create-outline" size={16} color="#00AEEF" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#00AEEF' }}>Editar info</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 }}
                onPress={() => confirmarEliminarRuta(rutaSeleccionada.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Eliminar ruta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Encabezado tabla */}
          <View style={styles.tablaHeader}>
            <Text style={styles.tablaHeaderOrden}>Orden</Text>
            <Text style={styles.tablaHeaderNombre}>Estudiante</Text>
            <TouchableOpacity
              style={[styles.btnEditar, editando && styles.btnEditarActivo]}
              onPress={async () => {
                if (editando) {
                  try {
                    const token = await auth.currentUser.getIdToken();
                    const deRuta = estudiantes.filter(e => e.ruta_id === rutaSeleccionada.id);
                    
                    const payloadEstudiantes = deRuta.map((e, idx) => ({
                      estudiante_id: e.id,
                      orden: idx + 1
                    }));

                    await api.patch(`/api/conductor/ruta/${rutaSeleccionada.id}`, {
                      estudiantes: payloadEstudiantes
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    Alert.alert('Éxito', 'El orden de recogida ha sido guardado correctamente.');
                  } catch (err) {
                    console.log('Error al guardar el orden de los estudiantes:', err.message);
                    Alert.alert('Error', 'No se pudo guardar el orden de los estudiantes.');
                  }
                }
                setEditando(!editando);
              }}
            >
              <Ionicons name={editando ? 'checkmark-circle' : 'create-outline'} size={14} color={editando ? '#fff' : '#0D1B3E'} />
              <Text style={[styles.btnEditarText, editando && { color: '#fff' }]}>
                {editando ? 'Listo' : 'Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de estudiantes */}
          {estudiantesDeRuta.length === 0 ? (
            <View style={styles.emptyEstudiantes}>
              <Ionicons name="people-outline" size={32} color="#ccc" />
              <Text style={styles.emptyTitle}>Sin estudiantes en esta ruta</Text>
            </View>
          ) : (
            estudiantesDeRuta.map((est, index) => (
              <View
                key={est.id}
                style={[styles.filaEstudiante, editando && styles.filaEstudianteEditando]}
              >
                {/* Número de orden */}
                <TextInput
                  style={[styles.inputOrden, editando && styles.inputOrdenActivo]}
                  value={est.inputPos}
                  keyboardType="numeric"
                  editable={editando}
                  onChangeText={(t) => cambiarPosicion(index, t)}
                />

                {/* Info */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.estNombre}>{est.nombre}</Text>
                  <Text style={styles.estZona}>
                    <Ionicons name="location-outline" size={11} color="#888" /> {est.zona}
                  </Text>
                </View>

                {/* Flechas (solo en modo edición) */}
                {editando && (
                  <View style={styles.flechasRow}>
                    <TouchableOpacity
                      disabled={index === 0}
                      style={index === 0 && { opacity: 0.25 }}
                      onPress={() => moverEstudiante(index, 'ARRIBA')}
                    >
                      <Ionicons name="arrow-up-circle-outline" size={26} color="#00AEEF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={index === estudiantesDeRuta.length - 1}
                      style={index === estudiantesDeRuta.length - 1 && { opacity: 0.25 }}
                      onPress={() => moverEstudiante(index, 'ABAJO')}
                    >
                      <Ionicons name="arrow-down-circle-outline" size={26} color="#00AEEF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Botón iniciar ruta */}
          <TouchableOpacity
            style={styles.btnIniciar}
            onPress={() => navigation.navigate('Viaje', { usuario, ruta_id: rutaSeleccionada.id })}
          >
            <Ionicons name="play-circle" size={20} color="#0D1B3E" />
            <Text style={styles.btnIniciarText}>Iniciar Ruta en Tiempo Real</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Lista de rutas ────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {/* Resumen general */}
      <View style={styles.statsRow}>
        <StatCard icon="map-outline" valor={rutas.length} label="Rutas activas" color="#0D1B3E" />
        <StatCard icon="people-outline" valor={estudiantes.length} label="Estudiantes" color="#00AEEF" />
        <StatCard icon="school-outline" valor={[...new Set(rutas.map(r => r.escuela_nombre))].filter(Boolean).length} label="Escuelas" color="#FFD700" textColor="#0D1B3E" />
      </View>

      {/* Lista de rutas */}
      <Text style={styles.sectionLabel}>Rutas registradas</Text>

      {rutas.length === 0 ? (
        <EstadoVacio
          icon="map-outline"
          titulo="Sin rutas registradas"
          desc="Registra tu primera ruta para que los padres puedan encontrarte."
          btnTexto="Crear mi primera ruta"
          onPress={() => setMostrarCrear(true)}
        />
      ) : (
        <>
          {rutas.map(ruta => (
            <TouchableOpacity
              key={ruta.id}
              style={styles.rutaCard}
              onPress={() => setRutaSeleccionada(ruta)}
              activeOpacity={0.85}
            >
              <View style={styles.rutaCardLeft}>
                <View style={[styles.rutaBullet, ruta.activa && styles.rutaBulletActivo]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rutaCardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rutaNombrePrincipal}>{ruta.nombre_ruta}</Text>
                    <Text style={styles.rutaEscuelaSecundario}>{ruta.escuela_nombre}</Text>
                  </View>
                  <View style={[styles.estadoBadge, ruta.activa && styles.estadoBadgeActivo]}>
                    <Text style={[styles.estadoBadgeText, ruta.activa && { color: '#16A34A' }]}>
                      {ruta.activa ? 'Activa' : 'Inactiva'}
                    </Text>
                  </View>
                </View>
                <View style={styles.zonasRow}>
                  {ruta.zonas.map((z, i) => (
                    <View key={i} style={styles.zonaChip}>
                      <Ionicons name="location-outline" size={11} color="#00AEEF" />
                      <Text style={styles.zonaChipText}>{z}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.rutaStats}>
                  <View style={styles.rutaStatItem}>
                    <Ionicons name="people-outline" size={13} color="#888" />
                    <Text style={styles.rutaStatText}>{ruta.alumnos} estudiantes</Text>
                  </View>
                  <View style={styles.rutaStatItem}>
                    <Ionicons name="time-outline" size={13} color="#888" />
                    <Text style={styles.rutaStatText}>{ruta.horario}</Text>
                  </View>
                </View>
                <View style={[styles.rutaStatItem, { marginTop: 8 }]}>
                  <Ionicons name="calendar-outline" size={13} color="#888" style={{ marginRight: 4 }} />
                  {renderFrecuenciaTextoUChips(ruta.frecuencia)}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}

          {/* Botón Nueva ruta al final de la lista */}
          <TouchableOpacity
            style={[styles.btnSecundario, { marginTop: 8 }]}
            onPress={() => setMostrarCrear(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#0D1B3E" />
            <Text style={styles.btnSecundarioText}>Nueva Ruta</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function FilaInfo({ icon, label, valor, last }) {
  return (
    <View style={[styles.filaInfo, !last && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}>
      <View style={styles.filaInfoIcon}>
        <Ionicons name={icon} size={15} color="#0D1B3E" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaInfoLabel}>{label}</Text>
        <Text style={styles.filaInfoValor}>{valor}</Text>
      </View>
    </View>
  );
}

function StatCard({ icon, valor, label, color, textColor }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValor, textColor && { color: textColor }]}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EstadoVacio({ icon, titulo, desc, btnTexto, onPress }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={36} color="#0D1B3E" />
      </View>
      <Text style={styles.emptyTitle}>{titulo}</Text>
      <Text style={styles.emptyDesc}>{desc}</Text>
      {btnTexto && (
        <TouchableOpacity style={styles.btnPrimary} onPress={onPress}>
          <Text style={styles.btnPrimaryText}>{btnTexto}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B3E' },

  header: { backgroundColor: '#0D1B3E', paddingTop: 8, paddingBottom: 28, paddingHorizontal: '6%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  body: { flexGrow: 1, paddingHorizontal: '6%', paddingTop: 24, paddingBottom: 40 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 4 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Conductor card (padre)
  conductorCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, marginBottom: 4 },
  conductorCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarGrande: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  avatarGrandeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  conductorNombre: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  ratingTexto: { fontSize: 11, color: '#888', marginLeft: 4 },
  verificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFD700', borderRadius: 20, paddingVertical: 2, paddingHorizontal: 7 },
  verificadoText: { fontSize: 10, fontWeight: '700', color: '#0D1B3E' },
  btnWhatsapp: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },

  // Fila info
  infoCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', paddingHorizontal: 16, paddingVertical: 4, marginBottom: 4 },
  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  filaInfoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3ECF7' },
  filaInfoLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  filaInfoValor: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },

  // Hijos
  hijoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  hijoAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  hijoAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  hijoNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E', flex: 1 },
  estadoActivoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E6F9EE', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  estadoPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  estadoActivoText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  // Selector de hijos (chips)
  hijosChipsRow: { flexDirection: 'row', gap: 10, paddingBottom: 4, paddingRight: 4 },
  hijoChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 24, paddingVertical: 6, paddingHorizontal: 12 },
  hijoChipSeleccionado: { backgroundColor: '#0D1B3E', borderColor: '#0D1B3E' },
  hijoChipNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E' },
  hijoChipNombreSeleccionado: { color: '#fff' },
  hijoChipAvatarSeleccionado: { backgroundColor: '#fff' },
  hijoChipAvatarTextSeleccionado: { color: '#0D1B3E' },
  hijoChipExtraBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff' },
  hijoChipExtraBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Paradas
  paradasCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 4 },
  paradaRow: { flexDirection: 'row', gap: 12 },
  paradaTimeline: { alignItems: 'center', width: 20 },
  paradaPunto: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#C8D6E5', marginTop: 3 },
  paradaPuntoPrimero: { backgroundColor: '#FFD700', width: 14, height: 14, borderRadius: 7 },
  paradaPuntoUltimo: { backgroundColor: '#0D1B3E', width: 14, height: 14, borderRadius: 7 },
  paradaLinea: { width: 2, flex: 1, backgroundColor: '#E3ECF7', marginVertical: 3 },
  paradaContenido: { flex: 1, paddingBottom: 20 },
  paradaDesc: { fontSize: 13, color: '#444', lineHeight: 18 },
  paradaHora: { fontSize: 11, color: '#00AEEF', fontWeight: '600', marginTop: 3 },

  // Contrato
  contratoCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 4 },
  contratoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  contratoMes: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  contratoPct: { fontSize: 14, fontWeight: '700', color: '#00AEEF' },
  barraBase: { height: 8, backgroundColor: '#E3ECF7', borderRadius: 4, overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  contratoNote: { fontSize: 12, color: '#888', marginTop: 8 },

  // Stats conductor
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#F5F8FC', borderRadius: 16, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 14, alignItems: 'center', gap: 4 },
  statValor: { fontSize: 22, fontWeight: 'bold', color: '#0D1B3E' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },

  // Ruta card conductor
  rutaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 12 },
  rutaCardLeft: { paddingTop: 3 },
  rutaBullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ccc' },
  rutaBulletActivo: { backgroundColor: '#25D366' },
  rutaCardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  rutaEscuela: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', flex: 1 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F0F0', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  estadoBadgeActivo: { backgroundColor: '#E6F9EE' },
  estadoBadgeText: { fontSize: 11, fontWeight: '600', color: '#888' },
  zonasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  zonaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  zonaChipText: { fontSize: 11, fontWeight: '600', color: '#00AEEF' },
  rutaStats: { flexDirection: 'row', gap: 16 },
  rutaStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rutaStatText: { fontSize: 12, color: '#888' },

  // Resumen de ruta seleccionada
  rutaResumenCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#00AEEF', padding: 16, marginBottom: 20 },
  rutaResumenTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rutaIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  rutaResumenEscuela: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  rutaResumenSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Tabla estudiantes
  tablaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tablaHeaderOrden: { fontSize: 12, fontWeight: '700', color: '#888', width: 46, textAlign: 'center' },
  tablaHeaderNombre: { fontSize: 12, fontWeight: '700', color: '#888', flex: 1, marginLeft: 12 },
  btnEditar: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD700', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  btnEditarActivo: { backgroundColor: '#0D1B3E' },
  btnEditarText: { fontSize: 12, fontWeight: '700', color: '#0D1B3E' },

  filaEstudiante: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 12, marginBottom: 8 },
  filaEstudianteEditando: { borderColor: '#FFD700', backgroundColor: '#FFFDE6' },
  inputOrden: { width: 36, height: 36, backgroundColor: '#E3ECF7', borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  inputOrdenActivo: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FFD700' },
  estNombre: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  estZona: { fontSize: 12, color: '#888', marginTop: 2 },
  flechasRow: { flexDirection: 'row', gap: 6 },
  emptyEstudiantes: { alignItems: 'center', paddingVertical: 32, gap: 8 },

  // Botón iniciar ruta
  btnIniciar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 15, marginTop: 20 },
  btnIniciarText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },

  // Botón volver
  btnVolver: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start' },
  btnVolverText: { fontSize: 14, fontWeight: '600', color: '#0D1B3E' },

  // Estado vacío
  emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: '5%' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#F0F5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#E3ECF7' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 10 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28 },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  btnSecundario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#0D1B3E', borderRadius: 16, paddingVertical: 14 },
  btnSecundarioText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  formGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#0D1B3E', marginBottom: 6 },
  formInput: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0D1B3E' },
  formInputError: { borderColor: '#DC2626' },
  errorInline: { fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: '600' },
  disabledInput: { backgroundColor: '#E3ECF7', borderWidth: 1.5, borderColor: '#C8D6E5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  disabledInputText: { fontSize: 14, color: '#888', fontWeight: '600' },
  inputHelp: { fontSize: 11, color: '#888', marginTop: 4 },
  errorContainer: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  
  // Estilos del selector de escuelas
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 15,
    textAlign: 'center',
  },
  escuelaOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3ECF7',
  },
  escuelaOptionText: {
    fontSize: 14,
    color: '#0D1B3E',
  },
  btnCerrarModal: {
    marginTop: 15,
    backgroundColor: '#0D1B3E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnCerrarModalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Nuevas jerarquías de texto para tarjetas de ruta
  rutaNombrePrincipal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  rutaEscuelaSecundario: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rutaResumenNombrePrincipal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  rutaResumenEscuelaSecundario: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    marginBottom: 4,
  },
  
  // Day chips
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayChipSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  dayChipUnselected: {
    backgroundColor: '#F5F8FC',
    borderColor: '#E3ECF7',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayChipTextSelected: {
    color: '#0D1B3E',
  },
  dayChipTextUnselected: {
    color: '#888',
  },
  
  // Presets
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  presetBtn: {
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E3ECF7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  presetBtnText: {
    fontSize: 12,
    color: '#0D1B3E',
    fontWeight: '600',
  },

  // BottomSheet styles
  // Inline dropdown styles
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    marginTop: 6,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E3ECF7',
    marginBottom: 8,
    height: 38,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0D1B3E',
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5FF',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFFDE6',
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#0D1B3E',
    fontWeight: '700',
  },
  dropdownEmptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    paddingVertical: 12,
  },
  
  // Selector button style in form
  formInputSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F8FC',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Mini chips
  miniChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  miniChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipSelected: {
    backgroundColor: '#FFD700',
  },
  miniChipUnselected: {
    backgroundColor: '#E3ECF7',
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniChipTextSelected: {
    color: '#0D1B3E',
  },
  miniChipTextUnselected: {
    color: '#888',
  },
  formMapContainer: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    marginTop: 8,
  },
  formMap: {
    flex: 1,
  },
  mapaContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    marginTop: 8,
  },
  mapaSimulado: {
    flex: 1,
  },
  customMarkerHito: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});