import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, StatusBar, Alert,
  ScrollView, useWindowDimensions, TextInput,
  KeyboardAvoidingView, Platform, Linking, Modal,
  FlatList
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Datos de ejemplo ────────────────────────────────────────────────────────
const CONDUCTORES_DEMO = [
  {
    id: '1',
    nombre: 'Carlos Mendoza',
    vehiculo: 'Bus Toyota Hiace 2020',
    escuelas: ['Instituto Fermín Naudeau', 'Colegio San Agustín'],
    zonas: ['Arraiján', 'La Chorrera'],
    tarifa: 80,
    rating: 4.8,
    reviews: 23,
    plazasDisponibles: 3,
    verificado: true,
    telefono: '50700000001',
  },
  {
    id: '2',
    nombre: 'Roberto Salas',
    vehiculo: 'Minibús Hyundai County',
    escuelas: ['Escuela República de México'],
    zonas: ['Arraiján', 'Vista Alegre'],
    tarifa: 65,
    rating: 4.5,
    reviews: 11,
    plazasDisponibles: 6,
    verificado: true,
    telefono: '50700000002',
  },
  {
    id: '3',
    nombre: 'Luis Herrera',
    vehiculo: 'Bus Mitsubishi Rosa 2019',
    escuelas: ['Instituto Fermín Naudeau', 'Colegio La Salle'],
    zonas: ['La Chorrera', 'Barrio Colón'],
    tarifa: 75,
    rating: 4.9,
    reviews: 37,
    plazasDisponibles: 1,
    verificado: true,
    telefono: '50700000003',
  },
];

const HIJOS_DEMO = [
  { id: 'h1', nombre: 'Sofía' },
  { id: 'h2', nombre: 'Mateo' },
];

// Estado compartido simulado de solicitudes (en producción viene del backend)
// Se declara fuera del componente para que persista entre renders como si fuera
// un store global simple para la demo.
let SOLICITUDES_GLOBALES = [
  {
    id: 's0',
    conductorId: '2',
    conductorNombre: 'Roberto Salas',
    conductorVehiculo: 'Minibús Hyundai County',
    conductorTarifa: 65,
    escuela: 'Escuela República de México',
    hijoNombre: 'Mateo',
    estado: 'pendiente', // 'pendiente' | 'aceptada' | 'rechazada'
    fecha: '12/06/2026',
  },
];

const RUTAS_CONDUCTOR_DEMO = [
  {
    id: 'r1',
    escuela: 'Instituto Fermín Naudeau',
    zonas: ['Arraiján', 'Vista Alegre'],
    alumnos: 12,
    activa: true,
  },
];

const PROVINCIAS = ['Panamá', 'Panamá Oeste', 'Colón', 'Coclé', 'Veraguas', 'Herrera', 'Los Santos', 'Chiriquí', 'Bocas del Toro', 'Darién'];
const DISTRITOS = {
  'Panamá': ['Panamá', 'San Miguelito', 'Chepo', 'Taboga'],
  'Panamá Oeste': ['Arraiján', 'La Chorrera', 'Capira', 'Chame', 'San Carlos'],
};
const CORREGIMIENTOS = {
  'Arraiján': ['Vista Alegre', 'Nuevo Arraiján', 'Burunga', 'Juan Demóstenes Arosemena', 'Veracruz'],
  'La Chorrera': ['La Chorrera', 'Barrio Colón', 'El Arado', 'Herrera', 'Mendoza'],
  'Panamá': ['Ancón', 'Bella Vista', 'Betania', 'Calidonia', 'Curundú', 'El Chorrillo', 'Parque Lefevre'],
};
const ESCUELAS_LISTA = [
  'Instituto Fermín Naudeau',
  'Colegio San Agustín',
  'Colegio La Salle',
  'Escuela República de México',
  'Instituto América',
  'Colegio Javier',
];
const ZONAS_LISTA = ['Arraiján', 'Vista Alegre', 'Nuevo Arraiján', 'La Chorrera', 'Barrio Colón', 'Capira', 'Chame'];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MarketplaceScreen({ navigation, route }) {
  const { usuario } = route.params;
  const insets = useSafeAreaInsets();
  const esPadre = usuario.tipo === 'padre';

  const [ubicacionGuardada, setUbicacionGuardada] = useState(usuario.ubicacion ?? null);
  const [rutasGuardadas, setRutasGuardadas] = useState(usuario.rutas ?? RUTAS_CONDUCTOR_DEMO);
  // Forzar re-render al cambiar solicitudes globales
  const [solicitudes, setSolicitudes] = useState([...SOLICITUDES_GLOBALES]);

  const actualizarSolicitudes = (nuevas) => {
    SOLICITUDES_GLOBALES = nuevas;
    setSolicitudes([...nuevas]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>BusWay</Text>
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Card blanca */}
      <View style={styles.card}>
        {esPadre ? (
          <MarketplacePadre
            ubicacion={ubicacionGuardada}
            onGuardarUbicacion={(u) => setUbicacionGuardada(u)}
            usuario={usuario}
            solicitudes={solicitudes}
            onAgregarSolicitud={(s) => actualizarSolicitudes([...SOLICITUDES_GLOBALES, s])}
          />
        ) : (
          <MarketplaceConductor
            rutas={rutasGuardadas}
            onAgregarRuta={(r) => setRutasGuardadas(prev => [...prev, r])}
            solicitudes={solicitudes}
            onCambiarEstado={(id, nuevoEstado) => {
              const actualizadas = SOLICITUDES_GLOBALES.map(s =>
                s.id === id ? { ...s, estado: nuevoEstado } : s
              );
              actualizarSolicitudes(actualizadas);
            }}
          />
        )}
      </View>

      {/* Tab bar */}
      <TabBar insets={insets} onLogout={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })} />
    </SafeAreaView>
  );
}

// ─── Vista PADRE ──────────────────────────────────────────────────────────────
function MarketplacePadre({ ubicacion, onGuardarUbicacion, usuario, solicitudes, onAgregarSolicitud }) {
  const [tabActivo, setTabActivo] = useState('catalogo'); // 'catalogo' | 'enviadas'
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

  // Pantalla de configuración de ubicación
  if (!ubicacion && !mostrarFormulario) {
    return <PantallaConfigUbicacion onComenzar={() => setMostrarFormulario(true)} />;
  }
  if (mostrarFormulario && !ubicacion) {
    return (
      <FormularioUbicacion
        onGuardar={(u) => { onGuardarUbicacion(u); setMostrarFormulario(false); }}
        onCancelar={() => setMostrarFormulario(false)}
      />
    );
  }

  // Modal de solicitud
  if (conductorSeleccionado) {
    return (
      <PantallaSolicitud
        conductor={conductorSeleccionado}
        usuario={usuario}
        ubicacion={ubicacion}
        onEnviar={(nuevaSolicitud) => {
          onAgregarSolicitud(nuevaSolicitud);
          setConductorSeleccionado(null);
          setTabActivo('enviadas');
        }}
        onCancelar={() => setConductorSeleccionado(null)}
      />
    );
  }

  const conductoresFiltrados = CONDUCTORES_DEMO.filter(c =>
    busqueda === '' ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.escuelas.some(e => e.toLowerCase().includes(busqueda.toLowerCase())) ||
    c.zonas.some(z => z.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs internos */}
      <View style={styles.tabsInternos}>
        <TouchableOpacity
          style={[styles.tabInterno, tabActivo === 'catalogo' && styles.tabInternoActivo]}
          onPress={() => setTabActivo('catalogo')}
        >
          <Text style={[styles.tabInternoText, tabActivo === 'catalogo' && styles.tabInternoTextActivo]}>
            Conductores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabInterno, tabActivo === 'enviadas' && styles.tabInternoActivo]}
          onPress={() => setTabActivo('enviadas')}
        >
          <Text style={[styles.tabInternoText, tabActivo === 'enviadas' && styles.tabInternoTextActivo]}>
            Solicitudes enviadas
          </Text>
          {solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tabActivo === 'catalogo' ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Ubicación sin fondo celeste */}
          <View style={styles.ubicacionSimple}>
            <View style={styles.ubicacionIconCircle}>
              <Ionicons name="location" size={18} color="#0D1B3E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ubicacionLabel}>Tu ubicación de recogida</Text>
              <Text style={styles.ubicacionTexto} numberOfLines={1}>
                {ubicacion?.corregimiento}, {ubicacion?.distrito} · {ubicacion?.provincia}
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.cambiarLink}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por escuela, zona o conductor..."
              placeholderTextColor="#aaa"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda !== '' && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={18} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>Conductores disponibles</Text>
          <Text style={styles.sectionSub}>{conductoresFiltrados.length} conductores cerca de tu zona</Text>

          {conductoresFiltrados.map(conductor => (
            <CardConductor
              key={conductor.id}
              conductor={conductor}
              onSolicitar={() => setConductorSeleccionado(conductor)}
            />
          ))}

          {conductoresFiltrados.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bus-outline" size={40} color="#ccc" />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyDesc}>Intenta con otra escuela o zona.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ListaSolicitudesEnviadas solicitudes={solicitudes} />
      )}
    </View>
  );
}

