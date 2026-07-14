import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, StatusBar, Alert,
  ScrollView, useWindowDimensions, TextInput,
  KeyboardAvoidingView, Platform, Linking, Modal,
  FlatList, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';
import MapView, { Marker } from 'react-native-maps';

const PROVINCIAS = [
  'Panamá', 'Panamá Oeste', 'Colón', 'Coclé', 'Veraguas',
  'Herrera', 'Los Santos', 'Chiriquí', 'Bocas del Toro', 'Darién',
  'Emberá-Wounaan', 'Guna Yala', 'Ngäbe-Buglé',
];

const DISTRITOS = {
  'Panamá':           ['Panamá', 'San Miguelito', 'Chepo', 'Balboa', 'Chimán', 'Taboga'],
  'Panamá Oeste':     ['Arraiján', 'La Chorrera', 'Capira', 'Chame', 'San Carlos'],
  'Colón':            ['Colón', 'Portobelo', 'Santa Isabel', 'Donoso', 'Chagres', 'Omar Torrijos Herrera'],
  'Coclé':            ['Penonomé', 'Aguadulce', 'Natá', 'Olá', 'La Pintada', 'Antón'],
  'Veraguas':         ['Santiago', 'Soná', 'Calobre', 'Cañazas', 'La Mesa', 'Atalaya', 'Montijo', 'Río de Jesús', 'Las Palmas', 'San Francisco', 'Santa Fe', 'Mariato'],
  'Herrera':          ['Chitré', 'Ocú', 'Parita', 'Pesé', 'Santa María', 'Las Minas', 'Los Pozos'],
  'Los Santos':       ['Las Tablas', 'Guararé', 'Los Santos', 'Macaracas', 'Pedasí', 'Pocrí', 'Tonosí', 'Villalba'],
  'Chiriquí':         ['David', 'Boquete', 'Bugaba', 'Alanje', 'Barú', 'Boquerón', 'Dolega', 'Gualaca', 'Remedios', 'Renacimiento', 'San Félix', 'San Lorenzo', 'Tierras Altas', 'Tolé'],
  'Bocas del Toro':   ['Bocas del Toro', 'Changuinola', 'Chiriquí Grande', 'Almirante'],
  'Darién':           ['La Palma', 'Chepigana', 'Pinogana', 'Sambú'],
  'Emberá-Wounaan':   ['Cémaco', 'Sambú'],
  'Guna Yala':        ['Guna Yala'],
  'Ngäbe-Buglé':      ['Besiko', 'Kankintú', 'Kusapín', 'Mironó', 'Müna', 'Ñürüm', 'Santa Catalina'],
};

