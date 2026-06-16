import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ScrollView,
  Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Datos de demostración ────────────────────────────────────────────────────
const HISTORIAL_PADRE_DEMO = [
  { id: 'p1', mes: 'Mes 2 de 10', fecha: '01/05/2026', monto: 85.99, estado: 'exitoso', tarifa: 80.00, membresia: 5.99, conductor: 'Carlos Mendoza', escuela: 'Inst. Fermín Naudeau' },
  { id: 'p2', mes: 'Mes 1 de 10', fecha: '01/04/2026', monto: 85.99, estado: 'exitoso', tarifa: 80.00, membresia: 5.99, conductor: 'Carlos Mendoza', escuela: 'Inst. Fermín Naudeau' },
];

const RUTAS_CONDUCTOR = ['Todas las rutas', 'Inst. Fermín Naudeau', 'Colegio San Agustín'];
const HISTORIAL_CONDUCTOR_DEMO = [
  { id: 'c1', padre: 'Ana Torres',      escuela: 'Inst. Fermín Naudeau', fecha: '01/06/2026', monto: 74.01, estado: 'depositado' },
  { id: 'c2', padre: 'Luis Pereira',    escuela: 'Inst. Fermín Naudeau', fecha: '01/06/2026', monto: 74.01, estado: 'depositado' },
  { id: 'c3', padre: 'Marta Rodríguez', escuela: 'Colegio San Agustín',   fecha: '01/06/2026', monto: 74.01, estado: 'depositado' },
  { id: 'c4', padre: 'Jorge Díaz',      escuela: 'Colegio San Agustín',   fecha: '31/05/2026', monto: 74.01, estado: 'depositado' },
  { id: 'c5', padre: 'Carmen Soto',     escuela: 'Inst. Fermín Naudeau', fecha: '31/05/2026', monto: 74.01, estado: 'depositado' },
];

// ─── Utilidades ───────────────────────────────────────────────────────────────
const formatCard = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};
const formatExp = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PaymentsScreen({ navigation, route }) {
  const { usuario } = route.params || {};
  
  // Determinar el rol de forma estricta según los datos del usuario logueado
  const esConductor = usuario?.tipo === 'conductor';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Header Limpio con botón de regreso */}
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

      {/* Contenido Dinámico según el Tipo de Usuario */}
      <View style={styles.card}>
        {esConductor ? <VistaConductor /> : <VistaPadre />}
      </View>
    </SafeAreaView>
  );
}

