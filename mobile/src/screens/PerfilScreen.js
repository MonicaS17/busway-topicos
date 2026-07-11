import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
  StyleSheet, StatusBar, ScrollView, useWindowDimensions, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { subirFotoACloudinary } from '../config/cloudinary';
import { validarTelefono } from '../utils/validaciones';
import { auth } from '../config/firebase';
import api from '../config/api';

export default function PerfilScreen({ navigation, route }) {
  const { usuario } = route.params;
  const { width } = useWindowDimensions();
  const avatarSize = Math.min(width * 0.22, 96);

  const [usuarioActual, setUsuarioActual] = useState(usuario);
  const [cantidadHijos, setCantidadHijos] = useState(null);
  const [vehiculoInfo, setVehiculoInfo] = useState(null);
  const [activeStudentsMobileCount, setActiveStudentsMobileCount] = useState(0);
  const [acuerdoInfo, setAcuerdoInfo] = useState(null);

  // Estados de Edición
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido);
  const [telefono, setTelefono] = useState(usuario.tipo === 'conductor' ? usuario.datos_conductor?.telefono || '' : '');
  const [fotoPerfil, setFotoPerfil] = useState(usuario.foto_perfil);
  const [guardando, setGuardando] = useState(false);

  const abrirEditor = () => {
    setNombre(usuarioActual.nombre);
    setApellido(usuarioActual.apellido);
    setTelefono(usuarioActual.tipo === 'conductor' ? usuarioActual.datos_conductor?.telefono || '' : '');
    setFotoPerfil(usuarioActual.foto_perfil);
    setModalVisible(true);
  };

  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para cambiar la foto de perfil.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      const asset = resultado.assets[0];
      if (asset.base64) {
        setFotoPerfil(`data:image/jpg;base64,${asset.base64}`);
      } else {
        setFotoPerfil(asset.uri);
      }
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu nombre y apellido.');
      return;
    }

    if (usuarioActual.tipo === 'conductor') {
      if (!telefono.trim()) {
        Alert.alert('Campo requerido', 'Por favor ingresa tu teléfono.');
        return;
      }
      if (!validarTelefono(telefono)) {
        Alert.alert('Teléfono inválido', 'El formato debe ser: 6500-1234');
        return;
      }
    }

    setGuardando(true);
    try {
      let urlFoto = fotoPerfil;
      if (fotoPerfil && fotoPerfil !== usuarioActual.foto_perfil) {
        urlFoto = await subirFotoACloudinary(fotoPerfil);
      }

      const token = await auth.currentUser.getIdToken();
      const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        foto_perfil: urlFoto,
        telefono: usuarioActual.tipo === 'conductor' ? telefono.trim() : undefined,
      };

      const res = await api.patch('/api/auth/perfil/actualizar', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
      setUsuarioActual(res.data.usuario);
      setModalVisible(false);
      
      // Intentar avisar a la pantalla Dashboard al regresar
      navigation.navigate('Dashboard', { usuario: res.data.usuario });
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la información.');
    } finally {
      setGuardando(false);
    }
  };

  //CARGAR CANTIDAD DE HIJOS Y ACUERDO (solo padres)
  useEffect(() => {
    if (usuarioActual.tipo !== 'padre') return;

    const cargarDatosPadre = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const [hijosRes, acuerdoRes] = await Promise.all([
          api.get('/api/padre/mis-hijos', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/api/acuerdos/mis-acuerdos', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setCantidadHijos(hijosRes.data.hijos?.length || 0);
        setAcuerdoInfo(acuerdoRes.data.acuerdo);
      } catch (error) {
        console.error('Error al cargar datos de padre en mobile:', error);
        setCantidadHijos(0);
      }
    };

    cargarDatosPadre();
  }, [usuarioActual.tipo]);

  // CARGAR VEHÍCULO Y ESTUDIANTES (solo conductores)
  useEffect(() => {
    if (usuarioActual.tipo !== 'conductor') return;

    const cargarVehiculoYEstudiantes = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const [perfilRes, estudiantesRes] = await Promise.all([
          api.get('/api/conductor/perfil', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/api/conductor/estudiantes', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setVehiculoInfo(perfilRes.data.vehiculo);
        if (perfilRes.data.usuario) {
          setUsuarioActual(perfilRes.data.usuario);
        }
        
        const activeEstsCount = (estudiantesRes.data.estudiantes || []).filter(est => est.estado === 'Activo').length;
        setActiveStudentsMobileCount(activeEstsCount);
      } catch (error) {
        console.error('Error al cargar datos de conductor en mobile:', error);
      }
    };

    cargarVehiculoYEstudiantes();
  }, [usuarioActual.tipo]);

  const formatCardBrand = (brand) => {
    if (!brand) return 'Tarjeta';
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  const datosGenerales = [
    { icon: 'person-outline', label: 'Nombre completo', value: `${usuarioActual.nombre} ${usuarioActual.apellido}` },
    { icon: 'mail-outline', label: 'Correo electrónico', value: usuarioActual.correo },
    { icon: 'card-outline', label: 'Cédula', value: usuarioActual.cedula || 'No registrada' },
  ];

  const datosConductor = [
    { icon: 'call-outline', label: 'Teléfono de contacto', value: usuarioActual.datos_conductor?.telefono || '—' },
    { icon: 'bus-outline', label: 'Vehículo', value: vehiculoInfo ? `${vehiculoInfo.marca} ${vehiculoInfo.modelo}` : '—' },
    { icon: 'card-outline', label: 'Placa del bus', value: vehiculoInfo?.placa || '—' },
    { icon: 'grid-outline', label: 'Asientos iniciales', value: vehiculoInfo ? String(vehiculoInfo.num_asientos) : '—' },
    { icon: 'checkmark-circle-outline', label: 'Asientos disponibles', value: vehiculoInfo ? String(Math.max(0, vehiculoInfo.num_asientos - activeStudentsMobileCount)) : '—' },
    {
      icon: 'wallet-outline',
      label: 'Cuenta de cobro',
      value: usuarioActual.datos_conductor?.banco_info?.banco_nombre
        ? `Sí, registrada (${usuarioActual.datos_conductor.banco_info.banco_nombre})`
        : 'No registrada'
    },
  ];

  const datosPadre = [
    {
      icon: 'people-outline',
      label: 'Hijos registrados',
      value: cantidadHijos === null ? '...' : cantidadHijos.toString()
    },
    {
      icon: 'card-outline',
      label: 'Tarjeta registrada',
      value: acuerdoInfo?.stripe_subscription_id && acuerdoInfo?.ultimos_4_digitos
        ? `Sí, registrada (${formatCardBrand(acuerdoInfo.marca_tarjeta || 'visa')} •••• ${acuerdoInfo.ultimos_4_digitos})`
        : 'No registrada'
    },
  ];

  const datosExtra = usuarioActual.tipo === 'conductor' ? datosConductor : datosPadre;

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

        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      {/* Card blanca */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>

          {/* Avatar grande */}
          <View style={styles.avatarWrap}>
            {usuario.foto_perfil ? (
              <Image
                source={{ uri: usuario.foto_perfil }}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, marginBottom: 14 }}
              />
            ) : (
              <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Text style={[styles.avatarText, { fontSize: avatarSize * 0.35 }]}>
                  {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                </Text>
              </View>
            )}
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

          {/* Datos generales */}
          <Text style={styles.sectionTitle}>Información general</Text>
          <View style={styles.infoCard}>
            {datosGenerales.map((item, i) => (
              <View key={i} style={[styles.infoRow, i < datosGenerales.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIconCircle}>
                  <Ionicons name={item.icon} size={18} color="#0D1B3E" />
                </View>
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Datos específicos del rol */}
          <Text style={styles.sectionTitle}>
            {usuario.tipo === 'conductor' ? 'Información del vehículo' : 'Información de la cuenta'}
          </Text>
          <View style={styles.infoCard}>
            {datosExtra.map((item, i) => (
              <View key={i} style={[styles.infoRow, i < datosExtra.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIconCircle}>
                  {item.value === '...' ? (
                    <ActivityIndicator size="small" color="#0D1B3E" />
                  ) : (
                    <Ionicons name={item.icon} size={18} color="#0D1B3E" />
                  )}
                </View>
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Botón editar */}
          <TouchableOpacity style={styles.btnEditar} onPress={abrirEditor} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={18} color="#0D1B3E" />
            <Text style={styles.btnEditarText}>Editar información</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>


      {/* Modal de edición */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar información de perfil</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Foto de perfil */}
                <View style={styles.modalAvatarWrap}>
                  {fotoPerfil ? (
                    <Image
                      source={{ uri: fotoPerfil }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                  ) : (
                    <View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40, marginBottom: 0 }]}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 28 }}>
                        {nombre.charAt(0)}{apellido.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.btnCambiarFoto}
                    onPress={seleccionarFoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={14} color="#0D1B3E" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre"
                  placeholderTextColor="#aaa"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.sectionTitle}>Apellido</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Apellido"
                  placeholderTextColor="#aaa"
                  value={apellido}
                  onChangeText={setApellido}
                />

                {usuarioActual.tipo === 'conductor' && (
                  <>
                    <Text style={styles.sectionTitle}>Teléfono de contacto</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Teléfono (ej. 6603-2950)"
                      placeholderTextColor="#aaa"
                      value={telefono}
                      onChangeText={setTelefono}
                      keyboardType="telephone-pad"
                    />
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.btnModalCancelar}
                    onPress={() => setModalVisible(false)}
                    disabled={guardando}
                  >
                    <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnModalGuardar}
                    onPress={handleGuardar}
                    disabled={guardando}
                  >
                    {guardando ? (
                      <ActivityIndicator size="small" color="#0D1B3E" />
                    ) : (
                      <Text style={styles.btnModalGuardarText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  },

  // Avatar
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    backgroundColor: '#0D1B3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nombre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 8,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F8FC',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E3ECF7',
  },
  tipoBadgeText: {
    fontSize: 12,
    color: '#00AEEF',
    fontWeight: '600',
  },

  // Secciones
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3ECF7',
    marginBottom: 24,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E3ECF7',
  },
  infoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#0D1B3E',
    fontWeight: '600',
  },

  // Botón editar
  btnEditar: {
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
  btnEditarText: {
    color: '#0D1B3E',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,27,62,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1B3E',
    marginBottom: 20,
    textAlign: 'center',
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
  modalAvatarWrap: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  btnCambiarFoto: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
});