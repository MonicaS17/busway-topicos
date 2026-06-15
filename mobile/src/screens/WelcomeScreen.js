import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Image, useWindowDimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.34, 140);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Header azul con logo */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenido a</Text>

        <Image
          source={require('../../assets/logo2.png')}
          style={{
            width: logoSize,
            height: logoSize,
            marginTop: 4,
            marginBottom: -4,
            borderRadius: logoSize / 2,
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.3)',
            backgroundColor: '#fff',
          }}
          resizeMode="contain"
        />

        <Text style={styles.logoText}>
          <Text style={styles.logoBus}>Bus</Text>
          <Text style={styles.logoWay}>Way</Text>
        </Text>
        <Text style={styles.slogan}>tus hijos <Text style={styles.seguros}>seguros</Text> en cada ruta</Text>
      </View>

      {/* Card blanca con los botones */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>
          <Text style={styles.cardTitle}>¿Cómo quieres ingresar?</Text>
          <Text style={styles.cardSubtitle}>Selecciona tu rol para continuar</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnConductor}
              onPress={() => navigation.navigate('Register', { tipo: 'conductor' })}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircleDark}>
                <Ionicons name="bus-outline" size={24} color="#fff" />
              </View>
              <View style={styles.btnTextGroup}>
                <Text style={styles.btnConductorText}>Soy Conductor</Text>
                <Text style={styles.btnConductorSubtext}>Gestiona tu ruta y estudiantes</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnPadre}
              onPress={() => navigation.navigate('Register', { tipo: 'padre' })}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircleLight}>
                <Ionicons name="people-outline" size={24} color="#0D1B3E" />
              </View>
              <View style={styles.btnTextGroup}>
                <Text style={styles.btnPadreText}>Soy Padre de familia</Text>
                <Text style={styles.btnPadreSubtext}>Sigue a tus hijos en tiempo real</Text>
              </View>
              <Text style={styles.arrowDark}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.linkCuenta}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.linkCuentaText}>Ya tengo cuenta</Text>
            <Text style={styles.linkCuentaArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>
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
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: '6%',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 6,
  },
  logoBus: {
    color: '#fff',
  },
  logoWay: {
    color: '#00AEEF',
  },
  slogan: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  seguros: {
    color: '#00AEEF',
    fontWeight: 'bold',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: '7%',
    paddingTop: 32,
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D1B3E',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
  btnConductor: {
    backgroundColor: '#0D1B3E',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnPadre: {
    backgroundColor: '#F5F8FC',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    shadowColor: '#0D1B3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconCircleDark: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconCircleLight: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  btnTextGroup: {
    flex: 1,
  },
  btnConductorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnConductorSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  btnPadreText: {
    color: '#0D1B3E',
    fontSize: 16,
    fontWeight: '700',
  },
  btnPadreSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
  },
  arrowDark: {
    color: '#0D1B3E',
    fontSize: 26,
    fontWeight: '300',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    color: '#bbb',
    fontSize: 13,
    marginHorizontal: 12,
  },
  linkCuenta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  linkCuentaText: {
    color: '#0D1B3E',
    fontSize: 15,
    fontWeight: '700',
  },
  linkCuentaArrow: {
    color: '#0D1B3E',
    fontSize: 16,
    fontWeight: '700',
  },
});