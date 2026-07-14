import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, RefreshControl, ActivityIndicator,
  Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function nombreConductor(conductor) {
  if (!conductor) return 'Conductor';
  return `${conductor.nombre || ''} ${conductor.apellido || ''}`.trim() || 'Conductor';
}

export default function AvisosPadreScreen({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [expandida, setExpandida] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  const tokenAuth = async () => auth.currentUser.getIdToken();

  const cargarNotificaciones = useCallback(async ({ mostrarCarga = false, silencioso = false } = {}) => {
    if (mostrarCarga) setCargando(true);
    try {
      const token = await tokenAuth();
      const response = await api.get('/api/notificaciones/padre', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nuevas = response.data.notificaciones || [];
      setNotificaciones(nuevas);
    } catch (error) {
      if (!silencioso) {
        console.log('Error cargando avisos:', error.response?.data || error.message);
      }
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones({ mostrarCarga: true });
    }, [cargarNotificaciones])
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarNotificaciones({ silencioso: true });
    }, 8000);
    return () => clearInterval(intervalo);
  }, [cargarNotificaciones]);



  const marcarLeida = async (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n._id === id ? { ...n, leida: true } : n))
    );
    try {
      const token = await tokenAuth();
      await api.patch(`/api/notificaciones/padre/${id}/leida`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leida: false } : n))
      );
      console.log('No se pudo marcar el aviso:', error.response?.data || error.message);
    }
  };

  const handleToggle = (id) => {
    if (expandida === id) {
      setExpandida(null);
      return;
    }
    setExpandida(id);
    marcarLeida(id);
  };

  const handleContactarConductor = async (conductor) => {
    const telefono = conductor?.telefono || conductor?.datos_conductor?.telefono;
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
  };

  const marcarTodasLeidas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida).map((n) => n._id);
    if (pendientes.length === 0 || marcandoTodas) return;

    setMarcandoTodas(true);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      const token = await tokenAuth();
      await api.patch('/api/notificaciones/padre/marcar-leidas/todas', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      const pendientesSet = new Set(pendientes);
      setNotificaciones((prev) => prev.map((n) => (
        pendientesSet.has(n._id) ? { ...n, leida: false } : n
      )));
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron marcar los avisos.');
    } finally {
      setMarcandoTodas(false);
    }
  };

  const refrescar = () => {
    setRefrescando(true);
    cargarNotificaciones();
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={20} color="#0D1B3E" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerSub}>BusWay</Text>
          <Text style={s.headerTitle}>Avisos</Text>
        </View>
        <View style={s.badgeWrap}>
          <Ionicons name="notifications-outline" size={20} color="#FFD700" />
          {sinLeer > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{sinLeer}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.card}>
        <View style={s.subHeader}>
          <Text style={s.subTitle}>Notificaciones recibidas</Text>

          <View style={s.actionRow}>
            {sinLeer > 0 ? (
              <Text style={s.subSub}>{sinLeer} sin leer</Text>
            ) : (
              <Text style={s.subSub}>Todo al día</Text>
            )}
            {sinLeer > 0 && (
              <TouchableOpacity
                style={s.markAllButton}
                onPress={marcarTodasLeidas}
                disabled={marcandoTodas}
                activeOpacity={0.8}
              >
                {marcandoTodas ? (
                  <ActivityIndicator size="small" color="#007DB8" />
                ) : (
                  <Text style={s.markAllText}>Marcar todas como leídas</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
        >
          {cargando && (
            <View style={s.loadingBox}>
              <ActivityIndicator color="#00AEEF" />
              <Text style={s.loadingText}>Cargando avisos...</Text>
            </View>
          )}

          {!cargando && notificaciones.length === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="notifications-off-outline" size={44} color="#C8D6E5" />
              <Text style={s.emptyText}>No tienes avisos aún</Text>
              <Text style={s.emptySub}>Las notificaciones de tu conductor aparecerán aquí</Text>
            </View>
          )}

          {!cargando && notificaciones.map((n) => {
            const abierta = expandida === n._id;
            const emergencia = n.audiencia === 'asistentes';
            const hijos = n.hijos_afectados || [];

            return (
              <TouchableOpacity
                key={n._id}
                style={[s.notifCard, !n.leida && s.notifCardUnread, emergencia && s.notifCardEmergency]}
                onPress={() => handleToggle(n._id)}
                activeOpacity={0.85}
              >
                {!n.leida && <View style={s.unreadDot} />}

                <View style={[s.notifIcon, !n.leida && s.notifIconUnread, emergencia && s.notifIconEmergency]}>
                  <Ionicons
                    name={emergencia ? 'alert-circle-outline' : 'megaphone-outline'}
                    size={20}
                    color={emergencia ? '#DC2626' : n.leida ? '#00AEEF' : '#0D1B3E'}
                  />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <View style={s.titleRow}>
                    <Text style={s.conductorNombre}>{nombreConductor(n.conductor_id)}</Text>
                    <Text style={[s.tipoText, emergencia && s.tipoTextEmergency]}>
                      {emergencia ? 'Emergencia' : 'Aviso'}
                    </Text>
                  </View>

                  <Text
                    style={[s.notifTexto, !n.leida && s.notifTextoUnread]}
                    numberOfLines={abierta ? undefined : 2}
                  >
                    {n.mensaje}
                  </Text>

                  {abierta && (
                    <>
                      <View style={s.hijosRow}>
                        <Ionicons name="people-outline" size={13} color="#00AEEF" />
                        <Text style={s.hijosText}>
                          Aplica a: {hijos.length > 0 ? hijos.map((hijo) => hijo.nombre).join(', ') : 'tu ruta'}
                        </Text>
                      </View>
                      {(n.conductor_id?.telefono || n.conductor_id?.datos_conductor?.telefono) && (
                        <TouchableOpacity
                          style={s.btnChatConductor}
                          onPress={() => handleContactarConductor(n.conductor_id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="logo-whatsapp" size={14} color="#FFF" />
                          <Text style={s.btnChatConductorText}>Contactar Conductor</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  <View style={s.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#9AA4B2" />
                    <Text style={s.fechaText}>{formatearFecha(n.fecha)}</Text>
                    <Text style={s.estadoText}>{n.leida ? 'Leída' : 'No leída'}</Text>
                    <Ionicons
                      name={abierta ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={14}
                      color="#9AA4B2"
                      style={{ marginLeft: 'auto' }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B3E' },
  header: {
    backgroundColor: '#0D1B3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '6%',
    paddingTop: 8,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#FFD700',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  badgeWrap: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  subHeader: {
    flexDirection: 'column',
    paddingHorizontal: '6%',
    paddingTop: 22,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4FA',
    gap: 6,
  },
  subTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  subSub: { fontSize: 12, color: '#8A94A6' },
  markAllButton: { minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  markAllText: { fontSize: 12, color: '#007DB8', fontWeight: '700' },
  body: { paddingHorizontal: '6%', paddingTop: 16, paddingBottom: 32, gap: 10 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  loadingText: { fontSize: 13, color: '#8A94A6' },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#F5F8FC',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E3ECF7',
    padding: 14, position: 'relative', overflow: 'hidden',
  },
  notifCardUnread: {
    backgroundColor: '#FFFBEA',
    borderColor: '#FFD700',
  },
  notifCardEmergency: {
    borderColor: '#F6CACA',
  },
  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  notifIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF8FF',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifIconUnread: { backgroundColor: '#FFD700' },
  notifIconEmergency: { backgroundColor: '#FEECEC' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  conductorNombre: { fontSize: 12, fontWeight: '700', color: '#00AEEF', flex: 1 },
  tipoText: { fontSize: 10, color: '#0D1B3E', fontWeight: '800', textTransform: 'uppercase' },
  tipoTextEmergency: { color: '#DC2626' },
  notifTexto: { fontSize: 13, color: '#3F4A5A', lineHeight: 18 },
  notifTextoUnread: { color: '#0D1B3E', fontWeight: '600' },
  hijosRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  hijosText: { fontSize: 12, color: '#007DB8', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fechaText: { fontSize: 11, color: '#8A94A6' },
  estadoText: { fontSize: 11, color: '#00AEEF', fontWeight: '700', marginLeft: 6 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: '#8A94A6', fontWeight: '600' },
  emptySub: { fontSize: 12, color: '#AEB7C4', textAlign: 'center', paddingHorizontal: 32 },
  btnChatConductor: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  btnChatConductorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
});