// ─── Pantalla de solicitud (inline, reemplaza la vista del catálogo) ───────────
function PantallaSolicitud({ conductor, usuario, ubicacion, onEnviar, onCancelar }) {
  const hijos = usuario.hijos ?? HIJOS_DEMO;
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);

  const hijoObj = hijos.find(h => h.id === hijoSeleccionado);
  const puedeEnviar = hijoSeleccionado !== null;

  const handleWhatsApp = async () => {
    if (!puedeEnviar) return;

    const escuela = conductor.escuelas[0];
    const mensaje =
      `Hola ${conductor.nombre}, soy *${usuario.nombre} ${usuario.apellido}*, ` +
      `padre/madre de *${hijoObj.nombre}* quien asiste a *${escuela}*. ` +
      `Vi tu perfil en BusWay y me interesa contratar tu servicio de transporte escolar (tarifa $${conductor.tarifa}/mes). ` +
      `¿Tienes disponibilidad en tu ruta para mi hijo/a? ¡Quedo pendiente, gracias!`;

    const numero = conductor.telefono ?? '50700000000';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    const nuevaSolicitud = {
      id: 's' + Date.now(),
      conductorId: conductor.id,
      conductorNombre: conductor.nombre,
      conductorVehiculo: conductor.vehiculo,
      conductorTarifa: conductor.tarifa,
      escuela: conductor.escuelas[0],
      hijoNombre: hijoObj.nombre,
      estado: 'pendiente',
      fecha: new Date().toLocaleDateString('es-PA'),
    };

    const soportado = await Linking.canOpenURL(url);
    if (soportado) {
      await Linking.openURL(url);
      onEnviar(nuevaSolicitud);
    } else {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Botón atrás */}
        <TouchableOpacity onPress={onCancelar} style={styles.btnBack}>
          <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
          <Text style={styles.btnBackText}>Volver al catálogo</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Confirmar solicitud</Text>
        <Text style={styles.formDesc}>
          Revisa la información antes de contactar al conductor.
        </Text>

        {/* Datos del conductor */}
        <Text style={styles.sectionLabel}>Conductor</Text>
        <View style={styles.resumenCard}>
          <View style={styles.resumenCardTop}>
            <View style={styles.conductorAvatar}>
              <Text style={styles.conductorAvatarText}>{conductor.nombre.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.conductorNombre}>{conductor.nombre}</Text>
                {conductor.verificado && (
                  <View style={styles.verificadoBadge}>
                    <Ionicons name="shield-checkmark" size={11} color="#0D1B3E" />
                    <Text style={styles.verificadoText}>Verificado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.conductorVehiculo}>{conductor.vehiculo}</Text>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map(s => (
                  <Ionicons key={s} name={s <= Math.round(conductor.rating) ? 'star' : 'star-outline'} size={12} color="#FFD700" />
                ))}
                <Text style={styles.ratingTexto}>{conductor.rating} ({conductor.reviews} reseñas)</Text>
              </View>
            </View>
            <View style={styles.tarifaBox}>
              <Text style={styles.tarifaNum}>${conductor.tarifa}</Text>
              <Text style={styles.tarifaMes}>/mes</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <FilaDatoCompacta icon="school-outline" label="Escuela" valor={conductor.escuelas[0]} />
          <FilaDatoCompacta icon="location-outline" label="Zonas" valor={conductor.zonas.join(', ')} last />
        </View>

        {/* Datos del padre */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Tus datos</Text>
        <View style={styles.resumenCard}>
          <FilaDatoCompacta
            icon="person-outline"
            label="Nombre"
            valor={`${usuario.nombre} ${usuario.apellido}`}
          />
          <FilaDatoCompacta
            icon="location-outline"
            label="Dirección de recogida"
            valor={ubicacion
              ? `${ubicacion.corregimiento}, ${ubicacion.distrito}, ${ubicacion.provincia}`
              : 'No registrada'}
            last
          />
        </View>

        {/* Selector de hijo */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>¿Para cuál hijo?</Text>
        <Text style={styles.sectionSub}>Selecciona quién recibirá este servicio.</Text>

        {hijos.length === 0 ? (
          <View style={styles.emptyHijos}>
            <Ionicons name="people-outline" size={32} color="#ccc" />
            <Text style={styles.emptyHijosTitle}>Sin hijos registrados</Text>
            <Text style={styles.emptyHijosDesc}>
              Primero agrega un hijo en "Hijos y QR" desde el Dashboard.
            </Text>
          </View>
        ) : (
          <View style={styles.hijosLista}>
            {hijos.map(hijo => {
              const activo = hijoSeleccionado === hijo.id;
              return (
                <TouchableOpacity
                  key={hijo.id}
                  style={[styles.hijoCard, activo && styles.hijoCardActivo]}
                  onPress={() => setHijoSeleccionado(hijo.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.hijoAvatar, activo && styles.hijoAvatarActivo]}>
                    <Text style={[styles.hijoAvatarText, activo && styles.hijoAvatarTextActivo]}>
                      {hijo.nombre.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.hijoNombre, activo && styles.hijoNombreActivo]}>
                    {hijo.nombre}
                  </Text>
                  <View style={[styles.radioCircle, activo && styles.radioCircleActivo]}>
                    {activo && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Nota */}
        {puedeEnviar && (
          <View style={styles.notaBox}>
            <Ionicons name="information-circle-outline" size={16} color="#00AEEF" />
            <Text style={styles.notaText}>
              Se abrirá WhatsApp con un mensaje dirigido a{' '}
              <Text style={{ fontWeight: '700' }}>{conductor.nombre}. </Text>
              El conductor podrá aceptar o rechazar el servicio.
            </Text>
          </View>
        )}

        {/* Botón WhatsApp */}
        <TouchableOpacity
          style={[styles.btnWhatsapp, !puedeEnviar && styles.btnDisabled]}
          onPress={handleWhatsApp}
          activeOpacity={puedeEnviar ? 0.85 : 1}
        >
          <Ionicons name="logo-whatsapp" size={20} color={puedeEnviar ? '#fff' : '#aaa'} />
          <Text style={[styles.btnWhatsappText, !puedeEnviar && styles.btnWhatsappTextDisabled]}>
            Enviar Solicitud
          </Text>
        </TouchableOpacity>

        {!puedeEnviar && hijos.length > 0 && (
          <Text style={styles.hintText}>Selecciona un hijo para continuar</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Lista de solicitudes enviadas (padre) ────────────────────────────────────
function ListaSolicitudesEnviadas({ solicitudes }) {
  if (solicitudes.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="send-outline" size={40} color="#ccc" />
        <Text style={styles.emptyTitle}>Sin solicitudes</Text>
        <Text style={styles.emptyDesc}>
          Tus solicitudes a conductores aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Mis solicitudes</Text>
      <Text style={styles.sectionSub}>{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} enviada{solicitudes.length !== 1 ? 's' : ''}</Text>

      {solicitudes.map(sol => (
        <CardSolicitudPadre key={sol.id} solicitud={sol} />
      ))}
    </ScrollView>
  );
}

function CardSolicitudPadre({ solicitud }) {
  const cfg = {
    pendiente:  { color: '#F59E0B', bg: '#FFF8E1', icono: 'time-outline',            texto: 'Pendiente' },
    aceptada:   { color: '#16A34A', bg: '#E6F9EE', icono: 'checkmark-circle-outline', texto: 'Aceptada'  },
    rechazada:  { color: '#DC2626', bg: '#FEE2E2', icono: 'close-circle-outline',     texto: 'Rechazada' },
  }[solicitud.estado];

  return (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudCardTop}>
        <View style={styles.conductorAvatar}>
          <Text style={styles.conductorAvatarText}>{solicitud.conductorNombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.conductorNombre}>{solicitud.conductorNombre}</Text>
          <Text style={styles.conductorVehiculo}>{solicitud.conductorVehiculo}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icono} size={13} color={cfg.color} />
          <Text style={[styles.estadoBadgeText, { color: cfg.color }]}>{cfg.texto}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.solicitudInfo}>
        <InfoChip icon="person-outline" texto={`Hijo: ${solicitud.hijoNombre}`} />
        <InfoChip icon="school-outline" texto={solicitud.escuela} />
        <InfoChip icon="card-outline" texto={`$${solicitud.conductorTarifa}/mes`} />
        <InfoChip icon="calendar-outline" texto={solicitud.fecha} />
      </View>
    </View>
  );
}

// ─── Vista CONDUCTOR ──────────────────────────────────────────────────────────
function MarketplaceConductor({ rutas, onAgregarRuta, solicitudes, onCambiarEstado }) {
  const [tabActivo, setTabActivo] = useState('rutas'); // 'rutas' | 'recibidas'
  const [rutaDetalle, setRutaDetalle] = useState(null); //para los detalles de las rutas al tocar el card
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  //Estado para almacenar las cuentas bancarias guardadas por el conductor
  const [cuentasBancarias, setCuentasBancarias] = useState([
    { id: 'b1', nombre: 'Carlos Mendoza - General', numero: '03-72-01-234567-8', banco: 'Banco General' }
  ]);

  if (mostrarFormulario) {
    return (
      <FormularioRuta
        cuentasGuardadas={cuentasBancarias}
        onGuardarNuevaCuenta={(nuevaCta) => setCuentasBancarias(prev => [...prev, nuevaCta])}
        onPublicar={(r) => { onAgregarRuta(r); setMostrarFormulario(false); }}
        onCancelar={() => setMostrarFormulario(false)}
      />
    );
  }

  if (rutaDetalle) {
    return (
      <DetalleRutaConductor 
        ruta={rutaDetalle} 
        onVolver={() => setRutaDetalle(null)} 
      />
    );
  }

  if (rutas.length === 0 && tabActivo === 'rutas') {
    return <PantallaConfigRuta onComenzar={() => setMostrarFormulario(true)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs internos */}
      <View style={styles.tabsInternos}>
        <TouchableOpacity
          style={[styles.tabInterno, tabActivo === 'rutas' && styles.tabInternoActivo]}
          onPress={() => setTabActivo('rutas')}
        >
          <Text style={[styles.tabInternoText, tabActivo === 'rutas' && styles.tabInternoTextActivo]}>
            Mis rutas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabInterno, tabActivo === 'recibidas' && styles.tabInternoActivo]}
          onPress={() => setTabActivo('recibidas')}
        >
          <Text style={[styles.tabInternoText, tabActivo === 'recibidas' && styles.tabInternoTextActivo]}>
            Solicitudes recibidas
          </Text>
          {solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tabActivo === 'rutas' ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.headerAccion}>
            <View>
              <Text style={styles.sectionTitle}>Mis rutas publicadas</Text>
              <Text style={styles.sectionSub}>
                {rutas.length} ruta{rutas.length !== 1 ? 's' : ''} activa{rutas.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.btnNuevaRuta} onPress={() => setMostrarFormulario(true)}>
              <Ionicons name="add-outline" size={18} color="#0D1B3E" />
              <Text style={styles.btnNuevaRutaText}>Nueva ruta</Text>
            </TouchableOpacity>
          </View>

          {rutas.map((ruta, i) => (
            <TouchableOpacity key={ruta.id ?? i} onPress={() => setRutaDetalle(ruta)} activeOpacity={0.85}>
              <CardRuta ruta={ruta} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ListaSolicitudesRecibidas
          solicitudes={solicitudes}
          onCambiarEstado={onCambiarEstado}
        />
      )}
    </View>
  );
}

// ─── Detalles del card de la ruta (conductor) ──────────────────────────────────
function DetalleRutaConductor({ ruta, onVolver }) {
  const [editando, setEditando] = useState(false);
  
  // Datos quemados para la simulación del Frontend del proyecto
  const [estudiantes, setEstudiantes] = useState([
    { id: 'e1', nombre: 'Mateo Coronado', escuela: ruta.escuela, zona: ruta.zonas?.[0] || 'Zona A', inputPos: '1' },
    { id: 'e2', nombre: 'Sofía Pimentel', escuela: ruta.escuela, zona: ruta.zonas?.[1] || ruta.zonas?.[0] || 'Zona B', inputPos: '2' },
    { id: 'e3', nombre: 'Lucas Sánchez', escuela: ruta.escuela, zona: ruta.zonas?.[0] || 'Zona A', inputPos: '3' },
    { id: 'e4', nombre: 'Amanda Serrano', escuela: ruta.escuela, zona: ruta.zonas?.[0] || 'Zona A', inputPos: '4' }
  ]);

  // FUNCIÓN 1: Mover estudiantes usando las flechas Arriba / Abajo
  const moverEstudiante = (index, direccion) => {
    const nuevasFilas = [...estudiantes];
    const destino = direccion === 'ARRIBA' ? index - 1 : index + 1;
    
    // Validar límites del arreglo
    if (destino < 0 || destino >= estudiantes.length) return;
    
    // Intercambiar posiciones
    const temporal = nuevasFilas[index];
    nuevasFilas[index] = nuevasFilas[destino];
    nuevasFilas[destino] = temporal;
    
    // Sincronizar el campo de texto numérico
    nuevasFilas.forEach((est, idx) => { est.inputPos = (idx + 1).toString(); });
    setEstudiantes(nuevasFilas);
  };

  // FUNCIÓN 2: Mover estudiantes escribiendo directamente el número de orden
  const cambiarPosicionPorInput = (index, textoNuevo) => {
    const nuevasFilas = [...estudiantes];
    nuevasFilas[index].inputPos = textoNuevo;
    setEstudiantes(nuevasFilas);

    const nuevaPos = parseInt(textoNuevo);
    // Validar que el número ingresado sea coherente con la cantidad de alumnos
    if (isNaN(nuevaPos) || nuevaPos < 1 || nuevaPos > estudiantes.length) return;

    // Extraer el alumno de su posición actual e insertarlo en el nuevo índice indicado
    const [alumnoFiltrado] = nuevasFilas.splice(index, 1);
    nuevasFilas.splice(nuevaPos - 1, 0, alumnoFiltrado);
    
    // Reajustar consecutivamente todos los inputs numéricos
    nuevasFilas.forEach((est, idx) => { est.inputPos = (idx + 1).toString(); });
    setEstudiantes(nuevasFilas);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Barra superior de navegación interna */}
      <View style={styles.detalleNavHeader}>
        <TouchableOpacity onPress={onVolver} style={styles.btnVolverDetalle}>
          <Ionicons name="arrow-back-outline" size={20} color="#0D1B3E" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0D1B3E', marginLeft: 4 }}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.detalleTitleHeader}>Secuencia de Ruta</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Resumen Informativo de la Ruta Seleccionada */}
        <View style={[styles.solicitudCard, { borderColor: '#00AEEF', borderWidth: 1.5, backgroundColor: '#FAFDFF' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0D1B3E' }}>{ruta.escuela}</Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Destino Escolar • {estudiantes.length} alumnos inscritos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {(ruta.zonas || []).map((z, idx) => (
              <View key={idx} style={{ backgroundColor: '#E0F3FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#00AEEF', fontWeight: '600' }}>{z}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Encabezado del Listado / Tabla */}
        <View style={styles.tablaHeaderRow}>
          <Text style={styles.colTituloOrden}>Orden</Text>
          <Text style={styles.colTituloEstudiante}>Estudiante / Parada</Text>
          <TouchableOpacity 
            style={[styles.btnEditarOrdenToggle, editando && { backgroundColor: '#0D1B3E' }]} 
            onPress={() => setEditando(!editando)}
          >
            <Ionicons name={editando ? "checkmark-circle" : "create-outline"} size={14} color={editando ? "#FFF" : "#0D1B3E"} />
            <Text style={[styles.btnEditarOrdenToggleText, editando && { color: '#FFF' }]}>
              {editando ? "Listo" : "Editar Orden"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filas de Estudiantes */}
        {estudiantes.map((est, index) => (
          <View key={est.id} style={[styles.filaEstudianteContainer, editando && { borderColor: '#FFD700', backgroundColor: '#FFFFFA' }]}>
            
            {/* Control Numérico Directo */}
            <View style={styles.colCajaOrden}>
              <TextInput
                style={[styles.inputOrdenNumerico, editando && styles.inputOrdenNumericoActivo]}
                value={est.inputPos}
                keyboardType="numeric"
                editable={editando}
                onChangeText={(text) => cambiarPosicionPorInput(index, text)}
              />
            </View>

            {/* Información Personal */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.nombreEstudianteFila}>{est.nombre}</Text>
              <Text style={styles.subtextEstudianteFila}>Parada: {est.zona}</Text>
            </View>

            {/* Botones de Flechas (Visibles únicamente en Modo Edición) */}
            {editando && (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity 
                  disabled={index === 0} 
                  style={index === 0 && { opacity: 0.25 }}
                  onPress={() => moverEstudiante(index, 'ARRIBA')}
                >
                  <Ionicons name="arrow-up-circle-outline" size={26} color="#00AEEF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={index === estudiantes.length - 1} 
                  style={index === estudiantes.length - 1 && { opacity: 0.25 }}
                  onPress={() => moverEstudiante(index, 'ABAJO')}
                >
                  <Ionicons name="arrow-down-circle-outline" size={26} color="#00AEEF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Botón de Acción Principal para Iniciar el Viaje */}
        <TouchableOpacity 
          style={styles.btnIniciarViajeAccion} 
          onPress={() => Alert.alert("BusWay GPS", "Iniciando transmisión satelital en tiempo real. Los acudientes han sido notificados del inicio del recorrido.")}
        >
          <Ionicons name="play" size={16} color="#0D1B3E" />
          <Text style={styles.btnIniciarViajeAccionText}>Iniciar Ruta en Tiempo Real</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
// ─── Lista de solicitudes recibidas (conductor) ───────────────────────────────
function ListaSolicitudesRecibidas({ solicitudes, onCambiarEstado }) {
  if (solicitudes.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="mail-open-outline" size={40} color="#ccc" />
        <Text style={styles.emptyTitle}>Sin solicitudes</Text>
        <Text style={styles.emptyDesc}>
          Las solicitudes de padres aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Solicitudes recibidas</Text>
      <Text style={styles.sectionSub}>{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''}</Text>

      {solicitudes.map(sol => (
        <CardSolicitudConductor
          key={sol.id}
          solicitud={sol}
          onAceptar={() => onCambiarEstado(sol.id, 'aceptada')}
          onRechazar={() => onCambiarEstado(sol.id, 'rechazada')}
        />
      ))}
    </ScrollView>
  );
}

function CardSolicitudConductor({ solicitud, onAceptar, onRechazar }) {
  const esPendiente = solicitud.estado === 'pendiente';
  const cfg = {
    pendiente:  { color: '#F59E0B', bg: '#FFF8E1', icono: 'time-outline',            texto: 'Pendiente' },
    aceptada:   { color: '#16A34A', bg: '#E6F9EE', icono: 'checkmark-circle-outline', texto: 'Aceptada'  },
    rechazada:  { color: '#DC2626', bg: '#FEE2E2', icono: 'close-circle-outline',     texto: 'Rechazada' },
  }[solicitud.estado];

  const confirmarAccion = (accion, callback) => {
    Alert.alert(
      accion === 'aceptar' ? 'Aceptar solicitud' : 'Rechazar solicitud',
      accion === 'aceptar'
        ? `¿Deseas aceptar el servicio para ${solicitud.hijoNombre}?`
        : `¿Deseas rechazar la solicitud de ${solicitud.hijoNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: accion === 'aceptar' ? 'Aceptar' : 'Rechazar', style: accion === 'aceptar' ? 'default' : 'destructive', onPress: callback },
      ]
    );
  };

  return (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudCardTop}>
        <View style={styles.hijoAvatarSol}>
          <Text style={styles.hijoAvatarSolText}>{solicitud.hijoNombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.conductorNombre}>{solicitud.hijoNombre}</Text>
          <Text style={styles.conductorVehiculo}>{solicitud.escuela}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icono} size={13} color={cfg.color} />
          <Text style={[styles.estadoBadgeText, { color: cfg.color }]}>{cfg.texto}</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.solicitudInfo}>
        <InfoChip icon="calendar-outline" texto={`Enviada: ${solicitud.fecha}`} />
        <InfoChip icon="card-outline" texto={`Tarifa acordada: $${solicitud.conductorTarifa}/mes`} />
      </View>

      {esPendiente && (
        <View style={styles.accionesRow}>
          <TouchableOpacity
            style={styles.btnRechazar}
            onPress={() => confirmarAccion('rechazar', onRechazar)}
            activeOpacity={0.85}
          >
            <Ionicons name="close-outline" size={16} color="#DC2626" />
            <Text style={styles.btnRechazarText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnAceptar}
            onPress={() => confirmarAccion('aceptar', onAceptar)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-outline" size={16} color="#0D1B3E" />
            <Text style={styles.btnAceptarText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function FilaDatoCompacta({ icon, label, valor, last }) {
  return (
    <View style={[styles.filaDato, !last && { borderBottomWidth: 1, borderBottomColor: '#EEF3F9' }]}>
      <View style={styles.filaIconCircle}>
        <Ionicons name={icon} size={14} color="#0D1B3E" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaLabel}>{label}</Text>
        <Text style={styles.filaValor}>{valor}</Text>
      </View>
    </View>
  );
}

function InfoChip({ icon, texto }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={12} color="#555" />
      <Text style={styles.infoChipText}>{texto}</Text>
    </View>
  );
}

// ─── Pantalla vacía padre ─────────────────────────────────────────────────────
function PantallaConfigUbicacion({ onComenzar }) {
  return (
    <View style={styles.setupContainer}>
      <View style={styles.setupIconBig}>
        <Ionicons name="location-outline" size={42} color="#0D1B3E" />
      </View>
      <Text style={styles.setupTitle}>Configura tu ubicación</Text>
      <Text style={styles.setupDesc}>
        Para mostrarte conductores cerca de ti, primero necesitamos saber dónde recogerán a tus hijos.
      </Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={onComenzar} activeOpacity={0.85}>
        <Ionicons name="location-outline" size={18} color="#0D1B3E" />
        <Text style={styles.btnPrimaryText}>Registrar ubicación</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Pantalla vacía conductor ─────────────────────────────────────────────────
function PantallaConfigRuta({ onComenzar }) {
  return (
    <View style={styles.setupContainer}>
      <View style={styles.setupIconBig}>
        <Ionicons name="map-outline" size={42} color="#0D1B3E" />
      </View>
      <Text style={styles.setupTitle}>Publica tu primera ruta</Text>
      <Text style={styles.setupDesc}>
        Los padres podrán encontrarte en el marketplace cuando publiques tu ruta y zonas de servicio.
      </Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={onComenzar} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={18} color="#0D1B3E" />
        <Text style={styles.btnPrimaryText}>Crear ruta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Formulario de ubicación (padre) ─────────────────────────────────────────
function FormularioUbicacion({ onGuardar, onCancelar }) {
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [corregimiento, setCorregimiento] = useState('');
  const [numeroCasa, setNumeroCasa] = useState('');
  const [comentario, setComentario] = useState('');
  const [paso, setPaso] = useState('form');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const distritosDisp = DISTRITOS[provincia] ?? [];
  const corregimientosDisp = CORREGIMIENTOS[distrito] ?? [];
  const puedeGuardar = provincia && distrito && corregimiento;

  const DropdownField = ({ label, value, opciones, onSelect, abierto, onToggle, placeholder, disabled }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownBtn, disabled && styles.dropdownDisabled]}
        onPress={disabled ? null : onToggle}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name={abierto ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={disabled ? '#ccc' : '#888'} />
      </TouchableOpacity>
      {abierto && (
        <View style={styles.dropdownList}>
          {opciones.map(op => (
            <TouchableOpacity
              key={op}
              style={[styles.dropdownItem, value === op && styles.dropdownItemActive]}
              onPress={() => { onSelect(op); onToggle(); }}
            >
              <Text style={[styles.dropdownItemText, value === op && styles.dropdownItemTextActive]}>{op}</Text>
              {value === op && <Ionicons name="checkmark-outline" size={14} color="#0D1B3E" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onCancelar} style={styles.btnBack}>
          <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
          <Text style={styles.btnBackText}>Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Ubicación de recogida</Text>
        <Text style={styles.formDesc}>El conductor llegará a esta dirección para recoger a tus hijos.</Text>

        <View style={styles.modoToggle}>
          <TouchableOpacity style={[styles.modoBtn, paso === 'form' && styles.modoBtnActive]} onPress={() => setPaso('form')}>
            <Ionicons name="list-outline" size={16} color={paso === 'form' ? '#0D1B3E' : '#888'} />
            <Text style={[styles.modoBtnText, paso === 'form' && styles.modoBtnTextActive]}>Por campos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modoBtn, paso === 'mapa' && styles.modoBtnActive]} onPress={() => setPaso('mapa')}>
            <Ionicons name="map-outline" size={16} color={paso === 'mapa' ? '#0D1B3E' : '#888'} />
            <Text style={[styles.modoBtnText, paso === 'mapa' && styles.modoBtnTextActive]}>En mapa</Text>
          </TouchableOpacity>
        </View>

        {paso === 'form' ? (
          <>
            <DropdownField label="Provincia *" value={provincia} opciones={PROVINCIAS}
              onSelect={(v) => { setProvincia(v); setDistrito(''); setCorregimiento(''); }}
              abierto={dropdownOpen === 'provincia'} onToggle={() => setDropdownOpen(dropdownOpen === 'provincia' ? null : 'provincia')}
              placeholder="Selecciona una provincia" />
            <DropdownField label="Distrito *" value={distrito} opciones={distritosDisp}
              onSelect={(v) => { setDistrito(v); setCorregimiento(''); }}
              abierto={dropdownOpen === 'distrito'} onToggle={() => setDropdownOpen(dropdownOpen === 'distrito' ? null : 'distrito')}
              placeholder="Selecciona un distrito" disabled={!provincia} />
            <DropdownField label="Corregimiento *" value={corregimiento} opciones={corregimientosDisp}
              onSelect={setCorregimiento}
              abierto={dropdownOpen === 'corregimiento'} onToggle={() => setDropdownOpen(dropdownOpen === 'corregimiento' ? null : 'corregimiento')}
              placeholder="Selecciona un corregimiento" disabled={!distrito} />
          </>
        ) : (
          <View style={styles.mapaPlaceholder}>
            <Ionicons name="map-outline" size={36} color="#0D1B3E" />
            <Text style={styles.mapaPlaceholderTitle}>Selecciona en el mapa</Text>
            <Text style={styles.mapaPlaceholderDesc}>Toca el mapa para colocar el pin en el punto exacto de recogida.</Text>
            <View style={styles.mapaSimulado}>
              <Ionicons name="location" size={32} color="#FF4444" />
              <Text style={styles.coordsTexto}>8.9824° N, 79.5199° O — Arraján, Panamá Oeste</Text>
            </View>
            <Text style={styles.mapaNote}>La integración con Google Maps se activará en la versión de producción.</Text>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: '#E3ECF7', marginVertical: 16 }} />
        <Text style={styles.fieldLabel}>N.º de casa / apartamento <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput style={styles.input} placeholder="Ej: Casa 12-B, Apto 304" placeholderTextColor="#aaa" value={numeroCasa} onChangeText={setNumeroCasa} />
        <Text style={styles.fieldLabel}>Indicaciones adicionales <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Ej: Frente al parque, portón azul..." placeholderTextColor="#aaa" value={comentario} onChangeText={setComentario} multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity
          style={[styles.btnPrimary, !puedeGuardar && styles.btnDisabled]}
          onPress={() => { if (!puedeGuardar) return; onGuardar({ provincia, distrito, corregimiento, numeroCasa, comentario }); }}
          activeOpacity={puedeGuardar ? 0.85 : 1}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#0D1B3E" />
          <Text style={styles.btnPrimaryText}>Guardar dirección</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Formulario de ruta (conductor) ──────────────────────────────────────────
function FormularioRuta({ cuentasGuardadas, onGuardarNuevaCuenta, onPublicar, onCancelar }) {
  // Estados de los campos de la ruta
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState('');
  const [mostrarModalEscuelas, setMostrarModalEscuelas] = useState(false); // Control para la lista desplegable
  const [zonasTexto, setZonasTexto] = useState('');
  const [tarifaMensual, setTarifaMensual] = useState(''); // Estado para el Input de Tarifa

  // Estados para la información bancaria (Wallet de referencia)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(cuentasGuardadas[0] || null);
  const [modoNuevaCuenta, setModoNuevaCuenta] = useState(cuentasGuardadas.length === 0);
  const [nombreTitular, setNombreTitular] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [bancoNombre, setBancoNombre] = useState('Banco General');

  const manejarPublicar = () => {
    if (!escuelaSeleccionada || !zonasTexto || !tarifaMensual) {
      Alert.alert("Campos incompletos", "Por favor llena todos los campos de la ruta.");
      return;
    }

    // Convertir el texto libre en arreglo usando las comas
    const arregloZonas = zonasTexto
      .split(',')
      .map(zona => zona.trim())
      .filter(zona => zona.length > 0);

    if (arregloZonas.length === 0) {
      Alert.alert("Zonas inválidas", "Escribe al menos una zona de servicio.");
      return;
    }

    // Procesar información bancaria
    let datosBancariosFinales = cuentaSeleccionada;

    if (modoNuevaCuenta) {
      if (!nombreTitular || !numeroCuenta) {
        Alert.alert("Información Bancaria", "Por favor introduce los datos de tu cuenta para recibir los pagos.");
        return;
      }
      const nuevaCta = {
        id: Date.now().toString(),
        nombre: nombreTitular,
        numero: numeroCuenta,
        banco: bancoNombre
      };
      onGuardarNuevaCuenta(nuevaCta);
      datosBancariosFinales = nuevaCta;
    }

    // Publicar hacia el estado global de rutas
    onPublicar({
      id: Date.now().toString(),
      escuela: escuelaSeleccionada,
      zonas: arregloZonas, // Almacenado como arreglo para renderizar los chips celestes
      tarifa: parseInt(tarifaMensual) || 0,
      alumnos: 0,
      activa: true,
      bancoAsociado: datosBancariosFinales
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Crear Nueva Ruta de Servicio</Text>
        <Text style={styles.sectionSub}>Completa los detalles de tu oferta de transporte</Text>

        {/* 1. ESCUELA (LISTA DESPLEGABLE / DROPDOWN MODAL) */}
        <Text style={styles.inputLabel}>Escuela de Destino</Text>
        <TouchableOpacity 
          style={styles.dropdownSelector} 
          onPress={() => setMostrarModalEscuelas(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownSelectorText, !escuelaSeleccionada && { color: '#aaa' }]}>
            {escuelaSeleccionada || "Selecciona una escuela de la lista..."}
          </Text>
          <Ionicons name="chevron-down-outline" size={18} color="#0D1B3E" />
        </TouchableOpacity>

        {/* 2. ZONAS DE COBERTURA (INPUT TEXT LIBRE - SEPARADO POR COMAS) */}
        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Zonas de Cobertura</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Ej. Arraiján, Vista Alegre, Nuevo Arraiján"
          placeholderTextColor="#aaa"
          value={zonasTexto}
          onChangeText={setZonasTexto}
        />
        <Text style={styles.mapaNote}>Separa cada zona con una coma (,)</Text>

        {/* 3. TARIFA MENSUAL (INPUT NUMÉRICO) */}
        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Tarifa Mensual por Estudiante </Text>
        <TextInput
          style={styles.formInput}
          placeholder="Ej. 75"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={tarifaMensual}
          onChangeText={setTarifaMensual}
        />

        <View style={{ height: 1, backgroundColor: '#E3ECF7', marginVertical: 20 }} />

        {/* 4. SECCIÓN INFORMACIÓN BANCARIA */}
        <Text style={styles.sectionTitle}>Información de Cobros (ACH)</Text>
        <Text style={styles.sectionSub}>Cuenta de referencia donde los padres pagarán la mensualidad</Text>

        {!modoNuevaCuenta && cuentasGuardadas.length > 0 ? (
          <View style={styles.bancoContainer}>
            <Text style={{ fontSize: 11, color: '#888', fontWeight: 'bold', marginBottom: 6 }}>CUENTA SELECCIONADA PARA ESTA RUTA:</Text>
            {cuentasGuardadas.map((cta) => {
              const esMarcada = cuentaSeleccionada?.id === cta.id;
              return (
                <TouchableOpacity 
                  key={cta.id}
                  style={[styles.tarjetaBancoBox, esMarcada && styles.tarjetaBancoBoxActiva]}
                  onPress={() => { setCuentaSeleccionada(cta); setModoNuevaCuenta(false); }}
                >
                  <Ionicons name="wallet-outline" size={22} color={esMarcada ? '#0D1B3E' : '#888'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.tarjetaBancoNombre}>{cta.nombre}</Text>
                    <Text style={styles.tarjetaBancoNumero}>{cta.banco} • No. {cta.numero}</Text>
                  </View>
                  <Ionicons 
                    name={esMarcada ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={esMarcada ? "#0D1B3E" : "#ccc"} 
                  />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.btnAgregarOtraCuenta} onPress={() => {
              // Limpiamos los campos al querer agregar otra
              setNombreTitular('');
              setNumeroCuenta('');
              setModoNuevaCuenta(true);
            }}>
              <Ionicons name="add-circle-outline" size={16} color="#00AEEF" />
              <Text style={styles.btnAgregarOtraCuentaText}>Registrar una cuenta nueva</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bancoFormBox}>
            <Text style={styles.inputLabel}>Nombre del Banco</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej. Banco General, Banistmo"
              placeholderTextColor="#aaa"
              value={bancoNombre}
              onChangeText={setBancoNombre}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Nombre del Titular</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej. Carlos Mendoza"
              placeholderTextColor="#aaa"
              value={nombreTitular}
              onChangeText={setNombreTitular}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Número de Cuenta</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej. 0372012345"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={numeroCuenta}
              onChangeText={setNumeroCuenta}
            />

            {/* NUEVO: Botón de confirmación e inclusión inmediata a la Wallet visual */}
            <TouchableOpacity 
              style={styles.btnConfirmarNuevaCta} 
              onPress={() => {
                if (!nombreTitular || !numeroCuenta || !bancoNombre) {
                  Alert.alert("Campos Vacíos", "Por favor completa los datos de la cuenta bancaria.");
                  return;
                }
                const nuevaCta = {
                  id: Date.now().toString(),
                  nombre: nombreTitular,
                  numero: numeroCuenta,
                  banco: bancoNombre
                };
                // Guardamos en el estado general del componente superior
                onGuardarNuevaCuenta(nuevaCta);
                // La dejamos seleccionada por defecto
                setCuentaSeleccionada(nuevaCta);
                // Apagamos el modo formulario para regresar a la billetera visual
                setModoNuevaCuenta(false);
              }}
            >
              <Ionicons name="checkmark-done-outline" size={16} color="#FFF" />
              <Text style={styles.btnConfirmarNuevaCtaText}>Confirmar y Añadir Cuenta</Text>
            </TouchableOpacity>

            {cuentasGuardadas.length > 0 && (
              <TouchableOpacity style={styles.btnCancelarNuevaCta} onPress={() => setModoNuevaCuenta(false)}>
                <Text style={styles.btnCancelarNuevaCtaText}>Volver a tus cuentas guardadas</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Botones de Guardado / Cancelado */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 30, marginBottom: 40 }}>
          <TouchableOpacity style={[styles.btnPrimary, { flex: 2 }]} onPress={manejarPublicar}>
            <Text style={styles.btnPrimaryText}>Publicar Ruta</Text>
          </TouchableOpacity>
        </View>

        {/* COMPONENTE DROPDOWN (MODAL SELECCIONADOR DE ESCUELAS) */}
        <Modal visible={mostrarModalEscuelas} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownModalContent}>
              <Text style={[styles.sectionTitle, { marginBottom: 12, paddingHorizontal: 10 }]}>Selecciona una Escuela</Text>
              <FlatList
                data={ESCUELAS_LISTA}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={() => {
                      setEscuelaSeleccionada(item);
                      setMostrarModalEscuelas(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                    {escuelaSeleccionada === item && <Ionicons name="checkmark" size={16} color="#0D1B3E" />}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.btnCerrarModal} onPress={() => setMostrarModalEscuelas(false)}>
                <Text style={styles.btnCerrarModalText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );

}

// ─── Card de conductor ────────────────────────────────────────────────────────
function CardConductor({ conductor, onSolicitar }) {
  const stars = Math.round(conductor.rating);
  return (
    <View style={styles.conductorCard}>
      <View style={styles.conductorCardTop}>
        <View style={styles.conductorAvatar}>
          <Text style={styles.conductorAvatarText}>{conductor.nombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.conductorNombre}>{conductor.nombre}</Text>
            {conductor.verificado && (
              <View style={styles.verificadoBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#0D1B3E" />
                <Text style={styles.verificadoText}>Verificado</Text>
              </View>
            )}
          </View>
          <Text style={styles.conductorVehiculo}>{conductor.vehiculo}</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= stars ? 'star' : 'star-outline'} size={13} color="#FFD700" />
            ))}
            <Text style={styles.ratingTexto}>{conductor.rating} ({conductor.reviews} reseñas)</Text>
          </View>
        </View>
        <View style={styles.tarifaBox}>
          <Text style={styles.tarifaNum}>${conductor.tarifa}</Text>
          <Text style={styles.tarifaMes}>/mes</Text>
        </View>
      </View>
      <View style={styles.conductorCardDivider} />
      <View style={styles.conductorTags}>
        {conductor.escuelas.map(e => (
          <View key={e} style={styles.tagEscuela}>
            <Ionicons name="school-outline" size={11} color="#0D1B3E" />
            <Text style={styles.tagText}>{e}</Text>
          </View>
        ))}
        {conductor.zonas.map(z => (
          <View key={z} style={styles.tagZona}>
            <Ionicons name="location-outline" size={11} color="#00AEEF" />
            <Text style={[styles.tagText, { color: '#00AEEF' }]}>{z}</Text>
          </View>
        ))}
      </View>
      <View style={styles.conductorCardFooter}>
        <View style={styles.plazaInfo}>
          <Ionicons name="people-outline" size={14} color="#888" />
          <Text style={styles.plazaTexto}>{conductor.plazasDisponibles} plaza{conductor.plazasDisponibles !== 1 ? 's' : ''} disponible{conductor.plazasDisponibles !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.btnSolicitar} onPress={onSolicitar} activeOpacity={0.85}>
          <Text style={styles.btnSolicitarText}>Solicitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Card de ruta ─────────────────────────────────────────────────────────────
function CardRuta({ ruta }) {
  return (
    <View style={styles.rutaCard}>
      <View style={styles.rutaCardLeft}>
        <View style={[styles.rutaEstadoBullet, ruta.activa && styles.rutaEstadoActivo]} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.rutaEscuela}>{ruta.escuela}</Text>
          <View style={[styles.rutaEstadoBadge, ruta.activa && styles.rutaEstadoBadgeActiva]}>
            <Text style={[styles.rutaEstadoTexto, ruta.activa && styles.rutaEstadoTextoActivo]}>
              {ruta.activa ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {ruta.zonas.map(z => (
            <View key={z} style={styles.tagZona}>
              <Ionicons name="location-outline" size={11} color="#00AEEF" />
              <Text style={[styles.tagText, { color: '#00AEEF' }]}>{z}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rutaStats}>
          <Ionicons name="people-outline" size={14} color="#888" />
          <Text style={styles.rutaStatsText}>{ruta.alumnos} alumno{ruta.alumnos !== 1 ? 's' : ''} registrado{ruta.alumnos !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.rutaMenuBtn}>
        <Ionicons name="ellipsis-vertical-outline" size={18} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ insets, onLogout }) {
  const tabs = [
    { icon: 'home-outline', label: 'Inicio' },
    { icon: 'map-outline', label: 'Viaje', active: true },
    { icon: 'notifications-outline', label: 'Avisos' },
    { icon: 'log-out-outline', label: 'Salir', onPress: onLogout, isLogout: true },
  ];
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
      {tabs.map((tab, i) => (
        <Pressable key={i} style={styles.tab} onPress={tab.onPress}>
          {({ pressed }) => (
            <>
              <View style={tab.active || (tab.isLogout && pressed) ? styles.tabIconWrapActive : styles.tabIconWrap}>
                <Ionicons name={tab.icon} size={20} color={tab.active || (tab.isLogout && pressed) ? '#0D1B3E' : '#aaa'} />
              </View>
              <Text style={tab.active || (tab.isLogout && pressed) ? styles.tabLabelActive : styles.tabLabel}>
                {tab.label}
              </Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B3E' },

  header: { backgroundColor: '#0D1B3E', paddingTop: 8, paddingBottom: 28, paddingHorizontal: '6%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  body: { flexGrow: 1, paddingHorizontal: '6%', paddingTop: 24, paddingBottom: 24 },

  // Tabs internos
  tabsInternos: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E3ECF7',
    backgroundColor: '#fff',
    paddingHorizontal: '6%',
  },
  tabInterno: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabInternoActivo: { borderBottomColor: '#0D1B3E' },
  tabInternoText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  tabInternoTextActivo: { color: '#0D1B3E', fontWeight: '700' },

  // Badge contador
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FFD700',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0D1B3E' },

  // Setup
  setupContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '10%', paddingBottom: 40 },
  setupIconBig: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#F0F5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#E3ECF7' },
  setupTitle: { fontSize: 22, fontWeight: 'bold', color: '#0D1B3E', textAlign: 'center', marginBottom: 12 },
  setupDesc: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 21, marginBottom: 32 },

  // Botones
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 28, marginTop: 8 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  btnDisabled: { opacity: 0.4 },
  btnBack: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start' },
  btnBackText: { fontSize: 14, color: '#0D1B3E', fontWeight: '600' },

  btnWhatsapp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', borderRadius: 16, paddingVertical: 15, marginTop: 16 },
  btnWhatsappText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnWhatsappTextDisabled: { color: '#aaa' },
  hintText: { textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 10 },

  // Formulario
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 6 },
  formDesc: { fontSize: 13, color: '#888', marginBottom: 22, lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#0D1B3E', marginBottom: 8 },
  opcional: { color: '#aaa', fontWeight: '400' },
  input: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0D1B3E', marginBottom: 14 },
  inputMultiline: { height: 80, paddingTop: 12 },

  modoToggle: { flexDirection: 'row', backgroundColor: '#F5F8FC', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1.5, borderColor: '#E3ECF7' },
  modoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  modoBtnActive: { backgroundColor: '#fff', shadowColor: '#0D1B3E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modoBtnText: { fontSize: 13, color: '#888', fontWeight: '500' },
  modoBtnTextActive: { color: '#0D1B3E', fontWeight: '700' },

  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  dropdownDisabled: { opacity: 0.5 },
  dropdownText: { fontSize: 14, color: '#0D1B3E' },
  dropdownPlaceholder: { color: '#aaa' },
  dropdownList: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, marginTop: 4, overflow: 'hidden', shadowColor: '#0D1B3E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 14 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  dropdownItemActive: { backgroundColor: '#F0F5FF' },
  dropdownItemText: { fontSize: 14, color: '#444' },
  dropdownItemTextActive: { color: '#0D1B3E', fontWeight: '600' },

  mapaPlaceholder: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  mapaPlaceholderTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B3E', marginTop: 12, marginBottom: 6 },
  mapaPlaceholderDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  mapaSimulado: { width: '100%', height: 130, backgroundColor: '#D9E8D4', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#B8D4B2' },
  coordsTexto: { fontSize: 11, color: '#555', textAlign: 'center' },
  mapaNote: { fontSize: 11, color: '#aaa', textAlign: 'center', fontStyle: 'italic', marginTop: 6 },

  // Búsqueda
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 14, color: '#0D1B3E' },

  // Sección
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Ubicación sin fondo celeste
  ubicacionSimple: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  ubicacionIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  ubicacionLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  ubicacionTexto: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },
  cambiarLink: { fontSize: 12, color: '#00AEEF', fontWeight: '600' },

  // Conductor card
  conductorCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 14 },
  conductorCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  conductorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  conductorAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  conductorNombre: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  conductorVehiculo: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 4 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingTexto: { fontSize: 11, color: '#888', marginLeft: 4 },
  verificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFD700', borderRadius: 20, paddingVertical: 2, paddingHorizontal: 7 },
  verificadoText: { fontSize: 10, fontWeight: '700', color: '#0D1B3E' },
  tarifaBox: { alignItems: 'flex-end' },
  tarifaNum: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E' },
  tarifaMes: { fontSize: 11, color: '#888' },
  conductorCardDivider: { height: 1, backgroundColor: '#E3ECF7', marginBottom: 12 },
  conductorTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagEscuela: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F0FE', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  tagZona: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8FF', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 11, fontWeight: '600', color: '#0D1B3E' },
  conductorCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plazaInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  plazaTexto: { fontSize: 12, color: '#888' },
  btnSolicitar: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  btnSolicitarText: { fontSize: 12, fontWeight: '700', color: '#0D1B3E' },

  // Pantalla de solicitud - resumen
  resumenCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', paddingVertical: 4, paddingHorizontal: 14 },
  resumenCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF3F9' },
  divider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 2 },
  filaDato: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  filaIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center' },
  filaLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  filaValor: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },

  // Hijos
  hijosLista: { gap: 10 },
  hijoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 14 },
  hijoCardActivo: { backgroundColor: '#FFF8DC', borderColor: '#FFD700' },
  hijoAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3ECF7', alignItems: 'center', justifyContent: 'center' },
  hijoAvatarActivo: { backgroundColor: '#FFD700' },
  hijoAvatarText: { fontSize: 15, fontWeight: 'bold', color: '#888' },
  hijoAvatarTextActivo: { color: '#0D1B3E' },
  hijoNombre: { fontSize: 15, fontWeight: '700', color: '#0D1B3E', flex: 1 },
  hijoNombreActivo: { color: '#0D1B3E' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C8D6E5', alignItems: 'center', justifyContent: 'center' },
  radioCircleActivo: { borderColor: '#0D1B3E' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#0D1B3E' },

  emptyHijos: { alignItems: 'center', backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 28, gap: 8 },
  emptyHijosTitle: { fontSize: 15, fontWeight: '700', color: '#888' },
  emptyHijosDesc: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 18 },

  notaBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0FAFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#D0EEFF', marginTop: 20, marginBottom: 4 },
  notaText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },

  // Tarjetas de solicitud
  solicitudCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 12 },
  solicitudCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  hijoAvatarSol: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3ECF7', alignItems: 'center', justifyContent: 'center' },
  hijoAvatarSolText: { fontSize: 16, fontWeight: 'bold', color: '#0D1B3E' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  estadoBadgeText: { fontSize: 11, fontWeight: '700' },
  solicitudInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E3ECF7' },
  infoChipText: { fontSize: 11, color: '#555', fontWeight: '500' },

  // Acciones conductor
  accionesRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnRechazar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DC2626' },
  btnRechazarText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  btnAceptar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFD700' },
  btnAceptarText: { fontSize: 13, fontWeight: '700', color: '#0D1B3E' },

  // Card ruta
  rutaCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 16, marginBottom: 14 },
  rutaCardLeft: { paddingTop: 3 },
  rutaEstadoBullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ccc' },
  rutaEstadoActivo: { backgroundColor: '#25D366' },
  rutaEscuela: { fontSize: 15, fontWeight: '700', color: '#0D1B3E', flex: 1 },
  rutaEstadoBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#F0F0F0' },
  rutaEstadoBadgeActiva: { backgroundColor: '#E6F9EE' },
  rutaEstadoTexto: { fontSize: 11, fontWeight: '600', color: '#888' },
  rutaEstadoTextoActivo: { color: '#1A8C44' },
  rutaStats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  rutaStatsText: { fontSize: 12, color: '#888' },
  rutaMenuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3ECF7' },

  headerAccion: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  btnNuevaRuta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, marginTop: 2 },
  btnNuevaRutaText: { fontSize: 13, fontWeight: '700', color: '#0D1B3E' },

  zonasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  zonaChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#E3ECF7', backgroundColor: '#F5F8FC' },
  zonaChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  zonaChipText: { fontSize: 13, color: '#888', fontWeight: '500' },
  zonaChipTextActive: { color: '#0D1B3E', fontWeight: '700' },
  seleccionResumen: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  seleccionResumenText: { fontSize: 13, color: '#00AEEF', fontWeight: '600' },
  notaPublicacion: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0FAFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#D0EEFF', marginBottom: 20 },
  notaPublicacionText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#888', marginTop: 12, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#aaa', textAlign: 'center' },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tab: { flex: 1, alignItems: 'center', borderRadius: 16, paddingVertical: 4 },
  tabIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, color: '#aaa', marginTop: 4 },
  tabLabelActive: { fontSize: 11, color: '#0D1B3E', fontWeight: 'bold', marginTop: 4 },

  // Formulario e Inputs de Ruta
  formInput: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0D1B3E', marginTop: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E' },

  // Dropdown de Escuelas (Modal)
  dropdownSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginTop: 6 },
  dropdownSelectorText: { fontSize: 14, color: '#0D1B3E', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  dropdownModalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 18, maxHeight: '60%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E3ECF7' },
  dropdownItemText: { fontSize: 14, color: '#0D1B3E' },
  btnCerrarModal: { alignItems: 'center', backgroundColor: '#0D1B3E', borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  btnCerrarModalText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Sección de Información Bancaria (Wallet)
  bancoContainer: { backgroundColor: '#FFF', marginTop: 8 },
  tarjetaBancoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E3ECF7', borderRadius: 14, padding: 14, marginBottom: 10 },
  tarjetaBancoBoxActiva: { borderColor: '#FFD700', backgroundColor: '#FFFDE6' },
  tarjetaBancoNombre: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  tarjetaBancoNumero: { fontSize: 12, color: '#666', marginTop: 2 },
  btnAgregarOtraCuenta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  btnAgregarOtraCuentaText: { fontSize: 13, color: '#00AEEF', fontWeight: '600' },
  bancoFormBox: { backgroundColor: '#FAFCFF', borderWidth: 1, borderColor: '#D0E0F8', borderRadius: 16, padding: 14, marginTop: 10 },
  btnCancelarNuevaCta: { alignItems: 'center', paddingVertical: 10, marginTop: 6 },
  btnCancelarNuevaCtaText: { fontSize: 12, color: '#888', fontWeight: '600', textDecorationLine: 'underline' },
  btnConfirmarNuevaCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#00AEEF', borderRadius: 10, paddingVertical: 10, marginTop: 14 },
  btnConfirmarNuevaCtaText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  detalleNavHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFF' },
  btnVolverDetalle: { flexDirection: 'row', alignItems: 'center' },
  detalleTitleHeader: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0D1B3E', textAlign: 'center', marginRight: 55 },
  tablaHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  colTituloOrden: { fontSize: 13, fontWeight: '700', color: '#888', width: 44, textAlign: 'center' },
  colTituloEstudiante: { fontSize: 13, fontWeight: '700', color: '#888', flex: 1, marginLeft: 12 },
  btnEditarOrdenToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD700', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnEditarOrdenToggleText: { fontSize: 12, fontWeight: '700', color: '#0D1B3E' },
  filaEstudianteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E3ECF7', borderRadius: 12, padding: 12, marginBottom: 8 },
  colCajaOrden: { width: 40, alignItems: 'center' },
  inputOrdenNumerico: { width: 34, height: 34, backgroundColor: '#EAEFF5', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#0D1B3E', padding: 0 },
  inputOrdenNumericoActivo: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FFD700' },
  nombreEstudianteFila: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  subtextEstudianteFila: { fontSize: 12, color: '#666', marginTop: 2 },
  btnIniciarViajeAccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 14, marginTop: 20 },
  btnIniciarViajeAccionText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
});