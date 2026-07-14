import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useViaje from './hooks/useViaje';
import { auth } from '../../config/firebase';
import api from '../../config/api';

import ViajeInicio from './componentes/ViajeInicio';
import ViajeAsistencia from './componentes/ViajeAsistencia';
import ViajeActivo from './componentes/ViajeActivo';
import ViajeFinalizado from './componentes/ViajeFinalizado';

function nombresGrupo(hijos) {
  const nombres = hijos.map(h => h.nombre);
  if (nombres.length === 1) return nombres[0];
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres[0]}, ${nombres[1]} y ${nombres.length - 2} más`;
}

function badgeFase(fase) {
  switch (fase) {
    case 'en_curso': return { label: 'En camino', bg: '#E6F9EE', color: '#16A34A' };
    case 'entre_viajes': return { label: 'Entre viajes', bg: '#FEF3C7', color: '#B45309' };
    case 'sin_viaje': return { label: 'Por iniciar', bg: '#E8F1FF', color: '#2563EB' };
    case 'jornada_completa': return { label: 'Finalizado', bg: '#F1F5F9', color: '#475569' };
    case 'error': return { label: 'Sin datos', bg: '#F1F5F9', color: '#64748B' };
    default: return { label: 'Cargando...', bg: '#F1F5F9', color: '#64748B' };
  }
}

export default function ViajeScreen({ navigation, route }) {
  const { usuario, selectedRutaId, ruta_id } = route?.params || {};
  const esPadre = usuario?.tipo === 'padre';
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);
  const [mostrarGrid, setMostrarGrid] = useState(false);
  const activeRutaId = ruta_id || selectedRutaId;
  const activeHijoId = hijoSeleccionado?._id || hijoSeleccionado?.id || null;
  const insets = useSafeAreaInsets();

  const viaje = useViaje({ usuario, esPadre, selectedHijoId: activeHijoId, selectedRutaId: activeRutaId });

  const uniqueRutas = useMemo(() => {
    if (!esPadre || !viaje.rawHijos) return [];
    return Array.from(new Set(
      viaje.rawHijos.map(h => h.ruta_id?._id?.toString() || h.ruta_id?.toString()).filter(Boolean)
    ));
  }, [esPadre, viaje.rawHijos]);

  const gruposPorRuta = useMemo(() => {
    if (!esPadre || !viaje.rawHijos) return [];
    return uniqueRutas.map(rutaId => {
      const hijosDeRuta = viaje.rawHijos.filter(h => (h.ruta_id?._id?.toString() || h.ruta_id?.toString()) === rutaId);
      return { rutaId, hijos: hijosDeRuta, representante: hijosDeRuta[0] };
    });
  }, [esPadre, viaje.rawHijos, uniqueRutas]);

  const idsHijosRutaActiva = useMemo(() => {
    if (!esPadre || !hijoSeleccionado || !viaje.rawHijos) return null;
    const rutaIdSeleccionada = hijoSeleccionado.ruta_id?._id?.toString() || hijoSeleccionado.ruta_id?.toString();
    if (!rutaIdSeleccionada) return null;
    return viaje.rawHijos
      .filter(h => (h.ruta_id?._id?.toString() || h.ruta_id?.toString()) === rutaIdSeleccionada)
      .map(h => String(h._id));
  }, [esPadre, hijoSeleccionado, viaje.rawHijos]);

  const [infoGruposRuta, setInfoGruposRuta] = useState({});

  const cargarInfoGrupos = useCallback(async () => {
    if (!esPadre || gruposPorRuta.length === 0) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const entradas = await Promise.all(gruposPorRuta.map(async (grupo) => {
        const representante = grupo.representante;
        if (!representante) return [grupo.rutaId, null];
        const condId = representante.conductor_id?._id || representante.conductor_id;
        try {
          const [resRuta, resViaje] = await Promise.all([
            condId
              ? api.get(`/api/conductor/${condId}/ruta?ruta_id=${grupo.rutaId}`, { headers: { Authorization: `Bearer ${token}` } })
              : Promise.resolve(null),
            api.get(`/api/viajes/activo/padre?estudiante_id=${representante._id}&ruta_id=${grupo.rutaId}`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const horario = resRuta?.data?.ruta?.horario || null;
          const horaEntrada = horario?.split('—')[1]?.trim() || null;
          const fase = resViaje?.data?.fase || 'sin_viaje';
          return [grupo.rutaId, { horaEntrada, fase }];
        } catch (err) {
          return [grupo.rutaId, { horaEntrada: null, fase: 'error' }];
        }
      }));
      setInfoGruposRuta(Object.fromEntries(entradas));
    } catch (err) {
      console.log('Error cargando info de grupos de rutas:', err.message);
    }
  }, [esPadre, gruposPorRuta]);

  const [refrescandoGrid, setRefrescandoGrid] = useState(false);
  const alRefrescarGrid = useCallback(async () => {
    setRefrescandoGrid(true);
    await cargarInfoGrupos();
    setRefrescandoGrid(false);
  }, [cargarInfoGrupos]);

  useEffect(() => {
    if (!mostrarGrid) return;
    cargarInfoGrupos();
  }, [mostrarGrid, cargarInfoGrupos]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (mostrarGrid) cargarInfoGrupos();
    });
    return unsubscribe;
  }, [navigation, mostrarGrid, cargarInfoGrupos]);

  useEffect(() => {
    if (route?.params?.hijoSeleccionado) {
      setHijoSeleccionado(route.params.hijoSeleccionado);
      setMostrarGrid(false);
    }
  }, [route?.params?.hijoSeleccionado]);

  useEffect(() => {
    if (!esPadre || !viaje.rawHijos || viaje.rawHijos.length === 0) return;
    if (viaje.rawHijos.length === 1 || uniqueRutas.length <= 1) {
      setHijoSeleccionado(viaje.rawHijos[0]);
      setMostrarGrid(false);
    } else {
      if (!hijoSeleccionado && !route?.params?.hijoSeleccionado) {
        setMostrarGrid(true);
      }
    }
  }, [esPadre, viaje.rawHijos, hijoSeleccionado]);

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
            <Text style={styles.errorTitle}>Datos de usuario no disponibles</Text>
            <Text style={styles.errorSub}>Vuelve a ingresar a la pantalla para cargar la información.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    if (esPadre) {
      return <ViajeActivo esPadre={true} {...viaje} hijoSeleccionado={hijoSeleccionado} idsHijosRuta={idsHijosRutaActiva} bottomInset={insets.bottom} />;
    }

    const { currentStep, tipoViaje } = viaje;

    if (tipoViaje === 'ida' && currentStep === 'ATTENDANCE') {
      return <ViajeActivo esPadre={false} {...viaje} bottomInset={insets.bottom} />;
    }

    switch (viaje.currentStep) {
      case 'PRE_TRIP':
        return <ViajeInicio {...viaje} />;
      case 'SCHOOL_CHECKIN':
        return (
          <ViajeAsistencia
            estudiantes={viaje.estudiantes}
            marcarEstado={viaje.marcarEstado}
            handleQRScanned={viaje.handleQRScanned}
            iniciarRuta={viaje.iniciarRuta}
            bottomInset={insets.bottom}
          />
        );

      // En el caso de viajes de ida, se omite la pantalla de asistencia y se pasa directamente a la pantalla de viaje activo
      case 'ATTENDANCE':
        return (
          <ViajeAsistencia
            estudiantes={viaje.estudiantes}
            marcarEstado={viaje.marcarEstado}
            handleQRScanned={viaje.handleQRScanned}
            iniciarRuta={viaje.iniciarRuta}
            bottomInset={insets.bottom}
          />
        );

      case 'ACTIVE_TRIP':
        return <ViajeActivo esPadre={false} {...viaje} bottomInset={insets.bottom} />;

      case 'MID_JOURNEY_CONFIRM':
        return <ViajeFinalizado {...viaje} bottomInset={insets.bottom} />;

      case 'COMPLETED':
        return <ViajeFinalizado {...viaje} bottomInset={insets.bottom} />;

      default:
        return null;
    }
  };

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

      {esPadre && uniqueRutas.length > 1 && !mostrarGrid && (
        <TouchableOpacity style={styles.cambiarHijoPill} onPress={() => setMostrarGrid(true)}>
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text style={styles.cambiarHijoPillText}>Cambiar de hijo</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        {viaje.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D1B3E" style={{ marginBottom: 10 }} />
            <Text style={[styles.loadingText, { color: '#0D1B3E' }]}>Cargando información del viaje...</Text>
          </View>
        ) : viaje.error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
            <Text style={styles.errorTitle}>Sin servicio activo</Text>
            <Text style={styles.errorSub}>{viaje.error}</Text>
          </View>
        ) : esPadre && mostrarGrid && viaje.rawHijos ? (
          <ScrollView
            contentContainerStyle={styles.gridBody}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refrescandoGrid} onRefresh={alRefrescarGrid} />}
          >
            <Text style={styles.sectionLabel}>¿A qué hijo deseas acompañar hoy?</Text>
            <View style={styles.gridDivider} />
            {gruposPorRuta.map((grupo) => {
              const info = infoGruposRuta[grupo.rutaId];
              const badge = badgeFase(info?.fase);
              const escuela = grupo.representante.ruta_id?.escuela || grupo.representante.ruta_id?.nombre_ruta || 'Escuela asignada';
              return (
                <TouchableOpacity
                  key={grupo.rutaId}
                  style={styles.tarjetaHijo}
                  onPress={() => {
                    setHijoSeleccionado(grupo.representante);
                    setMostrarGrid(false);
                  }}
                >
                  <View style={styles.tarjetaFilaSuperior}>
                    <View style={styles.avatarGroupContainer}>
                      <View style={styles.avatarGrupo}>
                        <Text style={styles.avatarGrupoText}>{grupo.hijos[0].nombre.charAt(0)}</Text>
                      </View>
                      {grupo.hijos.length > 1 && (
                        <View style={[styles.avatarGrupo, styles.avatarGrupoSecundario]}>
                          <Text style={styles.avatarGrupoText}>{grupo.hijos[1].nombre.charAt(0)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.tarjetaInfo}>
                      <Text style={styles.nombreGrupo}>{nombresGrupo(grupo.hijos)}</Text>
                      <Text style={styles.escuelaGrupo}>{escuela}</Text>
                    </View>
                    <View style={[styles.badgeEstado, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeEstadoText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <View style={styles.tarjetaDivider} />
                  <View style={styles.tarjetaFilaInferior}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.entradaText}>
                      {info === undefined
                        ? 'Cargando horario...'
                        : info.horaEntrada
                          ? `Entrada a las ${info.horaEntrada}`
                          : 'Horario no disponible'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          renderStep()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B3E' },
  header: { backgroundColor: '#0D1B3E', paddingTop: 8, paddingBottom: 28, paddingHorizontal: '6%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  cambiarHijoPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 10, marginHorizontal: '6%', marginBottom: 12 },
  cambiarHijoPillText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  errorTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D1B3E', marginTop: 10 },
  errorSub: { color: '#888', textAlign: 'center', marginTop: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  gridDivider: { height: 1, backgroundColor: '#E3ECF7', marginBottom: 12 },
  gridBody: { padding: 20, gap: 12 },
  tarjetaHijo: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 16, padding: 14 },
  tarjetaFilaSuperior: { flexDirection: 'row', alignItems: 'center' },
  avatarGroupContainer: { flexDirection: 'row' },
  avatarGrupo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  avatarGrupoSecundario: { marginLeft: -14, borderWidth: 2, borderColor: '#fff' },
  avatarGrupoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tarjetaInfo: { flex: 1, marginLeft: 12 },
  nombreGrupo: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  escuelaGrupo: { fontSize: 12, color: '#666', marginTop: 2 },
  badgeEstado: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeEstadoText: { fontSize: 11, fontWeight: '700' },
  tarjetaDivider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 12 },
  tarjetaFilaInferior: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entradaText: { fontSize: 12, color: '#888' },
});
