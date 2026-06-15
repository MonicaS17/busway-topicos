import React from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, StatusBar, Alert,
  ScrollView, useWindowDimensions, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function DashboardScreen({ navigation, route }) {
  const { usuario } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const avatarSize = Math.min(width * 0.16, 64);
  const logoSize = 40;

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

  const menuConductor = [
    { icon: 'document-text-outline', label: 'Solicitudes', desc: 'Padres interesados en tu ruta' },
    { icon: 'map-outline', label: 'Viajes', desc: 'Inicia y controla tu ruta' },
    { icon: 'notifications-outline', label: 'Notificaciones', desc: 'Avisa a tus padres', screen: 'Notificaciones' },
    { icon: 'card-outline', label: 'Pagos', desc: 'Tus cobros mensuales' },
  ];

  const menuPadre = [
    { icon: 'storefront-outline', label: 'Marketplace', desc: 'Busca un conductor' },
    { icon: 'map-outline', label: 'Viajes', desc: 'Sigue la ruta en vivo' },
    { icon: 'qr-code-outline', label: 'Hijos y QR', desc: 'Gestiona a tus hijos', screen: 'HijosQR' },
    { icon: 'card-outline', label: 'Pagos', desc: 'Tu historial mensual' },
  ];

  const menu = usuario.tipo === 'conductor' ? menuConductor : menuPadre;

  const tabs = [
    { icon: 'home-outline', label: 'Inicio', active: true },
    { icon: 'map-outline', label: 'Ruta' },
    {
      icon: 'notifications-outline',
      label: 'Avisos',
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

          {/* BOTÓN OVALADO "PERFIL" */}
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
            <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Text style={styles.avatarText}>
                {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
              </Text>
            </View>
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

          {/* Menu */}
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>

          <View style={styles.menuGrid}>
            {menu.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.menuCard} 
                activeOpacity={0.85}
                onPress={() => handleMenuPress(item)}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={item.icon} size={24} color="#0D1B3E" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
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

  // BOTÓN OVALADO "PERFIL"
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
  },

  //BOTÓN DE SALIR — ABAJO
  tabIconWrapActive: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
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
});