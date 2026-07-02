import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';

const MENSAJES_PREDEFINIDOS = [
  { id: 1, icono: 'car-outline', texto: 'Tráfico en la vía - retraso aproximado de 10 minutos' },
  { id: 2, icono: 'construct-outline', texto: 'El bus presenta una falla mecánica - servicio suspendido por hoy' },
  { id: 3, icono: 'time-outline', texto: 'Llegaré 15 minutos tarde al punto de recogida' },
  { id: 4, icono: 'checkmark-circle-outline', texto: 'El bus ya está en camino, todo en orden' },
  { id: 5, icono: 'cloud-outline', texto: 'Por lluvia intensa, la ruta tendrá retraso' },
  { id: 6, icono: 'close-circle-outline', texto: 'Ruta cancelada por el día de hoy' },
];

const AUDIENCIAS = [
  {
    key: 'todos',
    titulo: 'Todos',
    subtitulo: 'Padres vinculados a tu ruta',
    icono: 'people-outline',
  },
  {
    key: 'asistentes',
    titulo: 'Asistentes',
    subtitulo: 'Solo asistentes de hoy',
    icono: 'alert-circle-outline',
  },
  {
    key: 'individual',
    titulo: 'Individual',
    subtitulo: 'Un padre con hijo asistente',
    icono: 'person-outline',
  },
];

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

