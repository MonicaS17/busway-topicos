import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ViajeFinalizado({
  estudiantes,
  reiniciarJornada,
  iniciarRutaVuelta,
  tipoViaje,
  bottomInset
}) {
  const total = estudiantes.length;
  const entregados = estudiantes.filter(e => e.estado === 'entregado').length;
  const ausente = estudiantes.filter(e => e.estado === 'ausente').length;
  const sinConfirmar = total - entregados - ausente;

  const safeBottom = Math.max(bottomInset, 16);

  const handlePress = () => {
    if (tipoViaje === 'ida') {
      if (iniciarRutaVuelta) iniciarRutaVuelta();
    } else {
      if (reiniciarJornada) reiniciarJornada();
    }
  };

  const buttonText = tipoViaje === 'ida' ? 'Iniciar ruta de vuelta' : 'Nueva jornada';

  return (
    <View style={[styles.container, { paddingBottom: safeBottom + 16 }]}>
      <View style={styles.finIconWrap}>
        <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
      </View>
      <Text style={styles.finTitle}>¡Ruta completada!</Text>
      <Text style={styles.finDesc}>
        {ausente === total && total > 0
          ? 'La ruta ha sido finalizada porque todos los estudiantes fueron marcados como ausentes.'
          : 'Jornada completada con éxito. Los padres han sido notificados sobre el estado de sus hijos.'}
      </Text>

      <View style={styles.resumenFinal}>
        <MiniStat valor={entregados}    label="Entregados"   color="#16A34A" />
        <MiniStat valor={ausente}       label="Ausentes"     color="#DC2626" />
        <MiniStat valor={sinConfirmar}  label="Sin confirmar" color="#F59E0B" />
      </View>

      <TouchableOpacity
        style={styles.btnNuevaJornada}
        onPress={handlePress}
      >
        <Ionicons name="refresh-outline" size={20} color="#0D1B3E" />
        <Text style={styles.btnNuevaJornadaText} numberOfLines={1}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

function MiniStat({ valor, label, color }) {
  return (
    <View style={styles.miniStatCard}>
      <Text style={[styles.miniStatValor, { color }]}>{valor}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '8%' },
  finIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E6F9EE', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  finTitle: { fontSize: 24, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 10 },
  finDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  resumenFinal: { flexDirection: 'row', gap: 10, marginBottom: 28, alignSelf: 'stretch' },
  miniStatCard: { flex: 1, backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 12, alignItems: 'center' },
  miniStatValor: { fontSize: 22, fontWeight: 'bold' },
  miniStatLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
  btnNuevaJornada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  btnNuevaJornadaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1B3E',
    flexShrink: 1,
  },
});
