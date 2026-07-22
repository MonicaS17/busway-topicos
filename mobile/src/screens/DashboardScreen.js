import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, StatusBar, Alert,
  ScrollView, useWindowDimensions, Image, Modal, AppState
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

export default function DashboardScreen({ navigation, route }) {
  const { usuario } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [avisosSinLeer, setAvisosSinLeer] = useState(0);
  const [avisoVisible, setAvisoVisible] = useState(false);
  const [avisoActual, setAvisoActual] = useState(null);
  const avisosDescartados = useRef(new Set());
  const avatarSize = Math.min(width * 0.16, 64);
  const logoSize = 40;

  const cargarAvisosSinLeer = useCallback(async () => {
    if (usuario.tipo !== 'padre') return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/notificaciones/padre', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvisosSinLeer(response.data.sinLeer || 0);
      const avisoPendiente = (response.data.notificaciones || []).find(
        (aviso) => !aviso.leida && !avisosDescartados.current.has(aviso._id)
      );
      if (avisoPendiente) {
        setAvisoActual(avisoPendiente);
        setAvisoVisible(true);
      }
    } catch (error) {
      console.log('No se pudo consultar avisos sin leer:', error.response?.data || error.message);
    }
  }, [usuario.tipo]);

  const [solicitudesConductor, setSolicitudesConductor] = useState([]);
  const [notificacionesSinLeerConductor, setNotificacionesSinLeerConductor] = useState(0);
  const [acuerdoPendientePago, setAcuerdoPendientePago] = useState(null);

  const cargarSolicitudesConductor = useCallback(async () => {
    if (usuario.tipo !== 'conductor') return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/solicitudes/recibidas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudesConductor(response.data.solicitudes || []);
    } catch (error) {
      console.log('No se pudo consultar solicitudes recibidas:', error.response?.data || error.message);
    }
  }, [usuario.tipo]);

  const cargarNotificacionesConductor = useCallback(async () => {
    if (usuario.tipo !== 'conductor') return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/notificaciones/conductor/recibidas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificacionesSinLeerConductor(response.data.sinLeer || 0);
    } catch (error) {
      console.log('No se pudo consultar notificaciones recibidas:', error.response?.data || error.message);
    }
  }, [usuario.tipo]);

  const [tienePagoEfectivo, setTienePagoEfectivo] = useState(false);

  const cargarAcuerdoPadre = useCallback(async () => {
    if (usuario.tipo !== 'padre') return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/acuerdos/mis-acuerdos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const acuerdos = response.data?.acuerdos || [];
      // Permitir el seguimiento si al menos un hijo tiene pago efectivo.
      // El bloqueo fino por hijo lo aplica useRuta dentro de ViajeScreen.
      const algunoPagado = acuerdos.some(
        (ac) => ac.estado === 'activo' && ac.stripe_subscription_id
      );
      // Mostrar banner con un acuerdo activo pendiente de pago (si existe)
      const pendiente = acuerdos.find(
        (ac) => ac.estado === 'activo' && !ac.stripe_subscription_id
      );

      setTienePagoEfectivo(algunoPagado);
      setAcuerdoPendientePago(pendiente || null);
    } catch (error) {
      console.log('Error al cargar acuerdo del padre:', error.message);
      setTienePagoEfectivo(false);
    }
  }, [usuario.tipo]);

  useEffect(() => {
    cargarAvisosSinLeer();
    cargarSolicitudesConductor();
    cargarNotificacionesConductor();
    cargarAcuerdoPadre();

    const unsubscribe = navigation.addListener('focus', () => {
      cargarAvisosSinLeer();
      cargarSolicitudesConductor();
      cargarNotificacionesConductor();
      cargarAcuerdoPadre();
    });
    
    let intervalo;
    if (usuario.tipo === 'padre') {
      intervalo = setInterval(() => {
        cargarAvisosSinLeer();
        cargarAcuerdoPadre();
      }, 8000);
    } else if (usuario.tipo === 'conductor') {
      intervalo = setInterval(() => {
        cargarSolicitudesConductor();
        cargarNotificacionesConductor();
      }, 8000);
    }

    // Auto-refrescar cuando se regresa a la app desde segundo plano
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        cargarAvisosSinLeer();
        cargarSolicitudesConductor();
        cargarNotificacionesConductor();
        cargarAcuerdoPadre();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      unsubscribe();
      if (intervalo) clearInterval(intervalo);
      appStateSub.remove();
    };
  }, [navigation, cargarAvisosSinLeer, cargarSolicitudesConductor, cargarNotificacionesConductor, cargarAcuerdoPadre, usuario.tipo]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }]
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
      console.error('Logout error:', error);
    }
  };

  const cerrarAviso = () => {
    if (avisoActual?._id) avisosDescartados.current.add(avisoActual._id);
    setAvisoVisible(false);
  };

  const verAvisos = () => {
    if (avisoActual?._id) avisosDescartados.current.add(avisoActual._id);
    setAvisoVisible(false);
    navigation.navigate('Avisos', { usuario });
  };

  const menuConductor = [
    { icon: 'document-text-outline', label: 'Solicitudes', desc: 'Padres interesados en tu ruta', screen: 'Marketplace' },
    { icon: 'map-outline', label: 'Rutas', desc: 'Ver y gestionar tu ruta', screen: 'Ruta' },
    { icon: 'notifications-outline', label: 'Notificaciones', desc: 'Avisa a tus padres', screen: 'Notificaciones' },
    { icon: 'card-outline', label: 'Pagos', desc: 'Tus cobros mensuales', screen: 'Pagos' },
  ];

  const menuPadre = [
    { icon: 'storefront-outline', label: 'Marketplace', desc: 'Busca un conductor', screen: 'Marketplace' },
    { icon: 'map-outline', label: 'Rutas', desc: 'Ver tu ruta', screen: 'Ruta' },
    { icon: 'qr-code-outline', label: 'Hijos y QR', desc: 'Gestiona a tus hijos', screen: 'HijosQR' },
    { icon: 'card-outline', label: 'Pagos', desc: 'Tu historial mensual', screen: 'Pagos'  },
  ];

  const menu = usuario.tipo === 'conductor' ? menuConductor : menuPadre;
  const solicitudesPendientes = solicitudesConductor.filter(s => s.estado === 'pendiente').length;

  const tabs = [
    { icon: 'home-outline', label: 'Inicio', active: true },
    { 
      icon: 'location-outline', 
      label: 'Viajes', 
      onPress: () => {
        if (usuario.tipo === 'padre') {
          if (!tienePagoEfectivo) {
            Alert.alert(
              'Servicio Inactivo',
              'No puedes acceder al seguimiento en vivo. Debes registrar tu método de pago y completar el pago mensual para activar el servicio.',
              [
                { text: 'Configurar Pago', onPress: () => navigation.navigate('Pagos', { usuario }) },
                { text: 'Cancelar', style: 'cancel' }
              ]
            );
            return;
          }
        }
        navigation.navigate('Viaje', { usuario });
      } 
    },
    {
      icon: 'notifications-outline',
      label: 'Avisos',
      badge: usuario.tipo === 'padre' ? avisosSinLeer : notificacionesSinLeerConductor,
      onPress: () => navigation.navigate(
        usuario.tipo === 'conductor' ? 'Notificaciones' : 'Avisos',
        { usuario }
      ),
    },
    { icon: 'log-out-outline', label: 'Salir', onPress: handleLogout, isLogout: true },
  ];
  
  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen, { usuario });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      <Modal visible={avisoVisible} transparent animationType="fade" onRequestClose={cerrarAviso}>
        <View style={styles.noticeBackdrop}>
          <View style={styles.noticeModal}>
            <TouchableOpacity
              style={styles.noticeClose}
              onPress={cerrarAviso}
              accessibilityLabel="Cerrar aviso"
            >
              <Ionicons name="close-outline" size={23} color="#0D1B3E" />
            </TouchableOpacity>
            <View style={[styles.noticeIcon, avisoActual?.audiencia !== 'todos' && styles.noticeIconEmergency]}>
              <Ionicons
                name={avisoActual?.audiencia === 'todos' ? 'megaphone-outline' : 'alert-circle-outline'}
                size={30}
                color={avisoActual?.audiencia === 'todos' ? '#0D1B3E' : '#C62828'}
              />
            </View>
            <Text style={styles.noticeTitle}>Nuevo aviso del conductor</Text>
            <TouchableOpacity style={styles.noticeButton} onPress={verAvisos} activeOpacity={0.85}>
              <Ionicons name="notifications-outline" size={18} color="#0D1B3E" />
              <Text style={styles.noticeButtonText}>Ver avisos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header azul */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <Image
              source={require('../../assets/logo2.png')}
              style={{
                width: logoSize, height: logoSize,
                marginRight: 8,
                marginTop: 12, marginBottom: -12,
                borderRadius: logoSize / 2,
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: '#fff',
              }}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>
              <Text style={styles.logoBus}>Bus</Text>
              <Text style={styles.logoWay}>Way</Text>
            </Text>
          </View>

          {/*BOTÓN DE SALIR — ARRIBA (header) */}
          <TouchableOpacity
            style={styles.btnLogoutTop}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#0D1B3E" />
          </TouchableOpacity>
        </View>

        {/* Fila del saludo + botón Perfil */}
        <View style={styles.saludoRow}>
          <View>
            <Text style={styles.saludo}>Bienvenido de nuevo,</Text>
            <Text style={styles.headerTitle}>{usuario.nombre} {usuario.apellido}</Text>
          </View>

          {/* BOTÓN "PERFIL" */}
          <TouchableOpacity
            style={styles.btnPerfil}
            onPress={() => navigation.navigate('Perfil', { usuario })}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={14} color="#0D1B3E" />
            <Text style={styles.btnPerfilText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card blanca */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>

          {/* Perfil */}
          <TouchableOpacity
            style={styles.perfil}
            onPress={() => navigation.navigate('Perfil', { usuario })}
            activeOpacity={0.85}
          >
            {usuario.foto_perfil ? (
              <Image
                source={{ uri: usuario.foto_perfil }}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
              />
            ) : (
              <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Text style={styles.avatarText}>
                  {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.perfilInfo}>
              <Text style={styles.nombre}>{usuario.nombre} {usuario.apellido}</Text>
              <View style={styles.tipoBadge}>
                <Ionicons
                  name={usuario.tipo === 'conductor' ? 'bus-outline' : 'people-outline'}
                  size={14}
                  color="#00AEEF"
                />
                <Text style={styles.tipoBadgeText}>
                  {usuario.tipo === 'conductor' ? 'Conductor' : 'Padre de familia'}
                </Text>
              </View>
            </View>
            <View style={styles.bullet} />
          </TouchableOpacity>

          {/* Alerta de pago pendiente (Padre) */}
          {acuerdoPendientePago && (
            <TouchableOpacity
              style={styles.bannerPago}
              onPress={() => navigation.navigate('Pagos', { usuario })}
              activeOpacity={0.9}
            >
              <View style={styles.bannerPagoLeft}>
                <Ionicons name="card-outline" size={20} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerPagoTitle}>Solicitud Aceptada</Text>
                  <Text style={styles.bannerPagoDesc}>
                    El conductor aceptó tu solicitud. Añade tu información de pago para activar la ruta.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#B45309" />
            </TouchableOpacity>
          )}

          {/* Menu */}
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>

          <View style={styles.menuGrid}>
            {menu.map((item, i) => {
              const esSolicitudesConductor = usuario.tipo === 'conductor' && item.screen === 'Marketplace';
              const showBadge = esSolicitudesConductor && solicitudesPendientes > 0;

              return (
                <TouchableOpacity 
                  key={i} 
                  style={styles.menuCard} 
                  activeOpacity={0.85}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.menuIconCircle, { marginBottom: 0 }]}>
                      <Ionicons name={item.icon} size={24} color="#0D1B3E" />
                    </View>
                    {showBadge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{solicitudesPendientes} pendiente{solicitudesPendientes !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
        {tabs.map((tab, i) => (
          <Pressable
            key={i}
            style={styles.tab}
            onPress={tab.onPress}
          >
            {({ pressed }) => (
              <>
                <View style={
                  tab.active || (tab.isLogout && pressed)
                    ? styles.tabIconWrapActive
                    : styles.tabIconWrap
                }>
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={tab.active || (tab.isLogout && pressed) ? '#0D1B3E' : '#aaa'}
                  />
                  {tab.badge > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={
                  tab.active || (tab.isLogout && pressed)
                    ? styles.tabLabelActive
                    : styles.tabLabel
                }>
                  {tab.label}
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B3E',
  },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: '6%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: -12,
  },
  logoBus: {
    color: '#fff',
  },
  logoWay: {
    color: '#00AEEF',
  },

  // BOTÓN DE SALIR — ARRIBA 
  btnLogoutTop: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: -14,
  },

  // Fila del saludo + botón Perfil
  saludoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  // BOTÓN "PERFIL"
  btnPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#00AEEF',
    marginBottom: 2,
  },
  btnPerfilText: {
    color: '#0D1B3E',
    fontSize: 12,
    fontWeight: '700',
  },

  saludo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 1,
    marginTop: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: '6%',
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Perfil
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    padding: 16,
    gap: 14,
    marginBottom: 28,
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: '#0D1B3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  perfilInfo: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 6,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E3ECF7',
  },
  tipoBadgeText: {
    fontSize: 12,
    color: '#00AEEF',
    fontWeight: '600',
  },
  bullet: {
    width: 6,
    height: '100%',
    backgroundColor: '#FFD700',
    position: 'absolute',
    left: 0,
    top: 0,
  },

  // Menu
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  menuCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    padding: 18,
  },
  menuIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0D1B3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  noticeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,27,62,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
  },
  noticeModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  noticeClose: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  noticeIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF4B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noticeIconEmergency: { backgroundColor: '#FDECEC' },
  noticeTitle: { fontSize: 18, fontWeight: '800', color: '#0D1B3E', textAlign: 'center' },
  noticeButton: {
    minHeight: 48,
    alignSelf: 'stretch',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  noticeButtonText: { color: '#0D1B3E', fontSize: 14, fontWeight: '800' },

  //BOTÓN DE SALIR — ABAJO
  tabIconWrapActive: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  tabLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  tabLabelActive: {
    fontSize: 11,
    color: '#0D1B3E',
    fontWeight: 'bold',
    marginTop: 4,
  },
  menuBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  menuBadgeText: {
    color: '#0D1B3E',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerPago: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  bannerPagoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  bannerPagoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  bannerPagoDesc: {
    fontSize: 12,
    color: '#D97706',
    lineHeight: 16,
  },
});
