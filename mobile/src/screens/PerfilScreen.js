import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilScreen({ navigation, route }) {
  const { usuario } = route.params;
  const { width } = useWindowDimensions();
  const avatarSize = Math.min(width * 0.22, 96);

  const datosGenerales = [
    { icon: 'person-outline', label: 'Nombre completo', value: `${usuario.nombre} ${usuario.apellido}` },
    { icon: 'mail-outline', label: 'Correo electrónico', value: usuario.correo },
    { icon: 'card-outline', label: 'Cédula', value: usuario.cedula || 'No registrada' },
  ];

  const datosConductor = [
    { icon: 'call-outline', label: 'Teléfono de contacto', value: usuario.datos_conductor?.telefono || '—' },
    { icon: 'bus-outline', label: 'Placa del bus', value: usuario.vehiculo?.placa || '—' },
    { icon: 'star-outline', label: 'Calificación', value: usuario.datos_conductor?.calificacion_promedio ? `${usuario.datos_conductor.calificacion_promedio} ⭐` : 'Sin calificaciones' },
  ];

  const datosPadre = [
    { icon: 'people-outline', label: 'Hijos registrados', value: usuario.datos_padre?.hijos?.length?.toString() || '0' },
    { icon: 'card-outline', label: 'Tarjeta registrada', value: usuario.datos_padre?.ultimos_4_digitos ? `•••• ${usuario.datos_padre.ultimos_4_digitos}` : 'No registrada' },
  ];

  const datosExtra = usuario.tipo === 'conductor' ? datosConductor : datosPadre;

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
            <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Text style={[styles.avatarText, { fontSize: avatarSize * 0.35 }]}>
                {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
              </Text>
            </View>
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
                  <Ionicons name={item.icon} size={18} color="#0D1B3E" />
                </View>
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Botón editar */}
          <TouchableOpacity style={styles.btnEditar} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={18} color="#0D1B3E" />
            <Text style={styles.btnEditarText}>Editar información</Text>
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
});