const CORREGIMIENTOS = {
  // ── Panamá ──────────────────────────────────────────────────────────────
  'Panamá': [
    'Ancón', 'Bella Vista', 'Betania', 'Calidonia', 'Curundú',
    'El Chorrillo', 'Juan Díaz', 'Las Mañanitas', 'Parque Lefevre',
    'Pedregal', 'Pueblo Nuevo', 'Rio Abajo', 'San Felipe', 'San Francisco',
    'Santa Ana', 'Tocumen',
  ],
  'San Miguelito': [
    'Amelia Denis de Icaza', 'Belisario Frías', 'Belisario Porras',
    'José Domingo Espinar', 'Mateo Iturralde', 'Rufina Alfaro',
    'Victoriano Lorenzo',
  ],
  'Chepo':   ['Chepo', 'Cañita', 'Chepillo', 'El Llano', 'San Martín', 'Tortí'],
  'Balboa':  ['Balboa', 'Arraiján (Balboa)', 'La Esmeralda', 'Nuevo Emperador', 'Saboga'],
  'Chimán':  ['Chimán', 'Brujas', 'Gonzalo Vásquez', 'Ipetí', 'Majé', 'Unión Santeña'],
  'Taboga':  ['Taboga', 'Otoque Occidente', 'Otoque Oriente'],

  // ── Panamá Oeste ─────────────────────────────────────────────────────────
  'Arraiján': [
    'Vista Alegre', 'Nuevo Arraiján', 'Burunga',
    'Juan Demóstenes Arosemena', 'Veracruz', 'Cerro Silvestre',
    'Puerto Caimito',
  ],
  'La Chorrera': [
    'La Chorrera', 'Barrio Colón', 'El Arado', 'Herrera', 'Mendoza',
    'Guadalupe', 'Iglesitas', 'Iturralde', 'La Mitra', 'Obario',
    'Playa Leona',
  ],
  'Capira': [
    'Capira', 'Campana', 'Caimito', 'Cermeño', 'Cirí de Los Sotos',
    'Cirí Grande', 'El Chaparro', 'La Trinidad', 'Lídice', 'Majagual',
    'Villa Carmen',
  ],
  'Chame': [
    'Chame', 'Bejuco', 'El Líbano', 'Nueva Gorgona', 'Punta Chame',
  ],
  'San Carlos': [
    'San Carlos', 'El Espino', 'Hurtado', 'La Ermita', 'La Laguna',
    'Las Uvas', 'Río Congo', 'Río Congo Arriba',
  ],

  // ── Colón ────────────────────────────────────────────────────────────────
  'Colón': [
    'Barrio Norte', 'Barrio Sur', 'Buena Vista', 'Cativá', 'Cristóbal',
    'Escobal', 'Limón', 'Sabanitas', 'Salamanca',
  ],
  'Portobelo':              ['Portobelo', 'Garrote', 'Isla Grande', 'María Chiquita'],
  'Santa Isabel':           ['Palmira', 'Cuipo', 'El Eneal', 'Nombre de Dios', 'Palenque', 'Viento Frío'],
  'Donoso':                 ['Donoso', 'Coclé del Norte', 'El Guásimo', 'El Palmar', 'Río Indio'],
  'Chagres':                ['Chagres', 'Achiote', 'Nuevo Chagres', 'Palmas Bellas', 'Salud'],
  'Omar Torrijos Herrera':  ['Omar Torrijos Herrera', 'Ciricito', 'El Copé', 'Piedras Gordas', 'Río Indio'],

  // ── Coclé ────────────────────────────────────────────────────────────────
  'Penonomé': [
    'Penonomé', 'Cañaveral', 'Chiguirí Arriba', 'Coclé', 'El Chirú',
    'La Pintada', 'Pajonal', 'Río Grande', 'Toabré',
  ],
  'Aguadulce': ['Aguadulce', 'El Roble', 'Pocrí'],
  'Natá':      ['Natá', 'Capellanía', 'El Caño', 'Olá'],
  'Olá':       ['Olá', 'El Harino', 'Tulú'],
  'La Pintada':['La Pintada', 'Anón', 'Caño Sucio', 'El Cope', 'Llano Grande', 'Llano Iguana'],
  'Antón':     ['Antón', 'El Valle de Antón', 'Juan Díaz', 'Río Hato', 'San Juan de Dios'],

  // ── Veraguas ─────────────────────────────────────────────────────────────
  'Santiago': [
    'Santiago', 'Carlos Santana Ávila', 'Edwin Fábrega', 'La Colorada',
    'La Peña', 'La Raya de Santa María', 'Los Algarrobos', 'Ponuga',
    'San Pedro del Espino',
  ],
  'Soná':         ['Soná', 'Cañazas', 'El Marañón', 'Gobea', 'Hicaco', 'Quebro', 'Río de Jesús'],
  'Calobre':      ['Calobre', 'Chitra', 'El Bajo', 'La Laguna', 'Monjarás', 'San José'],
  'Cañazas':      ['Cañazas', 'El Aromillo', 'El Piro', 'Los Valles', 'Ñurín', 'San Bartolo'],
  'La Mesa':      ['La Mesa', 'Bisvalles', 'El Hato', 'El Potrero', 'Las Palmas', 'Urracá'],
  'Atalaya':      ['Atalaya', 'Los Hatillos', 'Ponuga', 'San Antonio'],
  'Montijo':      ['Montijo', 'Arenas', 'El Varal', 'Gobernadora', 'Leones', 'Pilón', 'Unión Chocó'],
  'Río de Jesús': ['Río de Jesús', 'Capellanía', 'El Pavo', 'San Marcelo'],
  'Las Palmas':   ['Las Palmas', 'Cerro de Casa', 'Corral Falso', 'Los Díaz', 'Pixvae', 'Puerto Vidal', 'Rodeo Viejo', 'San Martín de Porres', 'Viguí'],
  'San Francisco':['San Francisco', 'Corozal', 'El Picador', 'La Garceana', 'La Yeguada', 'Los Milagros'],
  'Santa Fe':     ['Santa Fe', 'Calovébora', 'El Alto', 'El Cuay', 'Gatuncito', 'Río Luis', 'Tute'],
  'Mariato':      ['Mariato', 'Arenas', 'Cébaco', 'Jesús María', 'Los Asientos', 'Tebario'],

  // ── Herrera ──────────────────────────────────────────────────────────────
  'Chitré':      ['Chitré', 'Llano Bonito', 'La Arena', 'Monagrillo', 'San Juan Bautista'],
  'Ocú':         ['Ocú', 'El Tijera', 'Llano de La Cruz', 'Llano Grande', 'Peñas Chatas'],
  'Parita':      ['Parita', 'El Rincón', 'Los Cerritos', 'París', 'Portobelillo'],
  'Pesé':        ['Pesé', 'Atalaya', 'La Cabima', 'La Garceana', 'Macaracas'],
  'Santa María': ['Santa María', 'Cerro Largo', 'El Calabacito', 'El Toro', 'Los Canelos', 'Quebrada del Rosario'],
  'Las Minas':   ['Las Minas', 'Cañas', 'El Ciruelo', 'El Pedregoso', 'Llano de Piedra'],
  'Los Pozos':   ['Los Pozos', 'Agua Buena', 'El Capurí', 'El Cedro', 'Las Guías Arriba'],

  // ── Los Santos ───────────────────────────────────────────────────────────
  'Las Tablas': [
    'Las Tablas', 'El Carate', 'El Cocal', 'El Manantial', 'Flores',
    'La Enea', 'La Laja', 'La Palma', 'La Tiza', 'Llano Abajo',
    'Los Asientos', 'Nuario', 'Palmira', 'Peña Blanca', 'Quebrada Seca',
    'Santo Domingo', 'Ureña',
  ],
  'Guararé':   ['Guararé', 'El Ejido', 'La Espigadilla', 'La Palma de Guararé', 'Las Palmitas', 'Monagrillo', 'Puerto Mensabé', 'Sabanagrande'],
  'Los Santos':['Los Santos', 'Llano Largo', 'Macaracas', 'Pedasí', 'Pocrí', 'Quia', 'Sabana Grande', 'Tonosí'],
  'Macaracas': ['Macaracas', 'Bahía Honda', 'El Cedro', 'El Cocobolo', 'Lajamina', 'Mogollón', 'San José'],
  'Pedasí':    ['Pedasí', 'Oria Arriba', 'Los Asientos'],
  'Pocrí':     ['Pocrí', 'La Palma', 'Paritilla'],
  'Tonosí':    ['Tonosí', 'Cañas', 'El Cortezo', 'El Muña', 'Los Asientos', 'Flores'],
  'Villalba':  ['Villalba', 'La Colorada', 'La Laja', 'Las Cruces'],

  // ── Chiriquí ─────────────────────────────────────────────────────────────
  'David': [
    'David', 'Burica', 'Las Lomas', 'Miraflores', 'Pedregal',
    'San Carlos', 'San Pablo Nuevo Abajo', 'San Pablo Viejo Abajo',
    'San Pablo Nuevo Arriba', 'San Pablo Viejo Arriba',
  ],
  'Boquete':      ['Boquete', 'Alto Boquete', 'Caldera', 'Cochea', 'Jaramillo', 'Los Naranjos', 'Palmira', 'Potrerillos'],
  'Bugaba':       ['Bugaba', 'Alanje', 'Candela', 'Cerro Punta', 'Gualaca', 'Jaramillo', 'La Concepción', 'Los Anastacios', 'Potrerillos', 'Rovira'],
  'Alanje':       ['Alanje', 'Cochea', 'Divalá', 'Guarumal', 'Los Anastacios', 'Paja de Sombrero', 'San Andrés'],
  'Barú':         ['Puerto Armuelles', 'Limones', 'Rodolfo Aguilar Delgado'],
  'Boquerón':     ['Boquerón', 'Chiriquí', 'La Estrella', 'Los Algarrobos', 'Palo Blanco', 'San Lorenzo'],
  'Dolega':       ['Dolega', 'Dos Ríos', 'Los Algarrobos', 'Potrerillos Abajo', 'Potrerillos Arriba', 'Rovira'],
  'Gualaca':      ['Gualaca', 'Chiriquí Grande', 'Dolega', 'Los Planes', 'Punta de Burica'],
  'Remedios':     ['Remedios', 'Las Lajas', 'Membrillo', 'Paja de Sombrero', 'San Félix'],
  'Renacimiento': ['Renacimiento', 'Cañas Gordas', 'Cerro Pelado', 'Guadalupe', 'Paso Canoa', 'Río Sereno'],
  'San Félix':    ['San Félix', 'Agua de Salud', 'Katíos', 'Punta de Burica', 'Tolé'],
  'San Lorenzo':  ['San Lorenzo', 'El Nancito', 'El Palmar', 'Horconcitos', 'San Lorenzo'],
  'Tierras Altas':['Cerro Punta', 'Bambito', 'Guadalupe', 'Hartmann', 'Jaramillo Arriba', 'Jaramillo Abajo', 'Nueva Suiza', 'Volcán'],
  'Tolé':         ['Tolé', 'Alto Caballero', 'Bella Vista', 'Cerro Viejo', 'Hato Culantro', 'Quebrada de Piedra'],

  // ── Bocas del Toro ───────────────────────────────────────────────────────
  'Bocas del Toro': ['Bocas del Toro', 'Bastimentos', 'Cauchero', 'Punta Laurel', 'Punta Manglares'],
  'Changuinola':    ['Changuinola', 'Almirante', 'Guabito', 'Las Tablas', 'Miramar', 'Palo Seco', 'Silencio', 'Teribe'],
  'Chiriquí Grande':['Chiriquí Grande', 'Bonyic', 'Miramar', 'Punta Peña', 'Rambala'],
  'Almirante':      ['Almirante', 'Changuinola', 'Guabito'],

  // ── Darién ───────────────────────────────────────────────────────────────
  'La Palma':  ['La Palma', 'Agua Fría', 'Camogantí', 'Cucunatí', 'El Balsas', 'El Salto', 'Metetí', 'Río Congo', 'Tucutí'],
  'Chepigana': ['La Palma', 'Garachiné', 'Jaqué', 'Metetí', 'Río Congo', 'Sambú', 'Taimatí', 'Tucutí', 'Vista Alegre'],
  'Pinogana':  ['El Real de Santa María', 'Boca de Cupe', 'Chepigana', 'Lajas Blancas', 'Paya', 'Pucuro', 'Yaviza'],
  'Sambú':     ['Sambú', 'La Chunga', 'Mogue', 'Río Balsa', 'Taimatí', 'Tucutí'],

  // ── Comarcas ─────────────────────────────────────────────────────────────
  'Emberá-Wounaan': ['Cémaco', 'Sambú'],
  'Guna Yala':      ['Guna Yala'],
  'Besiko':         ['Besiko'],
  'Kankintú':       ['Kankintú'],
  'Kusapín':        ['Kusapín'],
  'Mironó':         ['Mironó'],
  'Müna':           ['Müna'],
  'Ñürüm':          ['Ñürüm'],
  'Santa Catalina': ['Santa Catalina'],
};