// ─── VISTA PADRE ──────────────────────────────────────────────────────────────
function VistaPadre() {
  const [tarjetaRegistrada, setTarjetaRegistrada] = useState(false);
  const [modalTarjeta, setModalTarjeta] = useState(false);
  const [modalRecibo, setModalRecibo] = useState(null);

  const [filtroDesde] = useState('Abr 2026');
  const [filtroHasta] = useState('Jun 2026');

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {/* Alerta de configuración de pago */}
      {!tarjetaRegistrada && (
        <TouchableOpacity
          style={styles.alertaPago}
          onPress={() => setModalTarjeta(true)}
          activeOpacity={0.88}
        >
          <View style={styles.alertaPagoIcono}>
            <Ionicons name="checkmark-circle" size={24} color="#0D1B3E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertaPagoTitulo}>¡Solicitud Aceptada!</Text>
            <Text style={styles.alertaPagoDesc}>
              Configura tu método de pago automático vía Stripe para activar el servicio.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color="#0D1B3E" />
        </TouchableOpacity>
      )}

      {/* Contrato activo y desglose */}
      {tarjetaRegistrada && (
        <>
          <View style={styles.contratoCard}>
            <View style={styles.contratoHeader}>
              <View>
                <Text style={styles.contratoLabel}>Contrato escolar activo</Text>
                <Text style={styles.contratoMes}>Mes 3 de 10</Text>
              </View>
              <View style={styles.activoBadge}>
                <View style={styles.activoDot} />
                <Text style={styles.activoText}>Activo</Text>
              </View>
            </View>

            <View style={styles.contratoInfo}>
              <Ionicons name="bus-outline" size={13} color="#00AEEF" />
              <Text style={styles.contratoInfoText}>Carlos Mendoza · Inst. Fermín Naudeau</Text>
            </View>

            <View style={styles.desgloseBox}>
              <Text style={styles.desgloseTitle}>Desglose del próximo cobro</Text>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseConcepto}>Tarifa del conductor</Text>
                <Text style={styles.desgloseValor}>$80.00</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseConcepto}>Membresía plataforma BusWay</Text>
                <Text style={styles.desgloseValor}>$5.99</Text>
              </View>
              <View style={styles.desgloseDivider} />
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseTotalLabel}>Total mensual a debitar</Text>
                <Text style={styles.desgloseTotalValor}>$85.99</Text>
              </View>
            </View>

            <View style={styles.proximoCobro}>
              <Ionicons name="time-outline" size={13} color="#888" />
              <Text style={styles.proximoCobroText}>
                Próximo cobro automático: <Text style={{ fontWeight: '700', color: '#0D1B3E' }}>01/07/2026</Text>
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
                <Text style={styles.metodoPagoNumero}>•••• •••• •••• 4242</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setModalTarjeta(true)}>
              <Text style={styles.cambiarLink}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Historial de pagos */}
      <Text style={[styles.sectionTitle, { marginTop: tarjetaRegistrada ? 24 : 20 }]}>
        Historial de pagos
      </Text>

      {/* Filtro de fechas */}
      <View style={styles.filtroFechas}>
        <View style={styles.filtroFechaBox}>
          <Ionicons name="calendar-outline" size={12} color="#888" />
          <Text style={styles.filtroFechaLabel}>Desde</Text>
          <Text style={styles.filtroFechaValor}>{filtroDesde}</Text>
        </View>

        <Ionicons name="arrow-forward-outline" size={12} color="#aaa" />

        <View style={styles.filtroFechaBox}>
          <Ionicons name="calendar-outline" size={12} color="#888" />
          <Text style={styles.filtroFechaLabel}>Hasta</Text>
          <Text style={styles.filtroFechaValor}>{filtroHasta}</Text>
        </View>

        <TouchableOpacity style={styles.filtroBtnAplicar} activeOpacity={0.85}>
          <Text style={styles.filtroBtnAplicarText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {!tarjetaRegistrada && (
        <View style={styles.emptyHistorial}>
          <Ionicons name="receipt-outline" size={36} color="#ccc" />
          <Text style={styles.emptyHistorialTitle}>Sin pagos registrados</Text>
          <Text style={styles.emptyHistorialDesc}>
            Tu historial aparecerá aquí una vez actives el cobro automático.
          </Text>
        </View>
      )}

      {tarjetaRegistrada && HISTORIAL_PADRE_DEMO.map(pago => (
        <View key={pago.id} style={styles.pagoCard}>
          <View style={styles.pagoCardTop}>
            <View style={styles.pagoMesCircle}>
              <Ionicons name="receipt-outline" size={18} color="#0D1B3E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pagoMes}>{pago.mes}</Text>
              <Text style={styles.pagoFecha}>{pago.fecha} · {pago.conductor}</Text>
            </View>
            <View style={styles.pagoRight}>
              <Text style={styles.pagoMonto}>${pago.monto.toFixed(2)}</Text>
              <View style={styles.exitosoBadge}>
                <View style={styles.exitosoDot} />
                <Text style={styles.exitosoText}>Exitoso</Text>
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
      ))}

      <ModalTarjeta
        visible={modalTarjeta}
        onClose={() => setModalTarjeta(false)}
        onGuardar={() => {
          setTarjetaRegistrada(true);
          setModalTarjeta(false);
        }}
      />

      {modalRecibo && (
        <ModalRecibo
          pago={modalRecibo}
          onClose={() => setModalRecibo(null)}
        />
      )}
    </ScrollView>
  );
}

