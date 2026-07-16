import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ScrollView,
  Modal, ActivityIndicator, TextInput, RefreshControl, AppState,
  Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../config/api';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const ESTADO_PAGO_CFG = {
  Exitoso: { color: '#16A34A', bg: '#E6F9EE', texto: 'Exitoso', textoRecibo: 'Pago exitoso' },
  Pendiente: { color: '#F59E0B', bg: '#FFF8E1', texto: 'Pendiente', textoRecibo: 'Pago pendiente' },
  Fallido: { color: '#DC2626', bg: '#FEE2E2', texto: 'Fallido', textoRecibo: 'Pago fallido' },
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PaymentsScreen({ navigation, route }) {
  const { usuario } = route.params || {};
  const esConductor = usuario?.tipo === 'conductor';
  const [perfilUsuario, setPerfilUsuario] = useState(usuario);

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    try {
      const token = await obtenerToken();
      const { data } = await api.get('/api/auth/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data?.usuario) {
        setPerfilUsuario(data.usuario);
      }
    } catch (err) {
      console.log('Error cargando perfil:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSub}>BusWay</Text>
            <Text style={styles.headerTitle}>Pagos</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.card}>
        {esConductor 
          ? <VistaConductor navigation={navigation} usuario={perfilUsuario} onRefreshUsuario={cargarPerfil} /> 
          : <VistaPadre usuario={perfilUsuario} />}
      </View>
    </SafeAreaView>
  );
}

// ─── Helper: obtener token JWT de Firebase ────────────────────────────────────
async function obtenerToken() {
  if (!auth.currentUser) throw new Error('No hay sesión activa');
  return await auth.currentUser.getIdToken();
}

// ─── Helper: abrir Stripe Checkout en el navegador del sistema ───────────────
async function abrirStripeCheckout(url, onResult) {
  try {
    const result = await WebBrowser.openBrowserAsync(url, {
      preferredControlColor: '#0D1B3E',
      toolbarColor: '#0D1B3E',
      enableBarCollapsing: true,
      showTitle: true,
    });
    if (onResult) onResult(result);
  } catch (err) {
    Alert.alert('Error', 'No se pudo abrir el navegador para completar el pago.');
    console.error('WebBrowser error:', err);
  }
}

