import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, TextInput, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const RUTA_PADRE_DEMO = {
  conductor: {
    nombre: 'Carlos Pérez',
    telefono: '6500-1234',
    vehiculo: 'Toyota Coaster 2020',
    placa: 'BC-8888',
    asientos: 30,
    rating: 4.8,
    reviews: 23,
    verificado: true,
  },
  escuela: 'Colegio San Agustín',
  zona: 'Arraiján',
  frecuencia: 'Lunes a Viernes',
  horario: '6:30 AM — 7:15 AM',
  tarifa: 80,
  mesActual: 3,
  totalMeses: 10,
  paradas: [
    { orden: 1, descripcion: 'Punto de recogida — Casa del padre', hora: '6:30 AM' },
    { orden: 2, descripcion: 'Parada 2 — Entrada de El Cangrejo', hora: '6:45 AM' },
    { orden: 3, descripcion: 'Parada 3 — Cerca de Transístmica', hora: '6:55 AM' },
    { orden: 4, descripcion: 'Destino — Colegio San Agustín', hora: '7:15 AM' },
  ],
  hijos: [
    { id: 'h1', nombre: 'Sofía', estado: 'Activo' },
  ],
};

const ESTUDIANTES_CONDUCTOR_DEMO = [
  { id: 'e1', nombre: 'Sofía Rodríguez', zona: 'Arraiján', escuela: 'Colegio San Agustín', inputPos: '1' },
  { id: 'e2', nombre: 'Mateo Coronado', zona: 'Vista Alegre', escuela: 'Colegio San Agustín', inputPos: '2' },
  { id: 'e3', nombre: 'Ceferino JR', zona: 'Arraiján', escuela: 'Colegio San Agustín', inputPos: '3' },
  { id: 'e4', nombre: 'Juanin Torres', zona: 'Nuevo Arraiján', escuela: 'Instituto Fermín Naudeau', inputPos: '4' },
];

