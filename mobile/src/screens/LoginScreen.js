import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  Image, useWindowDimensions, ScrollView,
  KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.32, 130);

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setCargando(true);

      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
      const token = await userCredential.user.getIdToken();
      console.log('Token JWT generado:', token);

      const response = await api.post('/api/auth/login', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigation.navigate('Dashboard', { usuario: response.data.usuario });

    } catch (error) {
      if (error.response) {
        const isHtml = typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>');
        const isNgrokError = typeof error.response.data === 'string' && (error.response.data.includes('ngrok') || error.response.data.includes('Tunnel'));
        
        if (isNgrokError || (error.response.status === 404 && isHtml)) {
          Alert.alert(
            'Error de Conexión (ngrok)',
            'No se pudo encontrar tu túnel de ngrok. Asegúrate de que el comando de ngrok esté corriendo en tu terminal y de que la URL en tu archivo mobile/.env coincida exactamente con la URL de la terminal.'
          );
        } else {
          Alert.alert('Error del Servidor', error.response.data?.error || `Error (${error.response.status})`);
        }
      } else if (error.request) {
        Alert.alert('Error de Red', 'No se pudo conectar con el servidor backend de BusWay.');
      } else {
        Alert.alert('Error de Autenticación', 'Correo o contraseña incorrectos');
      }
      console.error('Login error:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperarContrasena = async () => {
    if (!correoRecuperacion) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu correo electrónico');
      return;
    }

    try {
      setEnviandoRecuperacion(true);
      await sendPasswordResetEmail(auth, correoRecuperacion);
      Alert.alert(
        '✅ Correo enviado',
        'Revisa tu bandeja de entrada para restablecer tu contraseña. El enlace es válido por 30 minutos.'
      );
      setModalVisible(false);
      setCorreoRecuperacion('');
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido');
      } else {
        Alert.alert(
          '✅ Correo enviado',
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
        );
        setModalVisible(false);
        setCorreoRecuperacion('');
      }
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="default" backgroundColor="#0D1B3E" />

      <KeyboardAvoidingView
        style={{ flex: 10 }}
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>

          {/* Header azul con botón de regreso y logo */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.btnBack}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnBackArrow}>‹</Text>
            </TouchableOpacity>

            <Image
              source={require('../../assets/logo2.png')}
              style={{
                width: logoSize,
                height: logoSize,
                marginBottom: -8,
                marginTop: -10,
                borderRadius: logoSize / 1,
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

          {/* Card blanca con el formulario */}
          <View style={styles.card}>
            <Text style={styles.title}>Inicio de Sesión</Text>
            <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: '#0D1B3E' }}
                placeholder="••••••••"
                placeholderTextColor="#aaa"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarContrasena}
              />
              <TouchableOpacity onPress={() => setMostrarContrasena(!mostrarContrasena)}>
                <Ionicons name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ alignSelf: 'center' }}>
              <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnLogin}
              onPress={handleLogin}
              disabled={cargando}
            >
              {cargando
                ? <ActivityIndicator color="#0D1B3E" />
                : <Text style={styles.btnLoginText}>Iniciar Sesión</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de recuperación de contraseña */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Recuperar contraseña</Text>
            <Text style={styles.modalDesc}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa"
              value={correoRecuperacion}
              onChangeText={setCorreoRecuperacion}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.btnLogin}
              onPress={handleRecuperarContrasena}
              disabled={enviandoRecuperacion}
            >
              {enviandoRecuperacion
                ? <ActivityIndicator color="#0D1B3E" />
                : <Text style={styles.btnLoginText}>Enviar enlace</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={() => { setModalVisible(false); setCorreoRecuperacion(''); }}
            >
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: '1%',
  },
  btnBack: {
    alignSelf: 'flex-start',
    width: 50,
    height: 40,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -8,
    marginLeft: 14,
    marginTop: 8,
  },
  btnBackArrow: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginTop: -6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  logoBus: {
    color: '#fff',
  },
  logoWay: {
    color: '#00AEEF',
  },
  slogan: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
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
    paddingHorizontal: '10%',
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1B3E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#0D1B3E',
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingRight: 16,
  },
  forgot: {
    color: '#00AEEF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  btnLogin: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnLoginText: {
    color: '#0D1B3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,27,62,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  btnCancelar: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  btnCancelarText: {
    color: '#888',
    fontSize: 14,
  },
});