// ─── Modal tarjeta Stripe simulado ───────────────────────────────────────────
function ModalTarjeta({ visible, onClose, onGuardar }) {
  const [numero, setNumero] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvc, setCvc] = useState('');
  const [cargando, setCargando] = useState(false);

  const puedeGuardar = numero.replace(/\s/g, '').length === 16 && vencimiento.length === 5 && cvc.length >= 3;

  const handleGuardar = () => {
    if (!puedeGuardar) return;
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      Alert.alert(
        'Éxito',
        'Tarjeta tokenizada de forma segura por Stripe y contrato activado.',
        [{ text: 'Entendido', onPress: () => { onGuardar(); setNumero(''); setVencimiento(''); setCvc(''); } }]
      );
    }, 2200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="lock-closed-outline" size={20} color="#0D1B3E" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Método de pago</Text>
              <Text style={styles.modalSubtitle}>Protegido y tokenizado por Stripe</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close-outline" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.tarjetaVisual}>
            <View style={styles.tarjetaChip}>
              <Ionicons name="hardware-chip-outline" size={22} color="#FFD700" />
            </View>
            <Text style={styles.tarjetaNumeroVisual}>
              {numero.padEnd(19, '·').replace(/(.{4})/g, '$1 ').trim().slice(0, 24)}
            </Text>
            <View style={styles.tarjetaFooter}>
              <View>
                <Text style={styles.tarjetaFooterLabel}>VENCIMIENTO</Text>
                <Text style={styles.tarjetaFooterValor}>{vencimiento || 'MM/AA'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.tarjetaFooterLabel}>CVC</Text>
                <Text style={styles.tarjetaFooterValor}>{cvc ? '•'.repeat(cvc.length) : '•••'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Número de tarjeta</Text>
          <View style={styles.inputRow}>
            <Ionicons name="card-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.inputFlex}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#bbb"
              keyboardType="number-pad"
              value={numero}
              onChangeText={v => setNumero(formatCard(v))}
              maxLength={19}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Vencimiento</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="MM/AA"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  value={vencimiento}
                  onChangeText={v => setVencimiento(formatExp(v))}
                  maxLength={5}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CVC</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="•••"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  secureTextEntry
                  value={cvc}
                  onChangeText={v => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          <View style={styles.stripeNota}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#888" />
            <Text style={styles.stripeNotaText}>
              BusWay nunca almacena tu número de tarjeta. Stripe la tokeniza de forma segura (PCI DSS).
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btnGuardar, (!puedeGuardar || cargando) && styles.btnDisabled]}
            onPress={handleGuardar}
            activeOpacity={puedeGuardar && !cargando ? 0.85 : 1}
          >
            {cargando ? (
              <>
                <ActivityIndicator size="small" color="#0D1B3E" />
                <Text style={styles.btnGuardarText}>Tokenizando con Stripe...</Text>
              </>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={17} color="#0D1B3E" />
                <Text style={styles.btnGuardarText}>Guardar tarjeta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal recibo de pago ─────────────────────────────────────────────────────
function ModalRecibo({ pago, onClose }) {
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
              <Text style={styles.modalSubtitle}>{pago.mes} · {pago.fecha}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close-outline" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.reciboBox}>
            <FilaRecibo label="Conductor" valor={pago.conductor} />
            <FilaRecibo label="Escuela / Ruta" valor={pago.escuela} />
            <FilaRecibo label="Período" valor={pago.mes} />
            <FilaRecibo label="Fecha de cobro" valor={pago.fecha} />
            <View style={styles.reciboSeparador} />
            <FilaRecibo label="Tarifa del conductor" valor={`$${pago.tarifa.toFixed(2)}`} />
            <FilaRecibo label="Membresía BusWay" valor={`$${pago.membresia.toFixed(2)}`} />
            <View style={styles.reciboSeparador} />
            <FilaRecibo label="Total cobrado" valor={`$${pago.monto.toFixed(2)}`} destacado />
            <View style={[styles.exitosoBadge, { alignSelf: 'center', marginTop: 14, paddingHorizontal: 16, paddingVertical: 6 }]}>
              <View style={styles.exitosoDot} />
              <Text style={[styles.exitosoText, { fontSize: 13 }]}>Pago exitoso</Text>
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
function VistaConductor() {
  const [rutaActiva, setRutaActiva] = useState('Todas las rutas');

  const historialFiltrado = rutaActiva === 'Todas las rutas'
    ? HISTORIAL_CONDUCTOR_DEMO
    : HISTORIAL_CONDUCTOR_DEMO.filter(p => p.escuela === rutaActiva);

  const totalMes = historialFiltrado
    .filter(p => p.fecha.includes('06/2026'))
    .reduce((acc, p) => acc + p.monto, 0);

  const contratosActivos = HISTORIAL_CONDUCTOR_DEMO.filter(p => p.fecha.includes('06/2026')).length;

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

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
          <Text style={[styles.metricaValor, { color: '#00AEEF' }]}>$296.04</Text>
          <Text style={styles.metricaLabel}>Próximo depósito</Text>
        </View>
      </View>

      <View style={styles.notaTarifa}>
        <Ionicons name="information-circle-outline" size={14} color="#888" />
        <Text style={styles.notaTarifaText}>
          El monto depositado a tu cuenta es el pago neto.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Historial de cobros</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {RUTAS_CONDUCTOR.map(ruta => (
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

      {historialFiltrado.map(pago => (
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
              <Text style={styles.cobroMetaText}>Depositado el {pago.fecha}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.cobroMonto}>${pago.monto.toFixed(2)}</Text>
            <View style={styles.depositadoBadge}>
              <View style={styles.depositadoDot} />
              <Text style={styles.depositadoText}>Depositado</Text>
            </View>
          </View>
        </View>
      ))}
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
  tarjetaVisual: { backgroundColor: '#0D1B3E', borderRadius: 18, padding: 20, marginBottom: 22 },
  tarjetaChip: { marginBottom: 14 },
  tarjetaNumeroVisual: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  tarjetaFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  tarjetaFooterLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
  tarjetaFooterValor: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  inputFlex: { flex: 1, fontSize: 14, color: '#0D1B3E', fontWeight: '600' },
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
});