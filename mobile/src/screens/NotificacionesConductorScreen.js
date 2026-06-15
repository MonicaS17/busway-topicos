import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MENSAJES_PREDEFINIDOS = [
  { id: 1, icono: 'car-outline',         texto: 'Tráfico en la vía — retraso aprox. 10 min' },
  { id: 2, icono: 'construct-outline',   texto: 'El bus tiene una falla mecánica — servicio suspendido hoy' },
  { id: 3, icono: 'time-outline',        texto: 'Llegaré 15 minutos tarde al punto de recogida' },
  { id: 4, icono: 'checkmark-circle-outline', texto: 'El bus ya está en camino, todo en orden' },
  { id: 5, icono: 'cloud-outline',       texto: 'Por lluvia intensa, la ruta tendrá retraso' },
  { id: 6, icono: 'close-circle-outline',texto: 'Ruta cancelada por el día de hoy' },
];

export default function NotificacionesConductorScreen({ navigation, route }) {
  const { usuario } = route.params;
  const [mensaje, setMensaje] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tab, setTab] = useState('enviar'); // 'enviar' | 'historial'

  // Historial local de ejemplo — reemplazar con llamada a Firestore
  const [historial] = useState([
    {
      id: 'h1',
      texto: 'Tráfico en la vía — retraso aprox. 10 min',
      fecha: '11 jun 2026, 7:42 a.m.',
      padresEnviados: 8,
    },
    {
      id: 'h2',
      texto: 'El bus ya está en camino, todo en orden',
      fecha: '10 jun 2026, 6:58 a.m.',
      padresEnviados: 8,
    },
    {
      id: 'h3',
      texto: 'Por lluvia intensa, la ruta tendrá retraso',
      fecha: '9 jun 2026, 7:15 a.m.',
      padresEnviados: 7,
    },
  ]);

  const seleccionarPredefinido = (item) => {
    if (seleccionado?.id === item.id) {
      // Deseleccionar
      setSeleccionado(null);
      setMensaje('');
    } else {
      setSeleccionado(item);
      setMensaje(item.texto);
    }
  };

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      Alert.alert('Mensaje vacío', 'Escribe o selecciona un mensaje antes de enviar.');
      return;
    }
    Alert.alert(
      'Confirmar envío',
      `Se enviará a todos tus padres vinculados:\n\n"${mensaje}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setEnviando(true);
            try {
              // TODO: llamar a tu Cloud Function / FCM
              // await sendNotificationToParents(usuario.uid, mensaje);
              await new Promise((r) => setTimeout(r, 1200)); // simulación
              Alert.alert('✅ Enviado', 'La notificación fue enviada a todos tus padres vinculados.');
              setMensaje('');
              setSeleccionado(null);
            } catch {
              Alert.alert('Error', 'No se pudo enviar la notificación. Intenta de nuevo.');
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );
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
          <Text style={s.headerTitle}>Notificaciones</Text>
        </View>
        <View style={s.headerIconCircle}>
          <Ionicons name="notifications-outline" size={22} color="#FFD700" />
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.card}>
        <View style={s.tabs}>
          {[
            { key: 'enviar',    label: 'Enviar aviso' },
            { key: 'historial', label: 'Historial' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabItem, tab === t.key && s.tabItemActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: ENVIAR ── */}
        {tab === 'enviar' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={s.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Predefinidos */}
              <Text style={s.sectionTitle}>Mensajes rápidos</Text>
              <Text style={s.sectionSub}>Toca uno para usarlo como base</Text>

              {MENSAJES_PREDEFINIDOS.map((item) => {
                const activo = seleccionado?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.predCard, activo && s.predCardActive]}
                    onPress={() => seleccionarPredefinido(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.predIcon, activo && s.predIconActive]}>
                      <Ionicons name={item.icono} size={20} color={activo ? '#0D1B3E' : '#00AEEF'} />
                    </View>
                    <Text style={[s.predTexto, activo && s.predTextoActive]} numberOfLines={2}>
                      {item.texto}
                    </Text>
                    {activo && (
                      <Ionicons name="checkmark-circle" size={18} color="#FFD700" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Mensaje personalizado */}
              <Text style={[s.sectionTitle, { marginTop: 24 }]}>Mensaje personalizado</Text>
              <Text style={s.sectionSub}>Edita el mensaje rápido o redacta uno nuevo</Text>

              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="Ej: El bus saldrá 5 minutos tarde hoy..."
                  placeholderTextColor="#bbb"
                  multiline
                  maxLength={300}
                  value={mensaje}
                  onChangeText={(t) => {
                    setMensaje(t);
                    if (seleccionado && t !== seleccionado.texto) setSeleccionado(null);
                  }}
                  textAlignVertical="top"
                />
                <Text style={s.charCount}>{mensaje.length}/300</Text>
              </View>

              {/* Info */}
              <View style={s.infoRow}>
                <Ionicons name="information-circle-outline" size={15} color="#00AEEF" />
                <Text style={s.infoText}>
                  Solo se notificará a padres cuyos hijos tienen asistencia activa hoy.
                </Text>
              </View>

              {/* Botón enviar */}
              <TouchableOpacity
                style={[s.btnEnviar, (!mensaje.trim() || enviando) && s.btnEnviarDisabled]}
                onPress={handleEnviar}
                disabled={!mensaje.trim() || enviando}
                activeOpacity={0.85}
              >
                {enviando
                  ? <Text style={s.btnEnviarText}>Enviando...</Text>
                  : (
                    <>
                      <Ionicons name="send-outline" size={18} color="#0D1B3E" style={{ marginRight: 8 }} />
                      <Text style={s.btnEnviarText}>Enviar a todos los padres</Text>
                    </>
                  )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── TAB: HISTORIAL ── */}
        {tab === 'historial' && (
          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            <Text style={s.sectionTitle}>Avisos enviados</Text>
            <Text style={s.sectionSub}>Registro de notificaciones enviadas</Text>

            {historial.length === 0 && (
              <View style={s.emptyBox}>
                <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
                <Text style={s.emptyText}>Aún no has enviado ningún aviso</Text>
              </View>
            )}

            {historial.map((h) => (
              <View key={h.id} style={s.histCard}>
                <View style={s.histLeft}>
                  <Ionicons name="send-outline" size={18} color="#00AEEF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.histTexto}>{h.texto}</Text>
                  <View style={s.histMeta}>
                    <Ionicons name="time-outline" size={12} color="#aaa" />
                    <Text style={s.histFecha}>{h.fecha}</Text>
                    <Text style={s.histPadres}>· {h.padresEnviados} padres</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
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
  headerIconCircle: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Card base
  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: '6%',
    marginTop: 20,
    marginBottom: 4,
    backgroundColor: '#F5F8FC',
    borderRadius: 14,
    padding: 4,
  },
  tabItem: {
    flex: 1, paddingVertical: 10,
    borderRadius: 11, alignItems: 'center',
  },
  tabItemActive: { backgroundColor: '#fff', shadowColor: '#0D1B3E', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabLabel: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  tabLabelActive: { color: '#0D1B3E', fontWeight: '700' },

  // Body scroll
  body: { paddingHorizontal: '6%', paddingTop: 20, paddingBottom: 32 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: '#aaa', marginTop: 2, marginBottom: 14 },

  // Predefinidos
  predCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7',
    padding: 14, marginBottom: 10, gap: 12,
  },
  predCardActive: { borderColor: '#FFD700', backgroundColor: '#FFFBEA' },
  predIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E3ECF7',
  },
  predIconActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  predTexto: { flex: 1, fontSize: 13, color: '#444', lineHeight: 18 },
  predTextoActive: { color: '#0D1B3E', fontWeight: '600' },

  // Input
  inputBox: {
    backgroundColor: '#F5F8FC',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E3ECF7',
    padding: 14, minHeight: 110,
  },
  input: { fontSize: 14, color: '#0D1B3E', lineHeight: 20, flex: 1, minHeight: 80 },
  charCount: { fontSize: 11, color: '#ccc', textAlign: 'right', marginTop: 6 },

  // Info
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 12, marginBottom: 24,
    backgroundColor: '#EFF8FF', borderRadius: 12,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: '#00AEEF', lineHeight: 17 },

  // Botón enviar
  btnEnviar: {
    backgroundColor: '#FFD700', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16,
  },
  btnEnviarDisabled: { opacity: 0.45 },
  btnEnviarText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },

  // Historial
  histCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#F5F8FC', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E3ECF7',
    padding: 14, marginBottom: 10,
  },
  histLeft: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFF8FF', alignItems: 'center', justifyContent: 'center',
  },
  histTexto: { fontSize: 13, color: '#0D1B3E', fontWeight: '600', lineHeight: 18, marginBottom: 6 },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histFecha: { fontSize: 11, color: '#aaa' },
  histPadres: { fontSize: 11, color: '#00AEEF', fontWeight: '600' },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 14, color: '#ccc' },
});