export default function NotificacionesConductorScreen({ navigation }) {
  const [mensaje, setMensaje] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [audiencia, setAudiencia] = useState('todos');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [tab, setTab] = useState('enviar');
  const [historial, setHistorial] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [cargandoAsistentes, setCargandoAsistentes] = useState(false);

  const cargarHistorial = useCallback(async (mostrarCarga = false) => {
    if (mostrarCarga) setCargando(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/notificaciones/conductor/historial', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistorial(response.data.notificaciones || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo cargar el historial.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial(true);
  }, [cargarHistorial]);

  const cargarAsistentes = useCallback(async () => {
    setCargandoAsistentes(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/notificaciones/conductor/asistentes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lista = response.data.asistentes || [];
      setAsistentes(lista);
      return lista;
    } catch (error) {
      setAsistentes([]);
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron cargar los asistentes.');
      return null;
    } finally {
      setCargandoAsistentes(false);
    }
  }, []);

  useEffect(() => {
    if (audiencia === 'individual') cargarAsistentes();
  }, [audiencia, cargarAsistentes]);

  const seleccionarAudiencia = async (tipo) => {
    setAudiencia(tipo);
    if (tipo !== 'individual') setEstudianteSeleccionado(null);

    if (tipo === 'asistentes') {
      const lista = await cargarAsistentes();
      if (lista && lista.length === 0) {
        Alert.alert('Sin asistencia', 'No se encontraron estudiantes con asistencia registrada hoy.');
      }
    }
  };

  const seleccionarPredefinido = (item) => {
    if (seleccionado?.id === item.id) {
      setSeleccionado(null);
      setMensaje('');
      return;
    }
    setSeleccionado(item);
    setMensaje(item.texto);
  };

  const enviarNotificacion = async () => {
    setEnviando(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.post(
        '/api/notificaciones/conductor/enviar',
        {
          mensaje: mensaje.trim(),
          audiencia,
          estudiante_id: audiencia === 'individual' ? estudianteSeleccionado : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Aviso enviado',
        `La notificación quedó guardada y fue enviada dentro de la app a ${response.data.enviados} padre(s).`
      );
      setMensaje('');
      setSeleccionado(null);
      setEstudianteSeleccionado(null);
      await cargarHistorial();
      setTab('historial');
    } catch (error) {
      Alert.alert('No se pudo enviar', error.response?.data?.error || 'Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviar = () => {
    if (!mensaje.trim()) {
      Alert.alert('Mensaje vacío', 'Escribe o selecciona un mensaje antes de enviar.');
      return;
    }
    if (audiencia === 'individual' && !estudianteSeleccionado) {
      Alert.alert('Selecciona un estudiante', 'Elige al hijo asistente cuyo padre recibira la emergencia.');
      return;
    }

    const asistente = asistentes.find((item) => item._id === estudianteSeleccionado);
    const destino = audiencia === 'todos'
      ? 'todos los padres vinculados a tu ruta'
      : audiencia === 'asistentes'
        ? 'los padres de los estudiantes asistentes de hoy'
        : `el padre de ${asistente?.nombre || 'el estudiante seleccionado'}`;

    Alert.alert(
      'Confirmar envío',
      `Se enviará a ${destino}:\n\n"${mensaje.trim()}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: enviarNotificacion },
      ]
    );
  };

  const refrescar = () => {
    setRefrescando(true);
    cargarHistorial();
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
          <Text style={s.headerTitle}>Notificaciones</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      <View style={s.card}>
        <View style={s.tabs}>
          {[
            { key: 'enviar', label: 'Enviar aviso' },
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
              <Text style={s.sectionTitle}>Enviar a</Text>
              <View style={s.audienceGrid}>
                {AUDIENCIAS.map((item) => {
                  const activo = audiencia === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[s.audienceCard, activo && s.audienceCardActive]}
                      onPress={() => seleccionarAudiencia(item.key)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={item.icono} size={20} color={activo ? '#0D1B3E' : '#00AEEF'} />
                      <Text style={[s.audienceTitle, activo && s.audienceTitleActive]}>{item.titulo}</Text>
                      <Text style={s.audienceSub}>{item.subtitulo}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {audiencia === 'individual' && (
                <View style={s.recipientSection}>
                  <View style={s.recipientHeader}>
                    <View>
                      <Text style={s.sectionTitle}>Seleccionar estudiante</Text>
                    </View>
                    <TouchableOpacity style={s.refreshBtn} onPress={cargarAsistentes} disabled={cargandoAsistentes}>
                      <Ionicons name="refresh-outline" size={18} color="#0D1B3E" />
                    </TouchableOpacity>
                  </View>
                  {cargandoAsistentes && <ActivityIndicator color="#00AEEF" />}
                  {!cargandoAsistentes && asistentes.length === 0 && (
                    <Text style={s.noRecipients}>No se encuentran estudiantes hoy.</Text>
                  )}
                  {!cargandoAsistentes && asistentes.map((item) => {
                    const activo = estudianteSeleccionado === item._id;
                    const nombrePadre = `${item.padre?.nombre || ''} ${item.padre?.apellido || ''}`.trim();
                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={[s.recipientRow, activo && s.recipientRowActive]}
                        onPress={() => setEstudianteSeleccionado(item._id)}
                        activeOpacity={0.8}
                      >
                        <View style={s.recipientIcon}>
                          <Ionicons name="person-outline" size={18} color="#00AEEF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.recipientName}>{item.nombre}</Text>
                          <Text style={s.recipientParent}>Padre: {nombrePadre || 'Sin nombre'}</Text>
                        </View>
                        <Ionicons
                          name={activo ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={activo ? '#FFD700' : '#AAB4C3'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={[s.sectionTitle, { marginTop: 22 }]}>Mensajes rápidos</Text>
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
                    {activo && <Ionicons name="checkmark-circle" size={18} color="#FFD700" />}
                  </TouchableOpacity>
                );
              })}

              <Text style={[s.sectionTitle, { marginTop: 24 }]}>Mensaje personalizado</Text>
              <Text style={s.sectionSub}>Edita el mensaje rápido o redacta uno nuevo</Text>

              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="Ej: El bus saldrá 5 minutos tarde hoy..."
                  placeholderTextColor="#9AA4B2"
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

              <TouchableOpacity
                style={[
                  s.btnEnviar,
                  (
                    !mensaje.trim()
                    || enviando
                    || cargandoAsistentes
                    || (audiencia === 'asistentes' && asistentes.length === 0)
                    || (audiencia === 'individual' && !estudianteSeleccionado)
                  ) && s.btnEnviarDisabled,
                ]}
                onPress={handleEnviar}
                disabled={
                  !mensaje.trim()
                  || enviando
                  || cargandoAsistentes
                  || (audiencia === 'asistentes' && asistentes.length === 0)
                  || (audiencia === 'individual' && !estudianteSeleccionado)
                }
                activeOpacity={0.85}
              >
                {enviando ? (
                  <ActivityIndicator color="#0D1B3E" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#0D1B3E" style={{ marginRight: 8 }} />
                    <Text style={s.btnEnviarText}>
                      {audiencia === 'individual' ? 'Enviar emergencia' : 'Enviar aviso'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {tab === 'historial' && (
          <ScrollView
            contentContainerStyle={s.body}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
          >
            <Text style={s.sectionTitle}>Avisos enviados</Text>
            <Text style={s.sectionSub}>Registro guardado en la base de datos</Text>

            {cargando && (
              <View style={s.loadingBox}>
                <ActivityIndicator color="#00AEEF" />
                <Text style={s.loadingText}>Cargando historial...</Text>
              </View>
            )}

            {!cargando && historial.length === 0 && (
              <View style={s.emptyBox}>
                <Ionicons name="notifications-off-outline" size={40} color="#C8D6E5" />
                <Text style={s.emptyText}>Aún no has enviado ningún aviso</Text>
              </View>
            )}

            {!cargando && historial.map((h) => (
              <View key={h._id} style={s.histCard}>
                <View style={[s.histLeft, h.audiencia !== 'todos' && s.histLeftEmergency]}>
                  <Ionicons
                    name={h.audiencia !== 'todos' ? 'alert-circle-outline' : 'send-outline'}
                    size={18}
                    color={h.audiencia !== 'todos' ? '#DC2626' : '#00AEEF'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.histTitleRow}>
                    <Text style={s.histTipo}>
                      {h.audiencia === 'individual' ? 'Emergencia individual' : h.audiencia === 'asistentes' ? 'Aviso a asistentes' : 'Aviso general'}
                    </Text>
                    <Text style={s.histPadres}>{h.enviados || h.destinatarios?.length || 0} padres</Text>
                  </View>
                  <Text style={s.histTexto}>{h.mensaje}</Text>
                  <View style={s.histMeta}>
                    <Ionicons name="time-outline" size={12} color="#9AA4B2" />
                    <Text style={s.histFecha}>{formatearFecha(h.fecha)}</Text>
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
  headerSpacer: { width: 40, height: 40 },
  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
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
  tabLabel: { fontSize: 13, color: '#8A94A6', fontWeight: '600' },
  tabLabelActive: { color: '#0D1B3E', fontWeight: '700' },
  body: { paddingHorizontal: '6%', paddingTop: 20, paddingBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: '#8A94A6', marginTop: 2, marginBottom: 14 },
  audienceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  audienceCard: {
    width: '48%',
    minHeight: 104,
    backgroundColor: '#F5F8FC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    padding: 12,
    justifyContent: 'center',
  },
  audienceCardActive: { backgroundColor: '#FFFBEA', borderColor: '#FFD700' },
  audienceTitle: { fontSize: 13, fontWeight: '700', color: '#0D1B3E', marginTop: 8 },
  audienceTitleActive: { color: '#0D1B3E' },
  audienceSub: { fontSize: 11, color: '#8A94A6', lineHeight: 15, marginTop: 3 },
  recipientSection: { marginTop: 20 },
  recipientHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  refreshBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  noRecipients: { color: '#8A94A6', fontSize: 13, paddingVertical: 12 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, padding: 12, marginBottom: 8 },
  recipientRowActive: { borderColor: '#FFD700', backgroundColor: '#FFFBEA' },
  recipientIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF8FF', alignItems: 'center', justifyContent: 'center' },
  recipientName: { color: '#0D1B3E', fontSize: 13, fontWeight: '700' },
  recipientParent: { color: '#8A94A6', fontSize: 11, marginTop: 2 },
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
  predTexto: { flex: 1, fontSize: 13, color: '#3F4A5A', lineHeight: 18 },
  predTextoActive: { color: '#0D1B3E', fontWeight: '600' },
  inputBox: {
    backgroundColor: '#F5F8FC',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E3ECF7',
    padding: 14, minHeight: 120,
  },
  input: { fontSize: 14, color: '#0D1B3E', lineHeight: 20, flex: 1, minHeight: 88 },
  charCount: { fontSize: 11, color: '#9AA4B2', textAlign: 'right', marginTop: 6 },
  btnEnviar: {
    minHeight: 52,
    backgroundColor: '#FFD700', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  btnEnviarDisabled: { opacity: 0.45 },
  btnEnviarText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  loadingBox: { alignItems: 'center', paddingTop: 48, gap: 10 },
  loadingText: { color: '#8A94A6', fontSize: 13 },
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
  histLeftEmergency: { backgroundColor: '#FEECEC' },
  histTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
  histTipo: { fontSize: 11, color: '#00AEEF', fontWeight: '700', textTransform: 'uppercase' },
  histTexto: { fontSize: 13, color: '#0D1B3E', fontWeight: '600', lineHeight: 18, marginBottom: 8 },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histFecha: { fontSize: 11, color: '#8A94A6' },
  histPadres: { fontSize: 11, color: '#0D1B3E', fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 14, color: '#8A94A6' },
});
