import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Alert, Animated,
  FlatList, TextInput, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const ESTUDIANTES_DEMO = [
  { id: 'e1', nombre: 'Sofía Rodríguez',  zona: 'Arraiján',        qr: 'BUSWAY-QR-e1', estado: 'pendiente' },
  { id: 'e2', nombre: 'Mateo Coronado',    zona: 'Vista Alegre',    qr: 'BUSWAY-QR-e2', estado: 'pendiente' },
  { id: 'e3', nombre: 'Ceferino JR',       zona: 'Nuevo Arraiján',  qr: 'BUSWAY-QR-e3', estado: 'pendiente' },
  { id: 'e4', nombre: 'Juanin Torres',     zona: 'La Chorrera',     qr: 'BUSWAY-QR-e4', estado: 'pendiente' },
];

const VIAJE_PADRE_DEMO = {
  conductor: { nombre: 'Carlos Pérez', vehiculo: 'Toyota Coaster 2020', placa: 'BC-8888', telefono: '6500-1234' },
  escuela:   'Colegio San Agustín',
  horario:   '6:30 AM — 7:15 AM',
  hijos: [
    { id: 'h1', nombre: 'Sofía', estado: 'pendiente' },
  ],
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ViajeScreen({ navigation, route }) {
  const { usuario } = route.params;
  const esPadre = usuario.tipo === 'padre';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>BusWay</Text>
            <Text style={styles.headerTitle}>{esPadre ? 'Seguimiento' : 'Viaje'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.card}>
        {esPadre
          ? <ViajePadre usuario={usuario} bottomInset={insets.bottom} />
          : <ViajeConductor usuario={usuario} navigation={navigation} bottomInset={insets.bottom} />
        }
      </View>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA PADRE — Solo seguimiento GPS y estado del hijo
// ══════════════════════════════════════════════════════════════════════════════
function ViajePadre({ usuario, bottomInset }) {
  const [rutaActiva, setRutaActiva] = useState(false);
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (rutaActiva) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulso.setValue(1);
    }
  }, [rutaActiva]);

  const viaje = VIAJE_PADRE_DEMO;

  return (
    <ScrollView
      contentContainerStyle={[styles.body, { paddingBottom: Math.max(bottomInset + 24, 48) }]}
      showsVerticalScrollIndicator={false}
    >

      {/* Estado del viaje */}
      <View style={[styles.estadoViajeBanner, rutaActiva ? styles.bannerActivo : styles.bannerEspera]}>
        <Animated.View style={[styles.estadoPuntoGrande, rutaActiva ? styles.puntoBusActivo : styles.puntoBusEspera, { transform: [{ scale: pulso }] }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.estadoViajeTitle, rutaActiva && { color: '#fff' }]}>
            {rutaActiva ? 'Ruta en curso' : 'Esperando inicio de ruta'}
          </Text>
          <Text style={[styles.estadoViajeSub, rutaActiva && { color: 'rgba(255,255,255,0.7)' }]}>
            {rutaActiva ? 'El bus está en camino · GPS activo' : 'El conductor aún no ha iniciado el recorrido'}
          </Text>
        </View>
        {rutaActiva && <Ionicons name="radio-outline" size={22} color="#fff" />}
      </View>

      {/* Mapa simulado */}
      <Text style={styles.sectionLabel}>Ubicación del bus</Text>
      <View style={styles.mapaContainer}>
        {rutaActiva ? (
          <>
            <View style={styles.mapaSimulado}>
              <View style={styles.mapaFondo}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.mapaLinea, { top: `${(i + 1) * 14}%` }]} />
                ))}
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.mapaLineaV, { left: `${(i + 1) * 14}%` }]} />
                ))}
              </View>
              <View style={styles.busIconWrap}>
                <Animated.View style={[styles.busIconPulse, { transform: [{ scale: pulso }] }]} />
                <View style={styles.busIcon}>
                  <Ionicons name="bus" size={22} color="#fff" />
                </View>
              </View>
              <View style={styles.destinoPin}>
                <Ionicons name="location" size={22} color="#DC2626" />
                <Text style={styles.destinoPinText}>Colegio</Text>
              </View>
            </View>
            <View style={styles.mapaFooter}>
              <Ionicons name="information-circle-outline" size={14} color="#888" />
              <Text style={styles.mapaFooterText}>Actualización GPS cada 5 segundos · Socket.io</Text>
            </View>
          </>
        ) : (
          <View style={styles.mapaInactivo}>
            <Ionicons name="map-outline" size={40} color="#C8D6E5" />
            <Text style={styles.mapaInactivoTitle}>Mapa no disponible</Text>
            <Text style={styles.mapaInactivoDesc}>El mapa se activará cuando el conductor inicie el recorrido.</Text>
          </View>
        )}
      </View>

      {/* Info del conductor */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Conductor</Text>
      <View style={styles.infoCard}>
        <View style={styles.conductorRow}>
          <View style={styles.avatarMed}>
            <Text style={styles.avatarMedText}>{viaje.conductor.nombre.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.conductorNombre}>{viaje.conductor.nombre}</Text>
            <Text style={styles.conductorSub}>{viaje.conductor.vehiculo} · {viaje.conductor.placa}</Text>
          </View>
          <TouchableOpacity style={styles.btnWA}
            onPress={() => Alert.alert('WhatsApp', `Contactar a ${viaje.conductor.nombre}`)}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <FilaInfoViaje icon="school-outline"  label="Escuela"  valor={viaje.escuela}  />
        <FilaInfoViaje icon="time-outline"    label="Horario"  valor={viaje.horario}  last />
      </View>

      {/* Estado de hijos */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Estado de tus hijos</Text>
      <View style={styles.infoCard}>
        {viaje.hijos.map((hijo, i) => {
          const cfg = {
            pendiente:  { color: '#F59E0B', bg: '#FFF8E1', icon: 'time-outline',             texto: 'Pendiente'    },
            abordo:     { color: '#16A34A', bg: '#E6F9EE', icon: 'checkmark-circle-outline',  texto: 'A bordo'      },
            entregado:  { color: '#0D1B3E', bg: '#E8F0FE', icon: 'school-outline',            texto: 'Entregado'    },
          }[hijo.estado] ?? { color: '#888', bg: '#F5F5F5', icon: 'help-circle-outline', texto: hijo.estado };

          return (
            <View key={hijo.id} style={[styles.hijoEstadoRow, i < viaje.hijos.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}>
              <View style={styles.hijoAvatar}>
                <Text style={styles.hijoAvatarText}>{hijo.nombre.charAt(0)}</Text>
              </View>
              <Text style={styles.hijoNombre}>{hijo.nombre}</Text>
              <View style={[styles.estadoChip, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                <Text style={[styles.estadoChipText, { color: cfg.color }]}>{cfg.texto}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Botón demo para simular */}
      <TouchableOpacity style={styles.btnDemo} onPress={() => setRutaActiva(!rutaActiva)}>
        <Ionicons name={rutaActiva ? 'stop-circle-outline' : 'play-circle-outline'} size={18} color="#0D1B3E" />
        <Text style={styles.btnDemoText}>{rutaActiva ? 'Simular fin de ruta' : 'Simular inicio de ruta'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA CONDUCTOR — Iniciar viaje, QR, lista de asistencia
// ══════════════════════════════════════════════════════════════════════════════
function ViajeConductor({ usuario, navigation, bottomInset }) {
  const [fase, setFase] = useState('inicio'); // 'inicio' | 'asistencia' | 'enruta' | 'finalizado'
  const [estudiantes, setEstudiantes] = useState(ESTUDIANTES_DEMO);
  const [tabActivo, setTabActivo] = useState('lista'); // 'lista' | 'qr'
  const [permission, requestPermission] = useCameraPermissions();
  const [ultimoEscaneado, setUltimoEscaneado] = useState(null);
  const pulso = useRef(new Animated.Value(1)).current;

  // Padding inferior seguro: respeta la barra de navegación del sistema
  const safeBottom = Math.max(bottomInset, 16);

  const abordo    = estudiantes.filter(e => e.estado === 'abordo').length;
  const pendiente = estudiantes.filter(e => e.estado === 'pendiente').length;
  const ausente   = estudiantes.filter(e => e.estado === 'ausente').length;
  const total     = estudiantes.length;

  useEffect(() => {
    if (fase === 'enruta') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulso.setValue(1);
    }
  }, [fase]);

  const marcarEstado = (id, nuevoEstado) => {
    setEstudiantes(prev => prev.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e));
  };

  const handleQRScanned = ({ data }) => {
    if (ultimoEscaneado === data) return;
    setUltimoEscaneado(data);
    const est = estudiantes.find(e => e.qr === data);
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

  const iniciarRuta = () => {
    Alert.alert(
      'Iniciar ruta',
      `Hay ${pendiente} estudiante${pendiente !== 1 ? 's' : ''} pendiente${pendiente !== 1 ? 's' : ''}. ¿Deseas iniciar el recorrido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar', onPress: () => setFase('enruta') },
      ]
    );
  };

  const finalizarRuta = () => {
    Alert.alert(
      'Finalizar ruta',
      '¿Confirmas que todos los estudiantes fueron entregados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => {
            setEstudiantes(prev => prev.map(e => ({ ...e, estado: e.estado === 'abordo' ? 'entregado' : e.estado })));
            setFase('finalizado');
          },
        },
      ]
    );
  };

  // ── FASE: INICIO ──────────────────────────────────────────────────────────
  if (fase === 'inicio') {
    return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: safeBottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="bus-outline" size={36} color="#0D1B3E" />
          </View>
          <Text style={styles.heroTitle}>¿Listo para iniciar?</Text>
          <Text style={styles.heroDesc}>
            Pasa lista de asistencia antes de iniciar el recorrido.
            El GPS se activará cuando presiones "Iniciar Ruta".
          </Text>
        </View>

        <View style={styles.miniStats}>
          <MiniStat valor={total}     label="Total"     color="#0D1B3E" />
          <MiniStat valor={abordo}    label="A bordo"   color="#16A34A" />
          <MiniStat valor={pendiente} label="Pendiente" color="#F59E0B" />
          <MiniStat valor={ausente}   label="Ausente"   color="#DC2626" />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => setFase('asistencia')}>
          <Ionicons name="qr-code-outline" size={20} color="#0D1B3E" />
          <Text style={styles.btnPrimaryText}>Comenzar asistencia</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Ruta de hoy</Text>
        <View style={styles.infoCard}>
          <FilaInfoViaje icon="school-outline"   label="Escuela"      valor="Colegio San Agustín"  />
          <FilaInfoViaje icon="location-outline" label="Zonas"        valor="Arraiján · Vista Alegre · Nuevo Arraiján" />
          <FilaInfoViaje icon="time-outline"     label="Horario"      valor="6:30 AM — 7:15 AM"    />
          <FilaInfoViaje icon="people-outline"   label="Estudiantes"  valor={`${total} registrados`} last />
        </View>
      </ScrollView>
    );
  }

  // ── FASE: ASISTENCIA ──────────────────────────────────────────────────────
  if (fase === 'asistencia') {
    return (
      <View style={{ flex: 1 }}>
        {/* Tabs QR / Lista */}
        <View style={styles.tabsInternos}>
          <TouchableOpacity
            style={[styles.tabInterno, tabActivo === 'qr' && styles.tabInternoActivo]}
            onPress={async () => {
              if (!permission?.granted) await requestPermission();
              setTabActivo('qr');
            }}
          >
            <Ionicons name="qr-code-outline" size={16} color={tabActivo === 'qr' ? '#0D1B3E' : '#aaa'} />
            <Text style={[styles.tabInternoText, tabActivo === 'qr' && styles.tabInternoTextActivo]}>
              Escanear QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabInterno, tabActivo === 'lista' && styles.tabInternoActivo]}
            onPress={() => setTabActivo('lista')}
          >
            <Ionicons name="list-outline" size={16} color={tabActivo === 'lista' ? '#0D1B3E' : '#aaa'} />
            <Text style={[styles.tabInternoText, tabActivo === 'lista' && styles.tabInternoTextActivo]}>
              Lista manual
            </Text>
          </TouchableOpacity>
        </View>

        {tabActivo === 'qr' ? (
          // ── LECTOR QR ──────────────────────────────────────────────────────
          <View style={{ flex: 1 }}>
            {permission?.granted ? (
              <View style={{ flex: 1 }}>
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={handleQRScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                <View style={styles.qrOverlay}>
                  <View style={styles.qrFrame}>
                    <View style={[styles.qrCorner, styles.qrCornerTL]} />
                    <View style={[styles.qrCorner, styles.qrCornerTR]} />
                    <View style={[styles.qrCorner, styles.qrCornerBL]} />
                    <View style={[styles.qrCorner, styles.qrCornerBR]} />
                  </View>
                  <Text style={styles.qrInstruccion}>
                    Apunta al QR del estudiante
                  </Text>
                </View>
                {/* Barra inferior con safe area */}
                <View style={[styles.qrBottomBar, { paddingBottom: safeBottom + 8 }]}>
                  <View style={styles.miniStats}>
                    <MiniStat valor={abordo}    label="A bordo"   color="#16A34A" />
                    <MiniStat valor={pendiente} label="Pendiente" color="#F59E0B" />
                    <MiniStat valor={ausente}   label="Ausente"   color="#DC2626" />
                  </View>
                  <TouchableOpacity style={styles.btnIniciarRuta} onPress={iniciarRuta}>
                    <Ionicons name="navigate" size={18} color="#0D1B3E" />
                    <Text style={styles.btnIniciarRutaText}>Iniciar Ruta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.permisoContainer}>
                <Ionicons name="camera-outline" size={48} color="#C8D6E5" />
                <Text style={styles.permisoTitle}>Permiso de cámara requerido</Text>
                <Text style={styles.permisoDesc}>Necesitamos acceso a la cámara para escanear los códigos QR de los estudiantes.</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
                  <Text style={styles.btnPrimaryText}>Conceder permiso</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // ── LISTA MANUAL ───────────────────────────────────────────────────
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: '6%', paddingTop: 16, paddingBottom: 20 }}>
              <Text style={styles.sectionLabel}>Lista de asistencia</Text>
              <Text style={styles.sectionSub}>Marca el estado de cada estudiante manualmente</Text>

              {estudiantes.map((est) => {
                const cfg = {
                  pendiente: { color: '#F59E0B', bg: '#FFF8E1', texto: 'Pendiente' },
                  abordo:    { color: '#16A34A', bg: '#E6F9EE', texto: 'A bordo'   },
                  ausente:   { color: '#DC2626', bg: '#FEE2E2', texto: 'Ausente'   },
                }[est.estado];

                return (
                  <View key={est.id} style={styles.asistenciaCard}>
                    <View style={styles.asistenciaLeft}>
                      <View style={[styles.asistenciaAvatar, { backgroundColor: cfg.color }]}>
                        <Text style={styles.asistenciaAvatarText}>{est.nombre.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.asistenciaNombre}>{est.nombre}</Text>
                        <Text style={styles.asistenciaZona}>{est.zona}</Text>
                      </View>
                    </View>
                    <View style={styles.asistenciaBotones}>
                      <TouchableOpacity
                        style={[styles.btnAsistencia, est.estado === 'abordo' && styles.btnAsistenciaActivo]}
                        onPress={() => marcarEstado(est.id, 'abordo')}
                      >
                        <Ionicons name="checkmark" size={16} color={est.estado === 'abordo' ? '#fff' : '#16A34A'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnAsistencia, est.estado === 'ausente' && styles.btnAusenteActivo]}
                        onPress={() => marcarEstado(est.id, 'ausente')}
                      >
                        <Ionicons name="close" size={16} color={est.estado === 'ausente' ? '#fff' : '#DC2626'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Footer fijo con safe area */}
            <View style={[styles.listaFooter, { paddingBottom: safeBottom + 8 }]}>
              <View style={styles.miniStats}>
                <MiniStat valor={abordo}    label="A bordo"   color="#16A34A" />
                <MiniStat valor={pendiente} label="Pendiente" color="#F59E0B" />
                <MiniStat valor={ausente}   label="Ausente"   color="#DC2626" />
              </View>
              <TouchableOpacity style={styles.btnIniciarRuta} onPress={iniciarRuta}>
                <Ionicons name="navigate" size={18} color="#0D1B3E" />
                <Text style={styles.btnIniciarRutaText}>Iniciar Ruta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ── FASE: EN RUTA ─────────────────────────────────────────────────────────
  if (fase === 'enruta') {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: safeBottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner GPS activo */}
          <Animated.View style={[styles.gpsBanner, { transform: [{ scale: pulso }] }]}>
            <View style={styles.gpsPunto} />
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsBannerTitle}>GPS activo · Ruta en curso</Text>
              <Text style={styles.gpsBannerSub}>Los padres están viendo tu ubicación en tiempo real</Text>
            </View>
            <Ionicons name="radio-outline" size={20} color="#fff" />
          </Animated.View>

          {/* Mapa simulado */}
          <View style={styles.mapaSimuladoConductor}>
            <View style={styles.mapaFondo}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={[styles.mapaLinea, { top: `${(i + 1) * 14}%` }]} />
              ))}
              {[...Array(6)].map((_, i) => (
                <View key={i} style={[styles.mapaLineaV, { left: `${(i + 1) * 14}%` }]} />
              ))}
            </View>
            <View style={styles.busIconWrap}>
              <Animated.View style={[styles.busIconPulse, { transform: [{ scale: pulso }] }]} />
              <View style={styles.busIcon}>
                <Ionicons name="bus" size={22} color="#fff" />
              </View>
            </View>
            <View style={styles.destinoPin}>
              <Ionicons name="location" size={22} color="#DC2626" />
              <Text style={styles.destinoPinText}>Destino</Text>
            </View>
            <View style={styles.mapaLabel}>
              <Ionicons name="navigate-circle" size={14} color="#00AEEF" />
              <Text style={styles.mapaLabelText}>Socket.io · actualización cada 5 seg</Text>
            </View>
          </View>

          {/* Resumen estudiantes */}
          <View style={styles.miniStats}>
            <MiniStat valor={abordo}    label="A bordo"   color="#16A34A" />
            <MiniStat valor={pendiente} label="Pendiente" color="#F59E0B" />
            <MiniStat valor={ausente}   label="Ausente"   color="#DC2626" />
          </View>

          {/* Lista rápida */}
          <Text style={styles.sectionLabel}>Estudiantes en ruta</Text>
          <View style={styles.infoCard}>
            {estudiantes.map((est, i) => {
              const cfg = {
                pendiente: { color: '#F59E0B', icon: 'time-outline'            },
                abordo:    { color: '#16A34A', icon: 'checkmark-circle-outline' },
                ausente:   { color: '#DC2626', icon: 'close-circle-outline'    },
                entregado: { color: '#0D1B3E', icon: 'school-outline'          },
              }[est.estado];

              return (
                <View key={est.id} style={[styles.estRutaRow, i < estudiantes.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.estRutaNombre}>{est.nombre}</Text>
                    <Text style={styles.estRutaZona}>{est.zona}</Text>
                  </View>
                  {est.estado === 'abordo' && (
                    <TouchableOpacity
                      style={styles.btnEntregado}
                      onPress={() => {
                        Alert.alert('Confirmar entrega', `¿Confirmas la entrega de ${est.nombre}?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Confirmar', onPress: () => marcarEstado(est.id, 'entregado') },
                        ]);
                      }}
                    >
                      <Text style={styles.btnEntregadoText}>Entregar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Botón finalizar */}
          <TouchableOpacity style={styles.btnFinalizar} onPress={finalizarRuta}>
            <Ionicons name="flag" size={18} color="#fff" />
            <Text style={styles.btnFinalizarText}>Finalizar Ruta</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  }

  // ── FASE: FINALIZADO ──────────────────────────────────────────────────────
  if (fase === 'finalizado') {
    const entregados = estudiantes.filter(e => e.estado === 'entregado').length;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '8%', paddingBottom: safeBottom + 16 }}>
        <View style={styles.finIconWrap}>
          <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
        </View>
        <Text style={styles.finTitle}>¡Ruta completada!</Text>
        <Text style={styles.finDesc}>
          {entregados} de {total} estudiantes fueron entregados exitosamente.
          Los padres han sido notificados.
        </Text>

        <View style={styles.resumenFinal}>
          <MiniStat valor={entregados}                   label="Entregados"   color="#16A34A" />
          <MiniStat valor={ausente}                      label="Ausentes"     color="#DC2626" />
          <MiniStat valor={total - entregados - ausente} label="Sin confirmar" color="#F59E0B" />
        </View>

        {/* ✅ ARREGLADO: botón ancho completo, texto en una línea, ícono + texto bien alineados */}
        <TouchableOpacity
          style={styles.btnNuevaJornada}
          onPress={() => {
            setFase('inicio');
            setEstudiantes(ESTUDIANTES_DEMO.map(e => ({ ...e, estado: 'pendiente' })));
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="#0D1B3E" />
          <Text style={styles.btnNuevaJornadaText} numberOfLines={1}>Nueva jornada</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function FilaInfoViaje({ icon, label, valor, last }) {
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

function MiniStat({ valor, label, color }) {
  return (
    <View style={styles.miniStatCard}>
      <Text style={[styles.miniStatValor, { color }]}>{valor}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
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
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  body: { flexGrow: 1, paddingHorizontal: '6%', paddingTop: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  sectionSub: { fontSize: 12, color: '#888', marginBottom: 14, marginTop: -6 },
  divider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 4 },

  // Hero (inicio conductor)
  heroCard: { backgroundColor: '#F0F5FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 24, alignItems: 'center', marginBottom: 20 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 8 },
  heroDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Mini stats
  miniStats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  miniStatCard: { flex: 1, backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 12, alignItems: 'center' },
  miniStatValor: { fontSize: 22, fontWeight: 'bold' },
  miniStatLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  // Botones principales
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FFD700', borderRadius: 16,
    paddingVertical: 15, marginBottom: 4,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },

  // ✅ Botón "Iniciar Ruta" — en footer de lista/qr
  btnIniciarRuta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FFD700', borderRadius: 14,
    paddingVertical: 14, marginTop: 10,
  },
  btnIniciarRutaText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },

  btnFinalizar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0D1B3E', borderRadius: 16,
    paddingVertical: 15, marginTop: 20,
  },
  btnFinalizarText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  btnDemo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#E3ECF7',
    borderRadius: 14, paddingVertical: 12, marginTop: 16,
  },
  btnDemoText: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },

  btnWA: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },

  // ✅ NUEVO — Botón "Nueva jornada" corregido: ancho completo, texto no se corta
  btnNuevaJornada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',       // ocupa todo el ancho disponible
    marginTop: 4,
  },
  btnNuevaJornadaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B3E',
    flexShrink: 1,              // evita desbordamiento del texto
  },

  // Banner estado viaje (padre)
  estadoViajeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, marginBottom: 20 },
  bannerEspera: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7' },
  bannerActivo: { backgroundColor: '#0D1B3E' },
  estadoPuntoGrande: { width: 16, height: 16, borderRadius: 8 },
  puntoBusEspera: { backgroundColor: '#C8D6E5' },
  puntoBusActivo: { backgroundColor: '#FFD700' },
  estadoViajeTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  estadoViajeSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Mapa padre
  mapaContainer: { marginBottom: 4 },
  mapaSimulado: { height: 200, backgroundColor: '#E8F0E8', borderRadius: 18, overflow: 'hidden', position: 'relative', borderWidth: 1.5, borderColor: '#E3ECF7' },
  mapaSimuladoConductor: { height: 200, backgroundColor: '#E8F0E8', borderRadius: 18, overflow: 'hidden', position: 'relative', borderWidth: 1.5, borderColor: '#E3ECF7', marginBottom: 16 },
  mapaFondo: { ...StyleSheet.absoluteFillObject },
  mapaLinea: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  mapaLineaV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  busIconWrap: { position: 'absolute', top: '40%', left: '45%', alignItems: 'center' },
  busIconPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(13,27,62,0.15)' },
  busIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  destinoPin: { position: 'absolute', top: '15%', right: '20%', alignItems: 'center' },
  destinoPinText: { fontSize: 10, color: '#DC2626', fontWeight: '700', marginTop: 2 },
  mapaInactivo: { height: 160, backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapaInactivoTitle: { fontSize: 14, fontWeight: '700', color: '#888' },
  mapaInactivoDesc: { fontSize: 12, color: '#aaa', textAlign: 'center', paddingHorizontal: 20 },
  mapaFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 },
  mapaFooterText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  mapaLabel: { position: 'absolute', bottom: 8, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  mapaLabelText: { fontSize: 10, color: '#0D1B3E', fontWeight: '600' },

  // GPS banner conductor
  gpsBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1B3E', borderRadius: 18, padding: 16, marginBottom: 16 },
  gpsPunto: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD700' },
  gpsBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  gpsBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Info card
  infoCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', paddingHorizontal: 16, paddingVertical: 4, marginBottom: 4 },
  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  filaInfoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3ECF7' },
  filaInfoLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  filaInfoValor: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },

  // Conductor (padre)
  conductorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatarMed: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  avatarMedText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  conductorNombre: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  conductorSub: { fontSize: 12, color: '#888', marginTop: 2 },

  // Hijos estado (padre)
  hijoEstadoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  hijoAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  hijoAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  hijoNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E', flex: 1 },
  estadoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  estadoChipText: { fontSize: 11, fontWeight: '700' },

  // Tabs
  tabsInternos: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E3ECF7', backgroundColor: '#fff', paddingHorizontal: '6%' },
  tabInterno: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabInternoActivo: { borderBottomColor: '#0D1B3E' },
  tabInternoText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  tabInternoTextActivo: { color: '#0D1B3E', fontWeight: '700' },

  // QR scanner
  qrOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  qrFrame: { width: 240, height: 240, position: 'relative' },
  qrCorner: { position: 'absolute', width: 30, height: 30, borderColor: '#FFD700', borderWidth: 3 },
  qrCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  qrCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  qrCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  qrCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  qrInstruccion: { position: 'absolute', bottom: -50, color: '#fff', fontWeight: '600', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  qrBottomBar: { backgroundColor: '#fff', paddingHorizontal: '6%', paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },

  // Permiso cámara
  permisoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '10%', gap: 12 },
  permisoTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E' },
  permisoDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Lista manual asistencia
  asistenciaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 12, marginBottom: 8 },
  asistenciaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  asistenciaAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  asistenciaAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  asistenciaNombre: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  asistenciaZona: { fontSize: 11, color: '#888', marginTop: 1 },
  asistenciaBotones: { flexDirection: 'row', gap: 8 },
  btnAsistencia: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  btnAsistenciaActivo: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  btnAusenteActivo: { backgroundColor: '#DC2626', borderColor: '#DC2626' },

  // Footer lista manual — paddingBottom se aplica dinámicamente con safeBottom
  listaFooter: { backgroundColor: '#fff', paddingHorizontal: '6%', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E3ECF7' },

  // En ruta — lista estudiantes
  estRutaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  estRutaNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E' },
  estRutaZona: { fontSize: 11, color: '#888', marginTop: 1 },
  btnEntregado: { backgroundColor: '#E6F9EE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  btnEntregadoText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  // Finalizado
  finIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E6F9EE', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  finTitle: { fontSize: 24, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 10 },
  finDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  resumenFinal: { flexDirection: 'row', gap: 10, marginBottom: 28, alignSelf: 'stretch' },
});