// ─── Componente principal ─────────────────────────────────────────────────────
// La ubicación siempre llega como objeto desde Mongo (los subcampos son los que
// pueden ser null), así que no basta con chequear si `ubicacion` es truthy.
const normalizarUbicacion = (u) => (u && u.provincia && u.distrito && u.corregimiento) ? u : null;

export default function MarketplaceScreen({ navigation, route }) {
  const { usuario } = route.params;
  const insets = useSafeAreaInsets();
  const esPadre = usuario.tipo === 'padre';

  const [ubicacionGuardada, setUbicacionGuardada] = useState(normalizarUbicacion(usuario.ubicacion));
  const [conductores, setConductores] = useState([]);
  const [hijos, setHijos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (esPadre) {
        const [perfilRes, condRes, hijosRes, solicRes] = await Promise.all([
          api.get('/api/auth/perfil', { headers }),
          api.get('/api/conductor/disponibles', { headers }),
          api.get('/api/padre/mis-hijos', { headers }),
          api.get('/api/solicitudes/mis-solicitudes', { headers }),
        ]);
        setUbicacionGuardada(normalizarUbicacion(perfilRes.data?.usuario?.ubicacion));
        setConductores(condRes.data.conductores || []);
        setHijos(hijosRes.data.hijos || []);
        setSolicitudes(solicRes.data.solicitudes || []);
      } else {
        const [rutasRes, solicRes] = await Promise.all([
          api.get('/api/conductor/rutas', { headers }),
          api.get('/api/solicitudes/recibidas', { headers }),
        ]);
        setRutas(rutasRes.data.rutas || []);
        setSolicitudes(solicRes.data.solicitudes || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error.response?.data || error.message);
    } finally {
      setCargando(false);
    }
  }, [esPadre]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const actualizarSolicitudes = (nuevas) => {
    setSolicitudes(nuevas);
  };

  const agregarSolicitud = async (conductor, hijo, escuela, rutaId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post('/api/solicitudes', {
        conductor_id: conductor._id,
        hijos_ids: [hijo._id],
        tarifa_mensual: conductor.tarifa || 0,
        escuela,
        ruta_id: rutaId,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSolicitudes(prev => [res.data.solicitud, ...prev]);
      return true;
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar la solicitud');
      return false;
    }
  };

  const aceptarSolicitud = async (id, tarifa) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.patch(`/api/solicitudes/${id}/aceptar`, {
        tarifa_mensual: tarifa
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(prev => prev.map(s =>
        s._id === id ? { ...s, estado: 'aceptada', tarifa_mensual: tarifa } : s
      ));
      Alert.alert('Solicitud aceptada', 'El contrato ha sido creado exitosamente.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo aceptar la solicitud');
    }
  };

  const rechazarSolicitud = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await api.patch(`/api/solicitudes/${id}/rechazar`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(prev => prev.map(s =>
        s._id === id ? { ...s, estado: 'rechazada' } : s
      ));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo rechazar la solicitud');
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 80 }}>
          <ActivityIndicator size="large" color="#0D1B3E" />
          <Text style={{ marginTop: 12, color: '#888' }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
              onGuardarUbicacion={(u) => setUbicacionGuardada(normalizarUbicacion(u))}
              usuario={usuario}
              conductores={conductores}
              hijos={hijos}
              solicitudes={solicitudes}
              onAgregarSolicitud={agregarSolicitud}
              onRecargarConductores={cargarDatos}
            />
          ) : (
            <MarketplaceConductor
              navigation={navigation}
              usuario={usuario}
              rutas={rutas}
              solicitudes={solicitudes}
              onAceptarSolicitud={aceptarSolicitud}
              onRechazarSolicitud={rechazarSolicitud}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Vista PADRE ──────────────────────────────────────────────────────────────
function MarketplacePadre({ ubicacion, onGuardarUbicacion, usuario, conductores, hijos, solicitudes, onAgregarSolicitud, onRecargarConductores }) {
  const [tabActivo, setTabActivo] = useState('catalogo');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

  const conductoresMapeados = conductores.map(c => ({
    _id: c._id,
    nombre: c.nombre + ' ' + (c.apellido || ''),
    vehiculo: c.vehiculo ? `${c.vehiculo.marca || ''} ${c.vehiculo.modelo || ''} ${c.vehiculo.anio || ''}`.trim() || 'Vehículo registrado' : 'Sin vehículo',
    escuelas: [...new Set(c.rutas?.map(r => r.escuela).filter(Boolean) || [])],
    zonas: [...new Set(c.rutas?.map(r => r.zona).filter(Boolean) || [])],
    tarifa: c.tarifa || 0,
    rating: c.rating || 0,
    reviews: c.reviews || 0,
    plazasDisponibles: c.plazasDisponibles || 0,
    verificado: c.verificado || false,
    telefono: c.telefono || '',
    rutas: c.rutas || [],
  }));

  if (!ubicacion && !mostrarFormulario) {
    return <PantallaConfigUbicacion onComenzar={() => setMostrarFormulario(true)} />;
  }
  if (mostrarFormulario) {
    return (
      <FormularioUbicacion
        ubicacionInicial={modoEdicion ? ubicacion : null}
        onGuardar={(u) => { onGuardarUbicacion(u); setMostrarFormulario(false); setModoEdicion(false); onRecargarConductores(); }}
        onCancelar={() => { setMostrarFormulario(false); setModoEdicion(false); }}
      />
    );
  }

  if (conductorSeleccionado) {
    return (
      <PantallaSolicitud
        conductor={conductorSeleccionado}
        usuario={usuario}
        hijos={hijos}
        ubicacion={ubicacion}
        onEnviar={async (hijo, escuela, rutaId) => {
          const exito = await onAgregarSolicitud(conductorSeleccionado, hijo, escuela, rutaId);
          if (exito) {
            setConductorSeleccionado(null);
            setTabActivo('enviadas');
            return true;
          }
          return false;
        }}
        onCancelar={() => setConductorSeleccionado(null)}
      />
    );
  }

  const estaEnZona = (conductor, ubic) => {
    if (!ubic) return false;
    const normalizarTexto = (texto) => {
      if (!texto) return '';
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };
    
    const parentCorregimiento = normalizarTexto(ubic.corregimiento);
    const parentDistrito = normalizarTexto(ubic.distrito);
    
    return conductor.zonas.some(z => {
      const zonaNorm = normalizarTexto(z);
      return (
        zonaNorm === parentCorregimiento || 
        zonaNorm === parentDistrito ||
        parentCorregimiento.includes(zonaNorm) ||
        zonaNorm.includes(parentCorregimiento) ||
        parentDistrito.includes(zonaNorm) ||
        zonaNorm.includes(parentDistrito)
      );
    });
  };

  const conductoresFiltrados = conductoresMapeados.filter(c =>
    busqueda === '' ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.escuelas.some(e => e.toLowerCase().includes(busqueda.toLowerCase())) ||
    c.zonas.some(z => z.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const conductoresEnZona = conductoresFiltrados.filter(c => estaEnZona(c, ubicacion));
  const conductoresFueraDeZona = conductoresFiltrados.filter(c => !estaEnZona(c, ubicacion));

  return (
    <View style={{ flex: 1 }}>
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
          <View style={styles.ubicacionPreviewCard}>
            <View style={styles.ubicacionPreviewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-sharp" size={18} color="#0D1B3E" />
                <Text style={styles.ubicacionPreviewTitle}>Tu ubicación de recogida</Text>
              </View>
              <TouchableOpacity 
                style={styles.btnCambiarUbicacion} 
                onPress={() => { setModoEdicion(false); setMostrarFormulario(true); }}
              >
                <Ionicons name="create-outline" size={12} color="#0D1B3E" />
                <Text style={styles.btnCambiarUbicacionText}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ubicacionPreviewMapContainer}>
              <MapView
                style={StyleSheet.absoluteFillObject}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                region={{
                  latitude: Number(ubicacion?.lat) || 8.9833,
                  longitude: Number(ubicacion?.lng) || -79.5167,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: Number(ubicacion?.lat) || 8.9833,
                    longitude: Number(ubicacion?.lng) || -79.5167
                  }}
                  title="Mi ubicación"
                />
              </MapView>
            </View>

            <View style={styles.ubicacionPreviewDetails}>
              <Text style={styles.ubicacionPreviewTextMain}>
                {ubicacion?.corregimiento}, {ubicacion?.distrito}
              </Text>
              <Text style={styles.ubicacionPreviewTextSub}>
                Provincia: {ubicacion?.provincia}
              </Text>
              {ubicacion?.numero_casa ? (
                <Text style={styles.ubicacionPreviewTextSub}>
                  Casa/Apto: {ubicacion.numero_casa}
                </Text>
              ) : null}
              {ubicacion?.comentario ? (
                <Text style={styles.ubicacionPreviewTextSub} numberOfLines={2}>
                  Indicaciones: {ubicacion.comentario}
                </Text>
              ) : null}
            </View>
          </View>

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

          {conductoresFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bus-outline" size={40} color="#ccc" />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyDesc}>Intenta con otra escuela o zona.</Text>
            </View>
          ) : (
            <>
              {/* Conductores en tu zona */}
              {conductoresEnZona.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Conductores en tu zona</Text>
                  <Text style={styles.sectionSub}>{conductoresEnZona.length} conductor{conductoresEnZona.length !== 1 ? 'es' : ''} cerca de tu ubicación</Text>
                  {conductoresEnZona.map(conductor => (
                    <CardConductor
                      key={conductor._id}
                      conductor={conductor}
                      onSolicitar={() => setConductorSeleccionado(conductor)}
                    />
                  ))}
                </>
              ) : (
                <View style={styles.noConductoresZonaBox}>
                  <Ionicons name="alert-circle-outline" size={22} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noConductoresZonaTitle}>No hay conductores en tu zona</Text>
                    <Text style={styles.noConductoresZonaDesc}>
                      No encontramos conductores en {ubicacion?.corregimiento || ubicacion?.distrito}. A continuación se muestran opciones en otras áreas:
                    </Text>
                  </View>
                </View>
              )}

              {/* Conductores fuera de tu zona */}
              {conductoresFueraDeZona.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: conductoresEnZona.length > 0 ? 24 : 10 }]}>Conductores fuera de tu zona</Text>
                  <Text style={styles.sectionSub}>{conductoresFueraDeZona.length} conductor{conductoresFueraDeZona.length !== 1 ? 'es' : ''} disponible{conductoresFueraDeZona.length !== 1 ? 's' : ''} en otras áreas</Text>
                  {conductoresFueraDeZona.map(conductor => (
                    <CardConductor
                      key={conductor._id}
                      conductor={conductor}
                      onSolicitar={() => setConductorSeleccionado(conductor)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ListaSolicitudesEnviadas solicitudes={solicitudes} />
      )}
    </View>
  );
}

// ─── Pantalla de solicitud ────────────────────────────────────────────────────
function PantallaSolicitud({ conductor, usuario, hijos, ubicacion, onEnviar, onCancelar }) {
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(
    conductor.rutas && conductor.rutas.length > 0 ? conductor.rutas[0]._id : null
  );
  const [enviando, setEnviando] = useState(false);

  const hijoObj = hijos.find(h => h._id === hijoSeleccionado);
  const puedeEnviar = hijoSeleccionado !== null && rutaSeleccionada !== null && !enviando;

  const handleWhatsApp = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);

    try {
      const selectedRouteObj = conductor.rutas.find(r => r._id === rutaSeleccionada);
      const escuela = selectedRouteObj ? selectedRouteObj.escuela : (conductor.escuelas[0] || 'Escuela');
      
      const exito = await onEnviar(hijoObj, escuela, rutaSeleccionada);
      
      if (exito) {
        const mensaje =
          `Hola, buenas. Estoy interesado/a en su servicio de transporte escolar a través de BusWay. ` +
          `Mi nombre es *${usuario.nombre} ${usuario.apellido}* y me gustaría consultar la disponibilidad de ruta para mi hijo/a *${hijoObj.nombre}* hacia la escuela *${escuela}*. ` +
          `Quedo atento/a para coordinar los detalles. ¡Muchas gracias!`;

        const tel = conductor.telefono || '6603-2950';
        const num = tel.replace(/[^0-9]/g, '');
        const fullNum = num.startsWith('507') ? num : `507${num}`;
        const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(mensaje)}`;

        const soportado = await Linking.canOpenURL(url);
        if (soportado) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.body} 
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onCancelar} style={styles.btnBack}>
          <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
          <Text style={styles.btnBackText}>Volver al catálogo</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Confirmar solicitud</Text>
        <Text style={styles.formDesc}>
          Revisa la información antes de contactar al conductor.
        </Text>

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
          </View>
          <View style={styles.divider} />
          <FilaDatoCompacta icon="school-outline" label="Escuela" valor={conductor.escuelas[0]} />
          <FilaDatoCompacta icon="location-outline" label="Zonas" valor={conductor.zonas.join(', ')} last />
        </View>

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

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>¿Para cuál ruta?</Text>
        <Text style={styles.sectionSub}>Selecciona la ruta de este conductor en la que deseas inscribir a tu hijo.</Text>

        {!conductor.rutas || conductor.rutas.length === 0 ? (
          <View style={styles.emptyHijos}>
            <Ionicons name="bus-outline" size={32} color="#ccc" />
            <Text style={styles.emptyHijosTitle}>Sin rutas registradas</Text>
            <Text style={styles.emptyHijosDesc}>
              Este conductor no tiene rutas activas actualmente.
            </Text>
          </View>
        ) : (
          <View style={styles.hijosLista}>
            {conductor.rutas.map(rut => {
              const activo = rutaSeleccionada === rut._id;
              return (
                <TouchableOpacity
                  key={rut._id}
                  style={[styles.hijoCard, activo && styles.hijoCardActivo]}
                  onPress={() => setRutaSeleccionada(rut._id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.hijoAvatar, { backgroundColor: '#E3ECF7' }, activo && { backgroundColor: '#0D1B3E' }]}>
                    <Ionicons name="bus-outline" size={16} color={activo ? '#fff' : '#0D1B3E'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.hijoNombre, { marginBottom: 2 }, activo && styles.hijoNombreActivo]}>
                      {rut.nombre_ruta || rut.nombre}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#888' }}>
                      {rut.escuela} · {rut.zona}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, activo && styles.radioCircleActivo]}>
                    {activo && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>¿Para cuál hijo?</Text>
        <Text style={styles.sectionSub}>Selecciona quién recibirá este servicio.</Text>

        {hijos.length === 0 ? (
          <View style={styles.emptyHijos}>
            <Ionicons name="people-outline" size={32} color="#ccc" />
            <Text style={styles.emptyHijosTitle}>Sin hijos registrados</Text>
            <Text style={styles.emptyHijosDesc}>
              Primero agrega un hijo en Hijos y QR desde el Dashboard.
            </Text>
          </View>
        ) : (
          <View style={styles.hijosLista}>
            {hijos.map(hijo => {
              const activo = hijoSeleccionado === hijo._id;
              return (
                <TouchableOpacity
                  key={hijo._id}
                  style={[styles.hijoCard, activo && styles.hijoCardActivo]}
                  onPress={() => setHijoSeleccionado(hijo._id)}
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

        <TouchableOpacity
          style={[styles.btnWhatsapp, !puedeEnviar && styles.btnDisabled]}
          onPress={handleWhatsApp}
          activeOpacity={puedeEnviar ? 0.85 : 1}
          disabled={!puedeEnviar}
        >
          {enviando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={20} color={puedeEnviar ? '#fff' : '#aaa'} />
              <Text style={[styles.btnWhatsappText, !puedeEnviar && styles.btnWhatsappTextDisabled]}>
                Enviar Solicitud
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!puedeEnviar && hijos.length > 0 && (
          <Text style={styles.hintText}>Selecciona un hijo para continuar</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
        <CardSolicitudPadre key={sol._id} solicitud={sol} />
      ))}
    </ScrollView>
  );
}

function CardSolicitudPadre({ solicitud }) {
  const conductorNombre = solicitud.conductor_id?.nombre
    ? `${solicitud.conductor_id.nombre} ${solicitud.conductor_id.apellido || ''}`
    : 'Conductor';
  const hijosNombres = (solicitud.hijos_ids || []).map(h => h.nombre).join(', ') || 'Sin especificar';
  const fecha = solicitud.createdAt
    ? new Date(solicitud.createdAt).toLocaleDateString('es-PA')
    : new Date(solicitud.fecha_solicitud).toLocaleDateString('es-PA');

  const cfg = {
    pendiente:  { color: '#F59E0B', bg: '#FFF8E1', icono: 'time-outline',            texto: 'Pendiente' },
    aceptada:   { color: '#16A34A', bg: '#E6F9EE', icono: 'checkmark-circle-outline', texto: 'Aceptada'  },
    rechazada:  { color: '#DC2626', bg: '#FEE2E2', icono: 'close-circle-outline',     texto: 'Rechazada' },
  }[solicitud.estado];

  return (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudCardTop}>
        <View style={styles.conductorAvatar}>
          <Text style={styles.conductorAvatarText}>{conductorNombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.conductorNombre}>{conductorNombre}</Text>
          <Text style={styles.conductorVehiculo}>{solicitud.escuela}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icono} size={13} color={cfg.color} />
          <Text style={[styles.estadoBadgeText, { color: cfg.color }]}>{cfg.texto}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.solicitudInfo}>
        <InfoChip icon="person-outline" texto={`Hijo(s): ${hijosNombres}`} />
        <InfoChip icon="school-outline" texto={solicitud.escuela} />
        <InfoChip icon="card-outline" texto={`$${solicitud.tarifa_mensual}/mes`} />
        <InfoChip icon="calendar-outline" texto={fecha} />
      </View>
    </View>
  );
}

// ─── Vista CONDUCTOR ──────────────────────────────────────────────────────────
function MarketplaceConductor({ navigation, usuario, rutas, solicitudes, onAceptarSolicitud, onRechazarSolicitud }) {
  const [tabActivo, setTabActivo] = useState('rutas');
  const [rutaDetalle, setRutaDetalle] = useState(null);

  const [modalAceptarVisible, setModalAceptarVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [tarifaAceptar, setTarifaAceptar] = useState('');
  const [guardandoTarifa, setGuardandoTarifa] = useState(false);

  const iniciarAceptar = (sol) => {
    setSolicitudSeleccionada(sol);
    setTarifaAceptar(sol.tarifa_mensual ? sol.tarifa_mensual.toString() : '');
    setModalAceptarVisible(true);
  };

  const ejecutarAceptar = async () => {
    if (!tarifaAceptar.trim() || isNaN(tarifaAceptar) || parseFloat(tarifaAceptar) < 0) {
      Alert.alert('Tarifa inválida', 'Por favor ingresa una tarifa mensual válida.');
      return;
    }
    setGuardandoTarifa(true);
    try {
      await onAceptarSolicitud(solicitudSeleccionada._id, parseFloat(tarifaAceptar));
      setModalAceptarVisible(false);
    } catch (err) {
      console.log('Error accepting solicitud:', err);
    } finally {
      setGuardandoTarifa(false);
    }
  };

  const rutasMapeadas = rutas.map(r => ({
    _id: r._id,
    escuela: r.escuela,
    zona: r.zona,
    zonas: r.zona ? [r.zona] : [],
    alumnos: r.totalEstudiantes !== undefined ? r.totalEstudiantes : (r.alumnos || 0),
    activa: r.estado === 'activa',
  }));

  if (rutaDetalle) {
    return (
      <DetalleRutaConductor 
        ruta={rutaDetalle} 
        onVolver={() => setRutaDetalle(null)}
        navigation={navigation}
        usuario={usuario}
      />
    );
  }

  if (rutas.length === 0) {
    return <PantallaConfigRuta onIrARutas={() => navigation.navigate('Ruta', { usuario })} />;
  }

  return (
    <View style={{ flex: 1 }}>
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
            <TouchableOpacity style={styles.btnNuevaRuta} onPress={() => navigation.navigate('Ruta', { usuario })}>
              <Ionicons name="add-outline" size={18} color="#0D1B3E" />
              <Text style={styles.btnNuevaRutaText}>Nueva ruta</Text>
            </TouchableOpacity>
          </View>

          {rutasMapeadas.map((ruta, i) => (
            <TouchableOpacity key={ruta._id ?? i} onPress={() => setRutaDetalle(ruta)} activeOpacity={0.85}>
              <CardRuta ruta={ruta} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ListaSolicitudesRecibidas
          solicitudes={solicitudes}
          onAceptar={iniciarAceptar}
          onRechazar={onRechazarSolicitud}
        />
      )}

      {/* Modal para ingresar/confirmar Tarifa al Aceptar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalAceptarVisible}
        onRequestClose={() => setModalAceptarVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Aceptar Solicitud</Text>
              
              {solicitudSeleccionada && (
                <Text style={styles.modalSub}>
                  Establece o ajusta la tarifa mensual para la solicitud de{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {solicitudSeleccionada.padre_id?.nombre} {solicitudSeleccionada.padre_id?.apellido || ''}
                  </Text>
                  :
                </Text>
              )}

              <Text style={styles.sectionTitle}>Tarifa mensual ($)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. 75"
                placeholderTextColor="#aaa"
                value={tarifaAceptar}
                onChangeText={setTarifaAceptar}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.btnModalCancelar}
                  onPress={() => setModalAceptarVisible(false)}
                  disabled={guardandoTarifa}
                >
                  <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnModalGuardar}
                  onPress={ejecutarAceptar}
                  disabled={guardandoTarifa}
                >
                  {guardandoTarifa ? (
                    <ActivityIndicator size="small" color="#0D1B3E" />
                  ) : (
                    <Text style={styles.btnModalGuardarText}>Aceptar y Contratar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Detalles del card de la ruta (conductor) ──────────────────────────────────
function DetalleRutaConductor({ ruta, onVolver, navigation, usuario }) {
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await api.get('/api/conductor/estudiantes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.estudiantes || [];
        const filtrados = data
          .filter(e => e.ruta_id && e.ruta_id._id === ruta._id)
          .map((e, index) => ({
            id: e._id,
            nombre: e.nombre,
            escuela: e.ruta_id.escuela || ruta.escuela,
            zona: e.ruta_id.zona || ruta.zonas?.[0] || 'Sin zona',
            inputPos: (index + 1).toString()
          }));
          
        setEstudiantes(filtrados);
      } catch (error) {
        console.error('Error cargando estudiantes de la ruta:', error);
        Alert.alert('Error', 'No se pudieron cargar los estudiantes de esta ruta');
      } finally {
        setCargando(false);
      }
    };
    fetchEstudiantes();
  }, [ruta._id]);

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

        {cargando ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0D1B3E" />
            <Text style={{ marginTop: 10, color: '#888' }}>Cargando estudiantes...</Text>
          </View>
        ) : (
          <>
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
              onPress={() => navigation.navigate('Viaje', { usuario })}
            >
              <Ionicons name="play" size={16} color="#0D1B3E" />
              <Text style={styles.btnIniciarViajeAccionText}>Iniciar Ruta en Tiempo Real</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// ─── Lista de solicitudes recibidas (conductor) ───────────────────────────────
function ListaSolicitudesRecibidas({ solicitudes, onAceptar, onRechazar }) {
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
          key={sol._id}
          solicitud={sol}
          onAceptar={() => onAceptar(sol)}
          onRechazar={() => onRechazar(sol._id)}
        />
      ))}
    </ScrollView>
  );
}

function CardSolicitudConductor({ solicitud, onAceptar, onRechazar }) {
  const esPendiente = solicitud.estado === 'pendiente';
  const padreNombre = solicitud.padre_id?.nombre
    ? `${solicitud.padre_id.nombre} ${solicitud.padre_id.apellido || ''}`
    : 'Padre';
  const hijosNombres = (solicitud.hijos_ids || []).map(h => h.nombre).join(', ') || 'Sin especificar';
  const fecha = solicitud.createdAt
    ? new Date(solicitud.createdAt).toLocaleDateString('es-PA')
    : new Date(solicitud.fecha_solicitud).toLocaleDateString('es-PA');

  const cfg = {
    pendiente:  { color: '#F59E0B', bg: '#FFF8E1', icono: 'time-outline',            texto: 'Pendiente' },
    aceptada:   { color: '#16A34A', bg: '#E6F9EE', icono: 'checkmark-circle-outline', texto: 'Aceptada'  },
    rechazada:  { color: '#DC2626', bg: '#FEE2E2', icono: 'close-circle-outline',     texto: 'Rechazada' },
  }[solicitud.estado];

  const confirmarAccion = (accion, callback) => {
    Alert.alert(
      accion === 'aceptar' ? 'Aceptar solicitud' : 'Rechazar solicitud',
      accion === 'aceptar'
        ? `¿Deseas aceptar el servicio para ${hijosNombres}?`
        : `¿Deseas rechazar la solicitud de ${padreNombre}?`,
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
          <Text style={styles.hijoAvatarSolText}>{padreNombre.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.conductorNombre}>{padreNombre}</Text>
          <Text style={styles.conductorVehiculo}>{solicitud.escuela}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icono} size={13} color={cfg.color} />
          <Text style={[styles.estadoBadgeText, { color: cfg.color }]}>{cfg.texto}</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.solicitudInfo}>
        <InfoChip icon="person-outline" texto={`Hijo(s): ${hijosNombres}`} />
        <InfoChip icon="calendar-outline" texto={`Enviada: ${fecha}`} />
        <InfoChip icon="card-outline" texto={`Tarifa: $${solicitud.tarifa_mensual}/mes`} />
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
            onPress={onAceptar}
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
function PantallaConfigRuta({ onIrARutas }) {
  return (
    <View style={styles.setupContainer}>
      <View style={styles.setupIconBig}>
        <Ionicons name="map-outline" size={42} color="#0D1B3E" />
      </View>
      <Text style={styles.setupTitle}>Publica tu primera ruta</Text>
      <Text style={styles.setupDesc}>
        Los padres podrán encontrarte en el marketplace cuando publiques tu ruta y zonas de servicio.
      </Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={onIrARutas} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={18} color="#0D1B3E" />
        <Text style={styles.btnPrimaryText}>Ir a Rutas</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Formulario de ubicación (padre) ─────────────────────────────────────────
function FormularioUbicacion({ ubicacionInicial = null, onGuardar, onCancelar }) {
  const [provincia, setProvincia] = useState(ubicacionInicial?.provincia || '');
  const [distrito, setDistrito] = useState(ubicacionInicial?.distrito || '');
  const [corregimiento, setCorregimiento] = useState(ubicacionInicial?.corregimiento || '');
  const [numeroCasa, setNumeroCasa] = useState(ubicacionInicial?.numero_casa || ubicacionInicial?.numeroCasa || '');
  const [comentario, setComentario] = useState(ubicacionInicial?.comentario || '');
  const [lat, setLat] = useState(ubicacionInicial?.lat || 8.9833);
  const [lng, setLng] = useState(ubicacionInicial?.lng || -79.5167);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const autocompleteFromCoords = (latitude, longitude) => {
    if (latitude > 9.0 && longitude < -79.6) {
      setProvincia('Panamá');
      setDistrito('Panamá');
      setCorregimiento('Bella Vista');
    } else {
      setProvincia('Panamá Oeste');
      setDistrito('Arraiján');
      setCorregimiento('Vista Alegre');
    }
  };



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
              style={[styles.dropdownModalItem, value === op && styles.dropdownItemActive]}
              onPress={() => { onSelect(op); onToggle(); }}
            >
              <Text style={[styles.dropdownModalItemText, value === op && styles.dropdownItemTextActive]}>{op}</Text>
              {value === op && <Ionicons name="checkmark-outline" size={14} color="#0D1B3E" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onCancelar} style={styles.btnBack}>
          <Ionicons name="arrow-back-outline" size={18} color="#0D1B3E" />
          <Text style={styles.btnBackText}>{ubicacionInicial ? 'Cancelar' : 'Atrás'}</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>{ubicacionInicial ? 'Editar ubicación' : 'Ubicación de recogida'}</Text>
        <Text style={styles.formDesc}>
          {ubicacionInicial
            ? 'Actualiza la dirección donde el conductor recogerá a tus hijos.'
            : 'El conductor llegará a esta dirección para recoger a tus hijos.'}
        </Text>

        <View style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>Coloca tu pin en el mapa de recogida</Text>
          <View style={{ height: 200, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E3ECF7', marginBottom: 8 }}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              region={{
                latitude: Number(lat),
                longitude: Number(lng),
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setLat(latitude);
                setLng(longitude);
                autocompleteFromCoords(latitude, longitude);
              }}
            >
              <Marker
                coordinate={{ latitude: Number(lat), longitude: Number(lng) }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setLat(latitude);
                  setLng(longitude);
                  autocompleteFromCoords(latitude, longitude);
                }}
                title="Ubicación de Recogida"
              />
            </MapView>
          </View>
          <Text style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
            Coordenadas: {Number(lat).toFixed(6)}°, {Number(lng).toFixed(6)}° (Presiona o arrastra)
          </Text>
        </View>

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

        <View style={{ height: 1, backgroundColor: '#E3ECF7', marginVertical: 16 }} />
        <Text style={styles.fieldLabel}>N.º de casa / apartamento <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput style={styles.input} placeholder="Ej: Casa 12-B, Apto 304" placeholderTextColor="#aaa" value={numeroCasa} onChangeText={setNumeroCasa} />
        <Text style={styles.fieldLabel}>Indicaciones adicionales <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Ej: Frente al parque, portón azul..." placeholderTextColor="#aaa" value={comentario} onChangeText={setComentario} multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity
          style={[styles.btnPrimary, (!puedeGuardar || guardando) && styles.btnDisabled]}
          onPress={async () => {
            if (!puedeGuardar || guardando) return;
            setGuardando(true);
            try {
              const token = await auth.currentUser.getIdToken();
              await api.patch('/api/auth/ubicacion', { 
                provincia, 
                distrito, 
                corregimiento,
                lat: Number(lat),
                lng: Number(lng),
                numero_casa: numeroCasa,
                comentario
              }, {
                headers: { Authorization: `Bearer ${token}` },
              });
              onGuardar({ 
                provincia, 
                distrito, 
                corregimiento, 
                lat: Number(lat),
                lng: Number(lng),
                numero_casa: numeroCasa, 
                comentario 
              });
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la ubicación');
            } finally {
              setGuardando(false);
            }
          }}
          activeOpacity={puedeGuardar ? 0.85 : 1}
        >
          {guardando ? (
            <ActivityIndicator size="small" color="#0D1B3E" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={18} color="#0D1B3E" />
          )}
          <Text style={styles.btnPrimaryText}>{guardando ? 'Guardando...' : 'Guardar dirección'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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

  // Ubicación Preview Card
  ubicacionPreviewCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0D1B3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ubicacionPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ubicacionPreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  btnCambiarUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E3ECF7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnCambiarUbicacionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D1B3E',
  },
  ubicacionPreviewMapContainer: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E3ECF7',
    marginBottom: 12,
  },
  ubicacionPreviewDetails: {
    gap: 4,
  },
  ubicacionPreviewTextMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  ubicacionPreviewTextSub: {
    fontSize: 12,
    color: '#666',
  },

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
  dropdownModalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E3ECF7' },
  dropdownModalItemText: { fontSize: 14, color: '#0D1B3E' },
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

  noConductoresZonaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 20,
  },
  noConductoresZonaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 4,
  },
  noConductoresZonaDesc: {
    fontSize: 12,
    color: '#D97706',
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#F5F8FC',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0D1B3E',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btnModalCancelar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnModalCancelarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A94A6',
  },
  btnModalGuardar: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnModalGuardarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
});