import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Datos de ejemplo — reemplazar con consulta a Firestore del padre autenticado
const NOTIFICACIONES_MOCK = [
  {
    id: 'n1',
    conductor: 'Carlos Rodríguez',
    texto: 'Tráfico en la vía — retraso aprox. 10 min',
    fecha: '11 jun 2026, 7:42 a.m.',
    leida: false,
    hijosAfectados: ['Sofía'],
  },
  {
    id: 'n2',
    conductor: 'Carlos Rodríguez',
    texto: 'El bus ya está en camino, todo en orden',
    fecha: '10 jun 2026, 6:58 a.m.',
    leida: true,
    hijosAfectados: ['Sofía', 'Mateo'],
  },
  {
    id: 'n3',
    conductor: 'Carlos Rodríguez',
    texto: 'Por lluvia intensa, la ruta tendrá retraso',
    fecha: '9 jun 2026, 7:15 a.m.',
    leida: true,
    hijosAfectados: ['Sofía'],
  },
  {
    id: 'n4',
    conductor: 'Carlos Rodríguez',
    texto: 'Ruta cancelada por el día de hoy',
    fecha: '5 jun 2026, 6:30 a.m.',
    leida: true,
    hijosAfectados: ['Mateo'],
  },
];

export default function AvisosPadreScreen({ navigation, route }) {
  const { usuario } = route.params || { usuario: {} };
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_MOCK);
  const [expandida, setExpandida] = useState(null);

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  const marcarLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const handleToggle = (id) => {
    if (expandida === id) {
      setExpandida(null);
    } else {
      setExpandida(id);
      marcarLeida(id);
    }
  };

  const marcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back-outline" size={20} color="#0D1B3E" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerSub}>BusWay</Text>
          <Text style={s.headerTitle}>Avisos</Text>
        </View>
        {/* Badge sin leer */}
        <View style={s.badgeWrap}>
          <Ionicons name="notifications-outline" size={20} color="#FFD700" />
          {sinLeer > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{sinLeer}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Card blanca ── */}
      <View style={s.card}>
        {/* Subheader Modificado */}
        <View style={s.subHeader}>
          <Text style={s.subTitle}>Notificaciones recibidas</Text>
          
          <View style={s.actionRow}>
            {sinLeer > 0 ? (
              <Text style={s.subSub}>{sinLeer} sin leer</Text>
            ) : (
              <Text style={s.subSub}>Todo al día ✓</Text>
            )}

            {sinLeer > 0 && (
              <TouchableOpacity onPress={marcarTodasLeidas} activeOpacity={0.8}>
                <Text style={s.markAll}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {notificaciones.length === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="notifications-off-outline" size={44} color="#ccc" />
              <Text style={s.emptyText}>No tienes avisos aún</Text>
              <Text style={s.emptySub}>Las notificaciones de tu conductor aparecerán aquí</Text>
            </View>
          )}

          {notificaciones.map((n) => {
            const abierta = expandida === n.id;
            return (
              <TouchableOpacity
                key={n.id}
                style={[s.notifCard, !n.leida && s.notifCardUnread]}
                onPress={() => handleToggle(n.id)}
                activeOpacity={0.85}
              >
                {/* Punto sin leer */}
                {!n.leida && <View style={s.unreadDot} />}

                <View style={[s.notifIcon, !n.leida && s.notifIconUnread]}>
                  <Ionicons
                    name="megaphone-outline"
                    size={20}
                    color={n.leida ? '#00AEEF' : '#0D1B3E'}
                  />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  {/* Conductor */}
                  <Text style={s.conductorNombre}>{n.conductor}</Text>

                  {/* Texto del aviso */}
                  <Text
                    style={[s.notifTexto, !n.leida && s.notifTextoUnread]}
                    numberOfLines={abierta ? undefined : 2}
                  >
                    {n.texto}
                  </Text>

                  {/* Hijos afectados (expandido) */}
                  {abierta && (
                    <View style={s.hijosRow}>
                      <Ionicons name="people-outline" size={13} color="#00AEEF" />
                      <Text style={s.hijosText}>
                        Aplica a: {n.hijosAfectados.join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Meta: fecha + chevron */}
                  <View style={s.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#bbb" />
                    <Text style={s.fechaText}>{n.fecha}</Text>
                    <Ionicons
                      name={abierta ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={14}
                      color="#ccc"
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

  // Header
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
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  // Card
  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },

  // Subheader corregido
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
  
  // Nueva fila contenedora para los elementos inferiores
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  subSub: { fontSize: 12, color: '#aaa' },
  markAll: { fontSize: 12, color: '#00AEEF', fontWeight: '600' },

  body: { paddingHorizontal: '6%', paddingTop: 16, paddingBottom: 32, gap: 10 },

  // Tarjeta notificación
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

  conductorNombre: { fontSize: 12, fontWeight: '700', color: '#00AEEF' },
  notifTexto: { fontSize: 13, color: '#555', lineHeight: 18 },
  notifTextoUnread: { color: '#0D1B3E', fontWeight: '600' },

  hijosRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  hijosText: { fontSize: 12, color: '#00AEEF' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fechaText: { fontSize: 11, color: '#bbb' },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: '#ccc', fontWeight: '600' },
  emptySub: { fontSize: 12, color: '#ddd', textAlign: 'center', paddingHorizontal: 32 },
});