const RUTAS_CONDUCTOR_DEMO = [
  { id: 'r1', escuela: 'Colegio San Agustín', zona: 'Arraiján', zonas: ['Arraiján', 'Vista Alegre'], alumnos: 4, activa: true, horario: '6:30 AM — 7:15 AM' },
  { id: 'r2', escuela: 'Instituto Fermín Naudeau', zona: 'La Chorrera', zonas: ['La Chorrera', 'Barrio Colón'], alumnos: 8, activa: true, horario: '6:00 AM — 7:00 AM' },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RutaScreen({ navigation, route }) {
  const { usuario } = route.params;
  const esPadre = usuario.tipo === 'padre';

  return (
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
          ? <RutaPadre navigation={navigation} usuario={usuario} />
          : <RutaConductor navigation={navigation} usuario={usuario} />
        }
      </View>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA PADRE
// ══════════════════════════════════════════════════════════════════════════════
function RutaPadre({ navigation, usuario }) {
  const ruta = RUTA_PADRE_DEMO;
  const progreso = (ruta.mesActual / ruta.totalMeses) * 100;

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {/* Sin contrato activo */}
      {!ruta ? (
        <EstadoVacio
          icon="map-outline"
          titulo="Sin ruta activa"
          desc="Cuando contrates a un conductor desde el Marketplace, aquí verás la ruta fija de tu hijo."
          btnTexto="Ir al Marketplace"
          onPress={() => navigation.navigate('Marketplace', { usuario })}
        />
      ) : (
        <>
          {/* Tarjeta del conductor */}
          <Text style={styles.sectionLabel}>Conductor asignado</Text>
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
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name={s <= Math.round(ruta.conductor.rating) ? 'star' : 'star-outline'} size={12} color="#FFD700" />
                  ))}
                  <Text style={styles.ratingTexto}>{ruta.conductor.rating} ({ruta.conductor.reviews} reseñas)</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.btnWhatsapp}
                onPress={() => Alert.alert('WhatsApp', `Contactar a ${ruta.conductor.nombre}`)}
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
            {ruta.hijos.length === 1 ? 'Hijo en esta ruta' : 'Hijos en esta ruta'}
          </Text>
          <View style={styles.infoCard}>
            {ruta.hijos.map((hijo, i) => (
              <View
                key={hijo.id}
                style={[styles.hijoRow, i < ruta.hijos.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}
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

          {/* Paradas */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Recorrido</Text>
          <View style={styles.paradasCard}>
            {ruta.paradas.map((parada, i) => {
              const esUltima = i === ruta.paradas.length - 1;
              const esPrimera = i === 0;
              return (
                <View key={i} style={styles.paradaRow}>
                  {/* Línea de tiempo */}
                  <View style={styles.paradaTimeline}>
                    <View style={[
                      styles.paradaPunto,
                      esPrimera && styles.paradaPuntoPrimero,
                      esUltima && styles.paradaPuntoUltimo,
                    ]} />
                    {!esUltima && <View style={styles.paradaLinea} />}
                  </View>
                  {/* Contenido */}
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
        </>
      )}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA CONDUCTOR
// ══════════════════════════════════════════════════════════════════════════════
function RutaConductor({ navigation, usuario }) {
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [estudiantes, setEstudiantes] = useState(ESTUDIANTES_CONDUCTOR_DEMO);
  const [rutas] = useState(RUTAS_CONDUCTOR_DEMO);

  const moverEstudiante = (index, direccion) => {
    const nuevas = [...estudiantes];
    const destino = direccion === 'ARRIBA' ? index - 1 : index + 1;
    if (destino < 0 || destino >= estudiantes.length) return;
    const temp = nuevas[index];
    nuevas[index] = nuevas[destino];
    nuevas[destino] = temp;
    nuevas.forEach((e, i) => { e.inputPos = (i + 1).toString(); });
    setEstudiantes(nuevas);
  };

  const cambiarPosicion = (index, texto) => {
    const nuevas = [...estudiantes];
    nuevas[index].inputPos = texto;
    setEstudiantes(nuevas);
    const pos = parseInt(texto);
    if (isNaN(pos) || pos < 1 || pos > estudiantes.length) return;
    const [alumno] = nuevas.splice(index, 1);
    nuevas.splice(pos - 1, 0, alumno);
    nuevas.forEach((e, i) => { e.inputPos = (i + 1).toString(); });
    setEstudiantes(nuevas);
  };

  // ── Detalle de ruta seleccionada ──────────────────────────────────────────
  if (rutaSeleccionada) {
    const estudiantesDeRuta = estudiantes.filter(e => e.escuela === rutaSeleccionada.escuela);

    return (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

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
              <Text style={styles.rutaResumenEscuela}>{rutaSeleccionada.escuela}</Text>
              <Text style={styles.rutaResumenSub}>{rutaSeleccionada.horario} · {estudiantesDeRuta.length} estudiantes</Text>
            </View>
            <View style={[styles.estadoBadge, rutaSeleccionada.activa && styles.estadoBadgeActivo]}>
              <View style={[styles.estadoPunto, rutaSeleccionada.activa && { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.estadoBadgeText, rutaSeleccionada.activa && { color: '#16A34A' }]}>
                {rutaSeleccionada.activa ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
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
        </View>

        {/* Encabezado tabla */}
        <View style={styles.tablaHeader}>
          <Text style={styles.tablaHeaderOrden}>Orden</Text>
          <Text style={styles.tablaHeaderNombre}>Estudiante</Text>
          <TouchableOpacity
            style={[styles.btnEditar, editando && styles.btnEditarActivo]}
            onPress={() => setEditando(!editando)}
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
          onPress={() => Alert.alert('BusWay GPS', 'Iniciando transmisión GPS en tiempo real. Los padres han sido notificados del inicio del recorrido.')}
        >
          <Ionicons name="play-circle" size={20} color="#0D1B3E" />
          <Text style={styles.btnIniciarText}>Iniciar Ruta en Tiempo Real</Text>
        </TouchableOpacity>

      </ScrollView>
    );
  }

  // ── Lista de rutas ────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {/* Resumen general */}
      <View style={styles.statsRow}>
        <StatCard icon="map-outline" valor={rutas.length} label="Rutas activas" color="#0D1B3E" />
        <StatCard icon="people-outline" valor={estudiantes.length} label="Estudiantes" color="#00AEEF" />
        <StatCard icon="school-outline" valor={[...new Set(estudiantes.map(e => e.escuela))].length} label="Escuelas" color="#FFD700" textColor="#0D1B3E" />
      </View>

      {/* Lista de rutas */}
      <Text style={styles.sectionLabel}>Rutas registradas</Text>

      {rutas.length === 0 ? (
        <EstadoVacio
          icon="map-outline"
          titulo="Sin rutas registradas"
          desc="Registra tu primera ruta desde el Marketplace para que los padres puedan encontrarte."
          btnTexto="Ir al Marketplace"
          onPress={() => {}}
        />
      ) : (
        rutas.map(ruta => (
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
                <Text style={styles.rutaEscuela}>{ruta.escuela}</Text>
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
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        ))
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
  estadoPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ccc' },
  estadoActivoText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

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
});