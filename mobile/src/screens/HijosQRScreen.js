import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ScrollView, Modal, Alert,
  Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import api from '../config/api';

export default function HijosQRScreen({ navigation, route }) {

  const [hijos, setHijos] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreHijo, setNombreHijo] = useState('');
  const [guardando, setGuardando] = useState(false);

  //CARGAR HIJOS DEL PADRE
  const cargarHijos = async () => {
    try {
      setCargandoLista(true);
      const token = await auth.currentUser.getIdToken();
      const response = await api.get('/api/padre/mis-hijos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHijos(response.data.hijos || []);
    } catch (error) {
      console.error('Error al cargar hijos:', error);
      Alert.alert('Error', 'No pudimos cargar la lista de tus hijos');
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarHijos();
  }, []);

  //AGREGAR HIJO
  const agregarHijo = async () => {
    if (!nombreHijo.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de tu hijo');
      return;
    }

    try {
      setGuardando(true);
      const token = await auth.currentUser.getIdToken();
      const response = await api.post(
        '/api/padre/registrar-hijo',
        { nombre: nombreHijo.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHijos([...hijos, response.data.hijo]);
      setNombreHijo('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error al registrar hijo:', error);
      const mensaje = error.response?.data?.error || 'No pudimos registrar a tu hijo. Intenta de nuevo';
      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  //ELIMINAR HIJO
  const eliminarHijo = (hijo) => {
    Alert.alert(
      'Eliminar hijo',
      `¿Seguro que quieres eliminar a ${hijo.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await auth.currentUser.getIdToken();
              await api.delete(`/api/padre/hijos/${hijo._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setHijos(hijos.filter(h => h._id !== hijo._id));
            } catch (error) {
              console.error('Error al eliminar hijo:', error);
              Alert.alert('Error', 'No pudimos eliminar a tu hijo');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Header azul */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mis hijos</Text>
        <Text style={styles.headerSubtitle}>Gestiona el código QR de cada hijo</Text>
      </View>

      {/* Card blanca */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>

          {cargandoLista ? (
            <View style={styles.vacioWrap}>
              <ActivityIndicator size="large" color="#0D1B3E" />
              <Text style={[styles.vacioDesc, { marginTop: 16 }]}>Cargando tus hijos...</Text>
            </View>
          ) : hijos.length === 0 ? (
            <View style={styles.vacioWrap}>
              <View style={styles.vacioIconCircle}>
                <Ionicons name="people-outline" size={32} color="#0D1B3E" />
              </View>
              <Text style={styles.vacioTitulo}>Aún no tienes hijos registrados</Text>
              <Text style={styles.vacioDesc}>Agrega a tus hijos para generar su código QR único, necesario para registrar su asistencia en el bus.</Text>
            </View>
          ) : (
            hijos.map((hijo, i) => (
              <View key={hijo._id || i} style={styles.hijoCard}>
                <View style={styles.hijoHeader}>
                  <View style={styles.hijoAvatar}>
                    <Text style={styles.hijoAvatarText}>{hijo.nombre.charAt(0)}</Text>
                  </View>
                  <Text style={styles.hijoNombre}>{hijo.nombre}</Text>
                </View>

                <View style={styles.qrWrap}>
                  <Image
                    source={{ uri: hijo.qr_code }}
                    style={{ width: 150, height: 150 }}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.qrCodigo}>ID: {hijo._id}</Text>

                <View style={styles.accionesRow}>
                  <TouchableOpacity style={styles.btnDescargar} activeOpacity={0.85}>
                    <Ionicons name="download-outline" size={16} color="#0D1B3E" />
                    <Text style={styles.btnDescargarText}>Descargar QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnEliminar}
                    activeOpacity={0.85}
                    onPress={() => eliminarHijo(hijo)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E53935" />
                    <Text style={styles.btnEliminarText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Botón añadir hijo */}
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color="#0D1B3E" />
            <Text style={styles.btnAgregarText}>Añadir hijo</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* Modal añadir hijo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Añadir hijo</Text>
            <Text style={styles.modalDesc}>
              Ingresa el nombre de tu hijo. Se generará automáticamente su código QR único.
            </Text>

            <Text style={styles.label}>Nombre del hijo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#aaa"
              value={nombreHijo}
              onChangeText={setNombreHijo}
              editable={!guardando}
            />

            <TouchableOpacity
              style={[styles.btnConfirmar, guardando && { opacity: 0.6 }]}
              onPress={agregarHijo}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#0D1B3E" />
                : <Text style={styles.btnConfirmarText}>Generar QR</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={() => { setModalVisible(false); setNombreHijo(''); }}
              disabled={guardando}
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
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: '6%',
  },
  btnVolver: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
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
    paddingTop: 28,
    paddingBottom: 40,
    gap: 18,
  },

  // Estado vacío
  vacioWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  vacioIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F5F8FC',
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vacioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  vacioDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  // Tarjeta de hijo
  hijoCard: {
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    padding: 20,
    alignItems: 'center',
  },
  hijoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  hijoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0D1B3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hijoAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  hijoNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1B3E',
  },
  qrWrap: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  qrCodigo: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 16,
  },

  // Fila de acciones (Descargar / Eliminar)
  accionesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnDescargar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
  },
  btnDescargarText: {
    color: '#0D1B3E',
    fontSize: 13,
    fontWeight: '600',
  },
  btnEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#FFD1D1',
  },
  btnEliminarText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '600',
  },

  // Botón añadir
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    backgroundColor: '#FFF8DC',
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnAgregarText: {
    color: '#0D1B3E',
    fontSize: 15,
    fontWeight: '700',
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
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
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
  btnConfirmar: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  btnConfirmarText: {
    color: '#0D1B3E',
    fontSize: 16,
    fontWeight: 'bold',
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