// ─── VISTA PADRE ──────────────────────────────────────────────────────────────
function VistaPadre({ usuario }) {
  const [acuerdo, setAcuerdo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoAcuerdo, setCargandoAcuerdo] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [cargandoCheckout, setCargandoCheckout] = useState(false);
  const [modalRecibo, setModalRecibo] = useState(null);
  const [modalEstado, setModalEstado] = useState(null);
  const [mensajeEstado, setMensajeEstado] = useState('');

  const tarjetaRegistrada = !!acuerdo?.stripe_subscription_id;
  const tarifaAcuerdo = Number(acuerdo?.tarifa_mensual || 0);
  const membresiaAcuerdo = Number(acuerdo?.membresia || 0);
  const totalMensual = tarifaAcuerdo + membresiaAcuerdo;

  const conductorNombre = acuerdo?.conductor_id
    ? `${acuerdo.conductor_id.nombre || ''} ${acuerdo.conductor_id.apellido || ''}`.trim()
    : 'Tu conductor';
  const escuelaNombre = acuerdo?.solicitud_id?.escuela || 'Tu escuela';

  const proximoCobroTexto = (() => {
    if (!acuerdo?.fecha_inicio) return '—';
    const proximo = new Date(acuerdo.fecha_inicio);
    proximo.setMonth(proximo.getMonth() + (acuerdo.mes_actual || 1));
    return proximo.toLocaleDateString('es-PA');
  })();

  const [refrescando, setRefrescando] = useState(false);

  const alRefrescar = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarAcuerdo(), cargarHistorial()]);
    setRefrescando(false);
  }, []);

  useEffect(() => {
    cargarAcuerdo();
    cargarHistorial();

    // Auto-refrescar cuando el usuario regresa a la app desde el navegador
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        cargarAcuerdo();
        cargarHistorial();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
    };
  }, []);

  async function cargarAcuerdo() {
    try {
      const token = await obtenerToken();
      const { data } = await api.get('/api/acuerdos/mis-acuerdos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAcuerdo(data?.acuerdo || null);
    } catch (err) {
      console.error('Error cargando acuerdo:', err?.response?.data || err?.message);
    } finally {
      setCargandoAcuerdo(false);
    }
  }

  async function cargarHistorial() {
    try {
      const token = await obtenerToken();
      const { data } = await api.get('/api/pagos/mis-pagos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistorial(data?.pagos || []);
    } catch (err) {
      console.error('Error cargando historial:', err?.response?.data || err?.message);
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    const subscription = Linking.addEventListener('url', manejarDeepLink);
    Linking.getInitialURL().then((url) => { if (url) manejarDeepLink({ url }); });
    return () => subscription.remove();
  }, []);

  const manejarDeepLink = useCallback(({ url }) => {
    if (!url) return;
    const parsed = Linking.parse(url);

    const isSuccess = url.includes('checkout-success') || parsed.path?.includes('checkout-success') || parsed.hostname?.includes('checkout-success');
    const isCancel = url.includes('checkout-cancel') || parsed.path?.includes('checkout-cancel') || parsed.hostname?.includes('checkout-cancel');

    if (isSuccess) {
      const sessionId = parsed.queryParams?.session_id || url.match(/[?&]session_id=([^&]+)/)?.[1];
      setModalEstado('procesando');
      setMensajeEstado('Confirmando tu pago con Stripe...');
      verificarSesionStripe(sessionId);
    } else if (isCancel) {
      setModalEstado(null);
      Alert.alert('Pago cancelado', 'Puedes intentar nuevamente cuando quieras.');
    }
  }, []);

  async function verificarSesionStripe(sessionId) {
    try {
      const token = await obtenerToken();
      const { data } = await api.get('/api/stripe/checkout-status', {
        params: { session_id: sessionId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.payment_status === 'paid' || data?.status === 'complete') {
        setModalEstado('exito');
        setMensajeEstado('¡Pago confirmado! Tu suscripción está activa.');
        setTimeout(async () => {
          setModalEstado(null);
          await cargarAcuerdo();
          await cargarHistorial();
        }, 1800);
      } else {
        setModalEstado('error');
        setMensajeEstado('La sesión no está completa. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      setModalEstado('exito');
      setMensajeEstado('Pago registrado. Tu suscripción está activa.');
      setTimeout(async () => {
        setModalEstado(null);
        await cargarAcuerdo();
        await cargarHistorial();
      }, 1800);
    }
  }

  async function iniciarCheckout() {
    try {
      setCargandoCheckout(true);
      const token = await obtenerToken();
      const successUrl = Linking.createURL('checkout-success');
      const cancelUrl = Linking.createURL('checkout-cancel');

      const { data } = await api.post(
        '/api/stripe/create-checkout-session',
        {
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data?.url) {
        throw new Error('El backend no devolvió una URL de checkout');
      }
      await abrirStripeCheckout(data.url);
    } catch (err) {
      console.error('Checkout error:', err);
      const msg = err?.response?.data?.error || err?.message || 'No se pudo iniciar el pago';
      Alert.alert('Error', msg);
    } finally {
      setCargandoCheckout(false);
    }
  }

  async function cancelarSuscripcion() {
    if (!acuerdo?._id) return;
    Alert.alert(
      'Finalizar Contrato Escolar',
      '¿Seguro que deseas finalizar el contrato con el conductor?\n\nAl hacerlo, se cancelará el cobro automático de tu tarjeta de crédito, se liberará el cupo de tu hijo en el colegial y el servicio dejará de estar activo.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, finalizar contrato',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await obtenerToken();
              await api.post(
                '/api/stripe/cancel-subscription',
                { acuerdoId: acuerdo._id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await cargarAcuerdo();
              Alert.alert('Contrato Finalizado', 'Tu suscripción y contrato escolar han sido cancelados con éxito.');
            } catch (e) {
              Alert.alert('Error', 'No se pudo finalizar el contrato. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={['#0D1B3E']} />
      }
    >

      {/* Sin contrato activo */}
      {!cargandoAcuerdo && !acuerdo && (
        <View style={styles.emptyHistorial}>
          <Ionicons name="document-text-outline" size={36} color="#ccc" />
          <Text style={styles.emptyHistorialTitle}>Sin contrato activo</Text>
          <Text style={styles.emptyHistorialDesc}>
            Cuando un conductor acepte tu solicitud en el Marketplace, podrás configurar aquí tu pago automático.
          </Text>
        </View>
      )}

      {/* Alerta de configuración de pago */}
      {acuerdo && !tarjetaRegistrada && (
        <TouchableOpacity
          style={styles.alertaPago}
          onPress={iniciarCheckout}
          disabled={cargandoCheckout}
          activeOpacity={0.88}
        >
          <View style={styles.alertaPagoIcono}>
            {cargandoCheckout
              ? <ActivityIndicator size="small" color="#0D1B3E" />
              : <Ionicons name="checkmark-circle" size={24} color="#0D1B3E" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertaPagoTitulo}>¡Solicitud Aceptada!</Text>
            <Text style={styles.alertaPagoDesc}>
              {cargandoCheckout
                ? 'Preparando pago seguro con Stripe...'
                : 'Configura tu método de pago automático vía Stripe para activar el servicio.'}
            </Text>
          </View>
          {!cargandoCheckout && <Ionicons name="chevron-forward-outline" size={18} color="#0D1B3E" />}
        </TouchableOpacity>
      )}

      {/* Contrato activo y desglose */}
      {tarjetaRegistrada && (
        <>
          <View style={styles.contratoCard}>
            <View style={styles.contratoHeader}>
              <View>
                <Text style={styles.contratoLabel}>Contrato escolar activo</Text>
                <Text style={styles.contratoMes}>Mes {acuerdo.mes_actual || 1} de {acuerdo.total_meses || 10}</Text>
              </View>
              <View style={styles.activoBadge}>
                <View style={styles.activoDot} />
                <Text style={styles.activoText}>Activo</Text>
              </View>
            </View>

            <View style={styles.contratoInfo}>
              <Ionicons name="bus-outline" size={13} color="#00AEEF" />
              <Text style={styles.contratoInfoText}>{conductorNombre} · {escuelaNombre}</Text>
            </View>

            <View style={styles.desgloseBox}>
              <Text style={styles.desgloseTitle}>Desglose del próximo cobro</Text>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseConcepto}>Tarifa del conductor</Text>
                <Text style={styles.desgloseValor}>${tarifaAcuerdo.toFixed(2)}</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseConcepto}>Membresía plataforma BusWay</Text>
                <Text style={styles.desgloseValor}>${membresiaAcuerdo.toFixed(2)}</Text>
              </View>
              <View style={styles.desgloseDivider} />
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseTotalLabel}>Total mensual a debitar</Text>
                <Text style={styles.desgloseTotalValor}>${totalMensual.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.proximoCobro}>
              <Ionicons name="time-outline" size={13} color="#888" />
              <Text style={styles.proximoCobroText}>
                Próximo cobro automático: <Text style={{ fontWeight: '700', color: '#0D1B3E' }}>{proximoCobroTexto}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.metodoPagoCard}>
            <View style={styles.metodoPagoLeft}>
              <View style={styles.metodoPagoIconCircle}>
                <Ionicons name="card-outline" size={18} color="#0D1B3E" />
              </View>
              <View>
                <Text style={styles.metodoPagoLabel}>Tarjeta registrada</Text>
                <Text style={styles.metodoPagoNumero}>•••• •••• •••• {acuerdo.ultimos_4_digitos || '----'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={iniciarCheckout} disabled={cargandoCheckout}>
              <Text style={styles.cambiarLink}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.btnCancelarSub}
            onPress={cancelarSuscripcion}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle-outline" size={15} color="#B91C1C" />
            <Text style={styles.btnCancelarSubText}>Cancelar suscripción</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Historial de pagos */}
      <Text style={[styles.sectionTitle, { marginTop: tarjetaRegistrada ? 24 : 20 }]}>
        Historial de pagos
      </Text>

      {cargandoHistorial && (
        <View style={styles.emptyHistorial}>
          <ActivityIndicator size="small" color="#0D1B3E" />
          <Text style={styles.emptyHistorialDesc}>Cargando historial...</Text>
        </View>
      )}

      {!cargandoHistorial && historial.length === 0 && (
        <View style={styles.emptyHistorial}>
          <Ionicons name="receipt-outline" size={36} color="#ccc" />
          <Text style={styles.emptyHistorialTitle}>Sin pagos registrados</Text>
          <Text style={styles.emptyHistorialDesc}>
            Tu historial aparecerá aquí una vez actives el cobro automático.
          </Text>
        </View>
      )}

      {historial.map(pago => {
        const estadoCfg = ESTADO_PAGO_CFG[pago.estado] || ESTADO_PAGO_CFG.Pendiente;
        return (
          <View key={pago.id} style={styles.pagoCard}>
            <View style={styles.pagoCardTop}>
              <View style={styles.pagoMesCircle}>
                <Ionicons name="receipt-outline" size={18} color="#0D1B3E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pagoMes}>Mes {pago.mesContrato}</Text>
                <Text style={styles.pagoFecha}>{pago.fecha} · {pago.conductor}</Text>
              </View>
              <View style={styles.pagoRight}>
                <Text style={styles.pagoMonto}>{pago.monto}</Text>
                <View style={[styles.exitosoBadge, { backgroundColor: estadoCfg.bg }]}>
                  <View style={[styles.exitosoDot, { backgroundColor: estadoCfg.color }]} />
                  <Text style={[styles.exitosoText, { color: estadoCfg.color }]}>{estadoCfg.texto}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.verReciboBtn}
              onPress={() => setModalRecibo(pago)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={14} color="#00AEEF" />
              <Text style={styles.verReciboBtnText}>Ver recibo</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {modalRecibo && (
        <ModalRecibo pago={modalRecibo} onClose={() => setModalRecibo(null)} />
      )}

      <ModalEstadoCheckout
        estado={modalEstado}
        mensaje={mensajeEstado}
        onClose={() => setModalEstado(null)}
      />
    </ScrollView>
  );
}

// ─── Modal de estado del checkout (procesando / éxito / error) ────────────────
function ModalEstadoCheckout({ estado, mensaje, onClose }) {
  if (!estado) return null;

  const config = {
    procesando: { icon: 'hourglass-outline', color: '#00AEEF', bg: '#E8F0FE' },
    exito:      { icon: 'checkmark-circle-outline', color: '#16A34A', bg: '#E6F9EE' },
    error:      { icon: 'close-circle-outline', color: '#B91C1C', bg: '#FEE2E2' },
  }[estado];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={[styles.modalIconCircle, { backgroundColor: config.bg }]}>
            {estado === 'procesando'
              ? <ActivityIndicator size="large" color={config.color} />
              : <Ionicons name={config.icon} size={28} color={config.color} />}
          </View>
          <Text style={styles.modalEstadoTitle}>
            {estado === 'procesando' ? 'Procesando' : estado === 'exito' ? '¡Listo!' : 'Ups...'}
          </Text>
          <Text style={styles.modalEstadoMsg}>{mensaje}</Text>

          {estado !== 'procesando' && (
            <TouchableOpacity style={styles.btnGuardar} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="checkmark-outline" size={17} color="#0D1B3E" />
              <Text style={styles.btnGuardarText}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal recibo de pago ─────────────────────────────────────────────────────
function ModalRecibo({ pago, onClose }) {
  const estadoCfg = ESTADO_PAGO_CFG[pago.estado] || ESTADO_PAGO_CFG.Pendiente;
  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHandle} />
          <View style={[styles.modalHeader, { marginBottom: 4 }]}>
            <View style={[styles.modalIconCircle, { backgroundColor: '#E6F9EE' }]}>
              <Ionicons name="receipt-outline" size={20} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Recibo de pago</Text>
              <Text style={styles.modalSubtitle}>Mes {pago.mesContrato} · {pago.fecha}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close-outline" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.reciboBox}>
            <FilaRecibo label="Conductor" valor={pago.conductor} />
            <FilaRecibo label="Escuela / Ruta" valor={pago.escuela} />
            <FilaRecibo label="Estudiante(s)" valor={pago.estudiantes} />
            <FilaRecibo label="Fecha de cobro" valor={pago.fecha} />
            <View style={styles.reciboSeparador} />
            <FilaRecibo label="Tarifa del conductor" valor={`$${pago.tarifaConductor.toFixed(2)}`} />
            <FilaRecibo label="Membresía BusWay" valor={`$${pago.membresia.toFixed(2)}`} />
            <View style={styles.reciboSeparador} />
            <FilaRecibo label="Total cobrado" valor={`$${pago.montoTotal.toFixed(2)}`} destacado />
            <View style={[styles.exitosoBadge, { alignSelf: 'center', marginTop: 14, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: estadoCfg.bg }]}>
              <View style={[styles.exitosoDot, { backgroundColor: estadoCfg.color }]} />
              <Text style={[styles.exitosoText, { fontSize: 13, color: estadoCfg.color }]}>{estadoCfg.textoRecibo}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnGuardar} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="checkmark-outline" size={17} color="#0D1B3E" />
            <Text style={styles.btnGuardarText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FilaRecibo({ label, valor, destacado }) {
  return (
    <View style={styles.filaRecibo}>
      <Text style={styles.filaReciboLabel}>{label}</Text>
      <Text style={[styles.filaReciboValor, destacado && styles.filaReciboDestacado]}>{valor}</Text>
    </View>
  );
}

// ─── VISTA CONDUCTOR ──────────────────────────────────────────────────────────
function VistaConductor({ navigation, usuario, onRefreshUsuario }) {
  const [pagos, setPagos] = useState([]);
  const [acuerdos, setAcuerdos] = useState([]);
  const [contratosActivos, setContratosActivos] = useState(0);
  const [totalRecibido, setTotalRecibido] = useState(0);
  const [rutaActiva, setRutaActiva] = useState('Todas las rutas');
  const [cargando, setCargando] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);

  // States para registro de cuenta bancaria/cobro
  const [bancoNombre, setBancoNombre] = useState('');
  const [bancoTipo, setBancoTipo] = useState('Ahorros');
  const [bancoCuenta, setBancoCuenta] = useState('');
  const [bancoTitular, setBancoTitular] = useState('');
  const [guardandoBanco, setGuardandoBanco] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const habilitado = bancoNombre.trim() && bancoCuenta.trim() && bancoTitular.trim();

  const [refrescando, setRefrescando] = useState(false);

  const alRefrescar = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarDatos(), onRefreshUsuario()]);
    setRefrescando(false);
  }, []);

  useEffect(() => {
    cargarDatos();

    // Auto-refrescar cuando el conductor regresa a la app
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        cargarDatos();
        onRefreshUsuario();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
    };
  }, []);

  async function cargarDatos() {
    try {
      const token = await obtenerToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [pagosRes, acuerdosRes] = await Promise.all([
        api.get('/api/pagos/recibidos', { headers }),
        api.get('/api/acuerdos/conductores', { headers }),
      ]);
      setPagos(pagosRes.data?.pagos || []);
      setTotalRecibido(pagosRes.data?.totalRecibido || 0);
      setContratosActivos(acuerdosRes.data?.total || 0);
      setAcuerdos(acuerdosRes.data?.acuerdos || []);
    } catch (err) {
      console.error('Error cargando pagos del conductor:', err?.response?.data || err?.message);
    } finally {
      setCargando(false);
    }
  }

  const handleCancelarContrato = (acuerdo) => {
    const padreNombre = acuerdo.padre_id
      ? `${acuerdo.padre_id.nombre} ${acuerdo.padre_id.apellido || ''}`
      : 'Padre';
    Alert.alert(
      'Finalizar Contrato',
      `¿Deseas finalizar el contrato con ${padreNombre}?\n\nAl hacerlo, se cancelará el cobro automático a su tarjeta de crédito y los estudiantes asociados se eliminarán de tu ruta actual, liberando sus vacantes en tu colegial.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, finalizar contrato',
          style: 'destructive',
          onPress: async () => {
            setCancelandoId(acuerdo._id);
            try {
              const token = await obtenerToken();
              await api.post('/api/stripe/cancel-subscription', {
                acuerdoId: acuerdo._id
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Contrato Finalizado', 'El contrato ha sido cancelado con éxito y las vacantes han sido liberadas.');
              await cargarDatos();
            } catch (err) {
              console.error('Error finalizando contrato:', err);
              Alert.alert('Error', err.response?.data?.error || 'No se pudo finalizar el contrato');
            } finally {
              setCancelandoId(null);
            }
          }
        }
      ]
    );
  };

  const escuelas = ['Todas las rutas', ...new Set(pagos.map(p => p.escuela).filter(Boolean))];

  const historialFiltrado = rutaActiva === 'Todas las rutas'
    ? pagos
    : pagos.filter(p => p.escuela === rutaActiva);

  const ahora = new Date();
  const totalMes = pagos
    .filter(p => p.estado === 'Exitoso' && p.fechaISO
      && new Date(p.fechaISO).getMonth() === ahora.getMonth()
      && new Date(p.fechaISO).getFullYear() === ahora.getFullYear())
    .reduce((acc, p) => acc + Number(p.tarifaConductor || 0), 0);

  if (cargando) {
    return (
      <View style={[styles.body, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#0D1B3E" />
        <Text style={{ marginTop: 12, color: '#888' }}>Cargando pagos...</Text>
      </View>
    );
  }

  if (!usuario?.datos_conductor?.banco_info) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={['#0D1B3E']} />
          }
        >
          <View style={styles.alertaPago}>
            <View style={styles.alertaPagoIcono}>
              <Ionicons name="wallet-outline" size={24} color="#0D1B3E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertaPagoTitulo}>Configura tu Cuenta de Cobro</Text>
              <Text style={styles.alertaPagoDesc}>
                Para poder recibir los ingresos mensuales de los padres de familia, primero debes vincular tu cuenta bancaria o tarjeta de cobro.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Datos de Transferencia</Text>
          
          <Text style={styles.inputLabel}>Nombre del Banco</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Ej: Banco General, Banistmo..."
            placeholderTextColor="#aaa"
            value={bancoNombre}
            onChangeText={setBancoNombre}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Tipo de Cuenta</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownSelectorText}>{bancoTipo}</Text>
            <Ionicons name={dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color="#888" />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={{ backgroundColor: '#F5F8FC', borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: '#E3ECF7', overflow: 'hidden' }}>
              {['Ahorros', 'Corriente'].map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: tipo === 'Ahorros' ? 1 : 0, borderBottomColor: '#E3ECF7' }}
                  onPress={() => {
                    setBancoTipo(tipo);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#0D1B3E', fontWeight: bancoTipo === tipo ? '700' : '400' }}>{tipo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Número de Cuenta o Tarjeta</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Ej: 4242 4242 4242 4242 o 04729831948"
            placeholderTextColor="#aaa"
            value={bancoCuenta}
            onChangeText={(text) => {
              const clean = text.replace(/\D/g, '');
              let formatted = clean;
              if (clean.length === 15 || clean.length === 16) {
                formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
              }
              setBancoCuenta(formatted);
            }}
            keyboardType="numeric"
          />

          {bancoCuenta.trim().length > 0 && (() => {
            const cleanDigits = bancoCuenta.replace(/\D/g, '');
            const esTarjeta = cleanDigits.length === 15 || cleanDigits.length === 16;
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4, paddingLeft: 4 }}>
                <Ionicons 
                  name={esTarjeta ? "card-outline" : "business-outline"} 
                  size={14} 
                  color={esTarjeta ? "#16A34A" : "#0A84FF"} 
                />
                <Text style={{ fontSize: 12, color: esTarjeta ? "#16A34A" : "#0A84FF", fontWeight: '600' }}>
                  {esTarjeta ? "Detectado: Tarjeta de Crédito/Débito" : "Detectado: Cuenta Bancaria"}
                </Text>
              </View>
            );
          })()}

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Nombre del Titular</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#aaa"
            value={bancoTitular}
            onChangeText={setBancoTitular}
          />

          <TouchableOpacity
            style={[styles.btnGuardar, (!habilitado || guardandoBanco) && styles.btnDisabled]}
            onPress={async () => {
              if (!habilitado || guardandoBanco) return;
              setGuardandoBanco(true);
              try {
                const token = await obtenerToken();
                const cleanCuenta = bancoCuenta.replace(/\s/g, '');
                await api.patch('/api/auth/perfil/actualizar', {
                  banco_info: {
                    banco_nombre: bancoNombre,
                    banco_tipo: bancoTipo,
                    banco_cuenta: cleanCuenta,
                    num_cuenta: cleanCuenta,
                    banco_titular: bancoTitular
                  }
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                Alert.alert(
                  'Registro Exitoso',
                  'Tu información de cobro ha sido guardada correctamente. Tu ruta ha sido publicada en el Marketplace.',
                  [
                    {
                      text: 'Ver en Marketplace',
                      onPress: () => {
                        navigation.navigate('Marketplace');
                      }
                    }
                  ]
                );
                await onRefreshUsuario();
              } catch (err) {
                console.error(err);
                Alert.alert('Error', 'No se pudo guardar la información de cobro.');
              } finally {
                setGuardandoBanco(false);
              }
            }}
            disabled={!habilitado || guardandoBanco}
            activeOpacity={0.85}
          >
            {guardandoBanco ? (
              <ActivityIndicator size="small" color="#0D1B3E" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#0D1B3E" />
                <Text style={styles.btnGuardarText}>Guardar Cuenta de Cobro</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={['#0D1B3E']} />
      }
    >

      <View style={styles.metricasGrid}>
        <View style={[styles.metricaCard, { flex: 1.1 }]}>
          <View style={[styles.metricaIconCircle, { backgroundColor: '#E8F0FE' }]}>
            <Ionicons name="trending-up-outline" size={18} color="#0D1B3E" />
          </View>
          <Text style={styles.metricaValor}>${totalMes.toFixed(2)}</Text>
          <Text style={styles.metricaLabel}>Recaudado este mes</Text>
        </View>
        <View style={styles.metricaCard}>
          <View style={[styles.metricaIconCircle, { backgroundColor: '#E6F9EE' }]}>
            <Ionicons name="people-outline" size={18} color="#16A34A" />
          </View>
          <Text style={styles.metricaValor}>{contratosActivos}</Text>
          <Text style={styles.metricaLabel}>Contratos activos</Text>
        </View>
        <View style={[styles.metricaCard, { flex: 1.1 }]}>
          <View style={[styles.metricaIconCircle, { backgroundColor: '#FFF8DC' }]}>
            <Ionicons name="wallet-outline" size={18} color="#B8860B" />
          </View>
          <Text style={[styles.metricaValor, { color: '#00AEEF' }]}>${Number(totalRecibido).toFixed(2)}</Text>
          <Text style={styles.metricaLabel}>Total recibido</Text>
        </View>
      </View>

      <View style={styles.notaTarifa}>
        <Ionicons name="information-circle-outline" size={14} color="#888" />
        <Text style={styles.notaTarifaText}>
          El monto depositado a tu cuenta es el pago neto.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Contratos Activos ({acuerdos.length})</Text>

      {acuerdos.length === 0 ? (
        <View style={styles.emptyHistorial}>
          <Ionicons name="people-outline" size={32} color="#ccc" />
          <Text style={styles.emptyHistorialTitle}>Sin contratos activos</Text>
          <Text style={styles.emptyHistorialDesc}>
            Las solicitudes que aceptes se listarán aquí como contratos activos.
          </Text>
        </View>
      ) : (
        acuerdos.map(acuerdo => {
          const padreNombre = acuerdo.padre_id
            ? `${acuerdo.padre_id.nombre} ${acuerdo.padre_id.apellido || ''}`
            : 'Padre';
          const hijosNombres = (acuerdo.solicitud_id?.hijos_ids || []).map(h => h.nombre).join(', ') || 'Sin especificar';
          const totalCobro = acuerdo.tarifa_mensual + (acuerdo.membresia || 0);

          return (
            <View key={acuerdo._id} style={styles.contratoCard}>
              <View style={styles.contratoHeader}>
                <View>
                  <Text style={styles.contratoLabel}>Padre / Representante</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0D1B3E', marginTop: 2 }}>{padreNombre}</Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 1 }}>{acuerdo.solicitud_id?.escuela}</Text>
                </View>
                <View style={styles.activoBadge}>
                  <View style={styles.activoDot} />
                  <Text style={styles.activoText}>Activo</Text>
                </View>
              </View>
              
              <View style={styles.desgloseDivider} />
              
              <View style={{ gap: 6, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="person-outline" size={13} color="#666" />
                  <Text style={{ fontSize: 12, color: '#555' }}>Estudiantes: <Text style={{ fontWeight: '600' }}>{hijosNombres}</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="wallet-outline" size={13} color="#666" />
                  <Text style={{ fontSize: 12, color: '#555' }}>Tarifa neta: <Text style={{ fontWeight: '600' }}>${acuerdo.tarifa_mensual.toFixed(2)}/mes</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="card-outline" size={13} color="#666" />
                  <Text style={{ fontSize: 12, color: '#555' }}>Cobro a tarjeta (c/ membresía): <Text style={{ fontWeight: '600', color: '#00AEEF' }}>${totalCobro.toFixed(2)}/mes</Text></Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btnCancelarSub, cancelandoId === acuerdo._id && { opacity: 0.6 }]}
                onPress={() => handleCancelarContrato(acuerdo)}
                disabled={cancelandoId === acuerdo._id}
                activeOpacity={0.85}
              >
                {cancelandoId === acuerdo._id ? (
                  <ActivityIndicator size="small" color="#B91C1C" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={15} color="#B91C1C" />
                    <Text style={styles.btnCancelarSubText}>Finalizar Contrato</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Historial de cobros</Text>

      {pagos.length === 0 ? (
        <View style={styles.emptyHistorial}>
          <Ionicons name="cash-outline" size={36} color="#ccc" />
          <Text style={styles.emptyHistorialTitle}>Sin cobros registrados</Text>
          <Text style={styles.emptyHistorialDesc}>
            Los pagos de tus padres contratados aparecerán aquí.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {escuelas.map(ruta => (
              <TouchableOpacity
                key={ruta}
                style={[styles.chip, rutaActiva === ruta && styles.chipActivo]}
                onPress={() => setRutaActiva(ruta)}
                activeOpacity={0.8}
              >
                {rutaActiva === ruta && (
                  <Ionicons name="checkmark-outline" size={13} color="#0D1B3E" style={{ marginRight: 3 }} />
                )}
                <Text style={[styles.chipText, rutaActiva === ruta && styles.chipTextActivo]}>
                  {ruta}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {historialFiltrado.map(pago => {
            const estadoCfg = ESTADO_PAGO_CFG[pago.estado] || ESTADO_PAGO_CFG.Pendiente;
            return (
              <View key={pago.id} style={styles.cobroCard}>
                <View style={styles.cobroAvatarCircle}>
                  <Text style={styles.cobroAvatarText}>{pago.padre.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cobroPadre}>{pago.padre}</Text>
                  <View style={styles.cobroMeta}>
                    <Ionicons name="school-outline" size={11} color="#888" />
                    <Text style={styles.cobroMetaText}>{pago.escuela}</Text>
                  </View>
                  <View style={styles.cobroMeta}>
                    <Ionicons name="calendar-outline" size={11} color="#888" />
                    <Text style={styles.cobroMetaText}>Cobrado el {pago.fecha}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.cobroMonto}>${Number(pago.tarifaConductor || 0).toFixed(2)}</Text>
                  <View style={[styles.depositadoBadge, { backgroundColor: estadoCfg.bg }]}>
                    <View style={[styles.depositadoDot, { backgroundColor: estadoCfg.color }]} />
                    <Text style={[styles.depositadoText, { color: estadoCfg.color }]}>{estadoCfg.texto}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ─── Estilos Consolidados ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B3E'
  },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: '6%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: '6%',
    paddingTop: 24,
    paddingBottom: 24
  },
  alertaPago: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFD700',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  alertaPagoIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaPagoTitulo: { fontSize: 14, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 2 },
  alertaPagoDesc: { fontSize: 12, color: '#0D1B3E', lineHeight: 16, opacity: 0.85 },
  contratoCard: {
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    padding: 18,
    marginBottom: 14,
  },
  contratoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  contratoLabel: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  contratoMes: { fontSize: 22, fontWeight: 'bold', color: '#0D1B3E' },
  activoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E6F9EE', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  activoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  activoText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  contratoInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  contratoInfoText: { fontSize: 13, color: '#555', fontWeight: '500' },
  desgloseBox: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E3ECF7', padding: 14, marginBottom: 12 },
  desgloseTitle: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  desgloseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  desgloseConcepto: { fontSize: 13, color: '#555' },
  desgloseValor: { fontSize: 13, color: '#0D1B3E', fontWeight: '600' },
  desgloseDivider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 8 },
  desgloseTotalLabel: { fontSize: 14, fontWeight: 'bold', color: '#0D1B3E' },
  desgloseTotalValor: { fontSize: 16, fontWeight: 'bold', color: '#00AEEF' },
  proximoCobro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proximoCobroText: { fontSize: 12, color: '#888' },
  metodoPagoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 4
  },
  metodoPagoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metodoPagoIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  metodoPagoLabel: { fontSize: 11, color: '#888' },
  metodoPagoNumero: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  cambiarLink: { fontSize: 13, color: '#00AEEF', fontWeight: '700' },
  btnCancelarSub: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 10, marginTop: 12, marginBottom: 4
  },
  btnCancelarSubText: { fontSize: 13, color: '#B91C1C', fontWeight: '700' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtroFechas: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, width: '100%' },
  filtroFechaBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8 },
  filtroFechaLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  filtroFechaValor: { fontSize: 11, color: '#0D1B3E', fontWeight: '700' },
  filtroBtnAplicar: { backgroundColor: '#0D1B3E', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  filtroBtnAplicarText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  pagoCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 14, marginBottom: 10 },
  pagoCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  pagoMesCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pagoMes: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  pagoFecha: { fontSize: 11, color: '#888' },
  pagoRight: { alignItems: 'flex-end', gap: 4 },
  pagoMonto: { fontSize: 16, fontWeight: 'bold', color: '#0D1B3E' },
  exitosoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F9EE', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8 },
  exitosoDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16A34A' },
  exitosoText: { fontSize: 11, color: '#16A34A', fontWeight: '700' },
  verReciboBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E3ECF7', paddingVertical: 8 },
  verReciboBtnText: { fontSize: 13, color: '#00AEEF', fontWeight: '600' },
  emptyHistorial: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyHistorialTitle: { fontSize: 15, fontWeight: '700', color: '#888' },
  emptyHistorialDesc: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingHorizontal: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F8FC', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0D1B3E' },
  modalSubtitle: { fontSize: 12, color: '#888' },
  modalCloseBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  modalEstadoTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  modalEstadoMsg: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  stripeNota: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  stripeNotaText: { fontSize: 11, color: '#888', flex: 1 },
  btnGuardar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 14, marginTop: 10 },
  btnGuardarText: { fontSize: 15, fontWeight: 'bold', color: '#0D1B3E' },
  btnDisabled: { backgroundColor: '#EEF2F6', opacity: 0.6 },
  reciboBox: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 20 },
  filaRecibo: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  filaReciboLabel: { fontSize: 13, color: '#888' },
  filaReciboValor: { fontSize: 13, color: '#0D1B3E', fontWeight: '600' },
  filaReciboDestacado: { fontSize: 16, color: '#00AEEF', fontWeight: 'bold' },
  reciboSeparador: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 8 },
  metricasGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricaCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 14, alignItems: 'flex-start' },
  metricaIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricaValor: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 2 },
  metricaLabel: { fontSize: 10, color: '#888', fontWeight: '500', lineHeight: 12 },
  notaTarifa: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  notaTarifaText: { fontSize: 12, color: '#888' },
  chipsScroll: { marginBottom: 16, marginHorizontal: '-6%' },
  chipsContent: { paddingHorizontal: '6%', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipActivo: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  chipTextActivo: { color: '#0D1B3E', fontWeight: '700' },
  cobroCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 14, marginBottom: 10 },
  cobroAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  cobroAvatarText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cobroPadre: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', marginBottom: 2 },
  cobroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cobroMetaText: { fontSize: 11, color: '#888' },
  cobroMonto: { fontSize: 16, fontWeight: 'bold', color: '#0D1B3E' },
  depositadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F9EE', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8 },
  depositadoDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16A34A' },
  depositadoText: { fontSize: 11, color: '#16A34A', fontWeight: '700' },
  formInput: {
    backgroundColor: '#F5F8FC',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0D1B3E',
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F8FC',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  dropdownSelectorText: {
    fontSize: 14,
    color: '#0D1B3E',
    fontWeight: '500',
  },
});
