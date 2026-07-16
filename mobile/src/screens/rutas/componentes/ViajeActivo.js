import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { CameraView, useCameraPermissions } from 'expo-camera';
import TarjetaEstudiante from './TarjetaEstudiante';
import IndicadorParada from './IndicadorParada';

export default function ViajeActivo(props) {
  const { esPadre, bottomInset } = props;
  const insetsBottom = Math.max(bottomInset || 0, 16);
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulso]);

  if (esPadre) {
    return <ViajeActivoPadre {...props} pulso={pulso} bottomInset={insetsBottom} />;
  }
  return <ViajeActivoConductor {...props} pulso={pulso} bottomInset={insetsBottom} />;
}

// ─── VISTA PADRE ─────────────────────────────────────────────────────────
function ViajeActivoPadre({
  rutaActiva,
  faseViaje,   // 'en_curso' | 'entre_viajes' | 'sin_viaje'
  tipoViaje,   // 'ida' | 'vuelta'
  coordenadasBus,
  rutaInfo,
  conductorInfo,
  hijos,
  hijoSeleccionado,
  idsHijosRuta,
  estudiantes, // Lista de todos los estudiantes de la ruta para mostrar los pines
  pulso,
  bottomInset
}) {
  const firstChild = hijos.find(h => String(h.id) === String(hijoSeleccionado?._id || hijoSeleccionado?.id));

  const mapRef = useRef(null);
  useEffect(() => {
    if (rutaActiva && mapRef.current) {
      mapRef.current.animateToRegion(coordenadasBus, 800);
    }
  }, [coordenadasBus, rutaActiva]);

  if (!firstChild) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#888', textAlign: 'center' }}>Cargando información del estudiante...</Text>
      </View>
    );
  }
  const estadoHijo = firstChild.estado || 'pendiente';

  //Mapeo de estados visuales para la pantalla del padre
  let estadoVisual = 'esperando_ida';

  if (estadoHijo === 'ausente') {
    estadoVisual = 'ausente';
  } else if (tipoViaje === 'vuelta') {
    if (estadoHijo === 'entregado') {
      estadoVisual = 'entregado_vuelta';
    } else if (estadoHijo === 'abordo') {
      estadoVisual = 'abordo_vuelta';
    } else {
      if (rutaActiva || faseViaje === 'en_curso') {
        estadoVisual = 'esperando_vuelta_activo';
      } else {
        estadoVisual = 'esperando_vuelta_inactivo';
      }
    }
  } else {
    // Ida (Mañana)
    if (estadoHijo === 'entregado' || faseViaje === 'entre_viajes') {
      estadoVisual = 'en_escuela';
    } else if (estadoHijo === 'abordo') {
      estadoVisual = 'abordo_ida';
    } else {
      if (rutaActiva || faseViaje === 'en_curso') {
        estadoVisual = 'esperando_ida_activo';
      } else {
        estadoVisual = 'esperando_ida_inactivo';
      }
    }
  }

  const configVisual = {
    // Ida - Mañana
    esperando_ida_inactivo: {
      icono: 'time-outline',
      titulo: 'Viaje no iniciado',
      mensaje: 'Esperando recogida: el conductor aún no ha iniciado la ruta.',
      colorFondo: '#F5F8FC',
      colorTexto: '#0D1B3E',
      colorIcono: '#888',
      activo: false
    },
    esperando_ida_activo: {
      icono: 'bus-outline',
      titulo: 'Ruta iniciada',
      mensaje: 'Esperando a recoger',
      colorFondo: '#3B82F6',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: true
    },
    abordo_ida: {
      icono: 'checkmark-circle-outline',
      titulo: 'Ruta iniciada',
      mensaje: 'Abordo',
      colorFondo: '#10B981',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: true
    },
    en_escuela: {
      icono: 'school-outline',
      titulo: 'Ruta finalizada',
      mensaje: 'Llegada a la escuela',
      colorFondo: '#0D1B3E',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: false
    },

    // Vuelta - Tarde
    esperando_vuelta_inactivo: {
      icono: 'time-outline',
      titulo: 'Viaje no iniciado',
      mensaje: 'Esperando regreso: el viaje de regreso a casa no ha iniciado.',
      colorFondo: '#F5F8FC',
      colorTexto: '#0D1B3E',
      colorIcono: '#888',
      activo: false
    },
    esperando_vuelta_activo: {
      icono: 'bus-outline',
      titulo: 'Ruta iniciada',
      mensaje: 'Esperando a recoger',
      colorFondo: '#3B82F6',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: true
    },
    abordo_vuelta: {
      icono: 'checkmark-circle-outline',
      titulo: 'Ruta iniciada',
      mensaje: 'Abordo',
      colorFondo: '#10B981',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: true
    },
    entregado_vuelta: {
      icono: 'home-outline',
      titulo: 'Ruta finalizada',
      mensaje: 'Llegada a casa',
      colorFondo: '#10B981',
      colorTexto: '#fff',
      colorIcono: '#fff',
      activo: false
    },

    // Común
    ausente: {
      icono: 'close-circle-outline',
      titulo: 'Ausente hoy',
      mensaje: 'Tu hijo ha sido marcado como ausente para este viaje.',
      colorFondo: '#FEE2E2',
      colorTexto: '#DC2626',
      colorIcono: '#DC2626',
      activo: false
    }
  }[estadoVisual] || {
    icono: 'time-outline',
    titulo: 'Esperando recogida',
    mensaje: 'El conductor aún no ha iniciado la ruta.',
    colorFondo: '#F5F8FC',
    colorTexto: '#0D1B3E',
    colorIcono: '#888',
    activo: false
  };

  const coordenadasHijo = firstChild?.latitud && firstChild?.longitud
    ? { latitude: Number(firstChild.latitud), longitude: Number(firstChild.longitud) }
    : { latitude: 8.9833, longitude: -79.5167 };

  const getSafeText = (value, fallback = '') => {
    if (typeof value === 'string') return value.trim() || fallback;
    return fallback;
  };

  const hijosAMostrar = idsHijosRuta
    ? hijos.filter(h => idsHijosRuta.includes(String(h.id)))
    : hijos.filter(h => String(h.id) === String(hijoSeleccionado?._id || hijoSeleccionado?.id));

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
      <View style={[
        styles.estadoViajeBanner,
        { backgroundColor: configVisual.colorFondo }
      ]}>
        <Animated.View style={[
          styles.estadoPuntoGrande,
          configVisual.activo ? styles.puntoBusActivo : styles.puntoBusEspera,
          { transform: [{ scale: pulso }] }
        ]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.estadoViajeTitle, { color: configVisual.colorTexto }]}>
            {configVisual.titulo}
          </Text>
          <Text style={[styles.estadoViajeSub, { color: configVisual.colorTexto === '#fff' ? 'rgba(255,255,255,0.8)' : '#888' }]}>
            {configVisual.mensaje}
          </Text>
        </View>
        <Ionicons name={configVisual.icono} size={22} color={configVisual.colorIcono} />
      </View>

      {rutaActiva && estadoHijo !== 'ausente' && estadoHijo !== 'entregado' && (
        <>
          <Text style={styles.sectionLabel}>Ubicación del bus</Text>
          <View style={styles.mapaContainer}>
            <MapView ref={mapRef} style={styles.mapaSimulado} provider={PROVIDER_DEFAULT} initialRegion={coordenadasBus}>
              {/* Autobús */}
              <Marker coordinate={coordenadasBus} title="Autobús Escolar" zIndex={99}>
                <View style={styles.customMarkerBus}><Text style={styles.markerEmoji}>🚌</Text></View>
              </Marker>

              {/* Escuela */}
              <Marker 
                coordinate={
                  rutaInfo?.escuela_lat && rutaInfo?.escuela_lng
                    ? { latitude: Number(rutaInfo.escuela_lat), longitude: Number(rutaInfo.escuela_lng) }
                    : { latitude: 8.9975, longitude: -79.5240 }
                } 
                title={rutaInfo?.escuela || 'Colegio San Agustín'} 
                zIndex={5}
              >
                <View style={[styles.customMarkerHito, { backgroundColor: '#10B981' }]}><Text style={styles.markerEmojiSmall}>🏫</Text></View>
              </Marker>

              {/* Paradas Anónimas (Privacidad) */}
              {(estudiantes || []).filter(e => e.lat && e.lng).map((est, idx) => {
                const esMiHijo = hijos.some(h => String(h.id) === String(est.id || est._id));
                const markerTitle = esMiHijo ? est.nombre : `Parada ${est.orden || idx + 1}`;
                const markerDesc = esMiHijo ? (est.direccion || 'Tu punto de recogida') : 'Parada de recogida';
                const markerBg = esMiHijo ? '#3B82F6' : '#94A3B8';

                return (
                  <Marker 
                    key={est.id || est._id} 
                    coordinate={{ latitude: Number(est.lat), longitude: Number(est.lng) }} 
                    title={markerTitle}
                    description={markerDesc}
                    zIndex={esMiHijo ? 20 : 10}
                  >
                    <View style={[styles.customMarkerHito, { backgroundColor: markerBg, width: 28, height: 28, borderRadius: 14 }]}>
                      {esMiHijo ? (
                        <Text style={styles.markerEmojiSmall}>🏠</Text>
                      ) : (
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{est.orden || idx + 1}</Text>
                      )}
                    </View>
                  </Marker>
                );
              })}
            </MapView>
            <View style={styles.mapaFooter}>
              <Ionicons name="information-circle-outline" size={14} color="#888" />
              <Text style={styles.mapaFooterText}>Conexión segura y en vivo (paradas anónimas)</Text>
            </View>
          </View>
        </>
      )}


      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Conductor</Text>
      <View style={styles.infoCard}>
        <View style={styles.conductorRow}>
          <View style={styles.avatarMed}>
            <Text style={styles.avatarMedText}>{getSafeText(conductorInfo?.nombre, 'C').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.conductorNombre}>{getSafeText(conductorInfo?.nombre, 'Conductor')}</Text>
            <Text style={styles.conductorSub}>{getSafeText(conductorInfo?.datos_conductor?.vehiculo, 'Vehículo')} · {getSafeText(conductorInfo?.datos_conductor?.placa, 'Placa')}</Text>
          </View>
          <TouchableOpacity style={styles.btnWA} onPress={async () => {
            const telefono = conductorInfo?.telefono || conductorInfo?.datos_conductor?.telefono;
            if (!telefono) {
              Alert.alert('Error', 'El conductor no tiene un número de teléfono registrado.');
              return;
            }
            const num = telefono.replace(/[^0-9]/g, '');
            const fullNum = num.startsWith('507') ? num : `507${num}`;
            const mensaje = `Hola, buenas. Quería consultarle sobre el viaje de BusWay.`;
            const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(mensaje)}`;
            try {
              const soportado = await Linking.canOpenURL(url);
              if (soportado) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
              }
            } catch (err) {
              console.log('Error opening whatsapp link:', err);
              Alert.alert('Error', 'No se pudo abrir WhatsApp.');
            }
          }}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <FilaInfoViaje icon="school-outline" label="Escuela" valor={getSafeText(rutaInfo?.escuela, 'Colegio San Agustín')} />
        {rutaActiva ? (
          <FilaInfoViaje 
            icon="time-outline" 
            label={tipoViaje === 'vuelta' ? 'Salida Colegio' : 'Horario'} 
            valor={
              tipoViaje === 'vuelta' 
                ? (rutaInfo?.hora_salida_vuelta || '2:30 PM (Aprox.)') 
                : (rutaInfo?.horario || '6:30 AM — 7:15 AM')
            } 
            last 
          />
        ) : (
          <>
            <FilaInfoViaje 
              icon="time-outline" 
              label="Horario Entrada" 
              valor={rutaInfo?.horario || '6:30 AM — 7:15 AM'} 
            />
            <FilaInfoViaje 
              icon="time-outline" 
              label="Salida Colegio" 
              valor={rutaInfo?.hora_salida_vuelta || '2:30 PM (Aprox.)'} 
              last 
            />
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Estado de tus hijos</Text>
      <View style={styles.infoCard}>
        {hijosAMostrar.map((hijo, i) => {
          const cfg = {
            pendiente: { color: '#F59E0B', bg: '#FFF8E1', icon: 'time-outline', texto: 'Pendiente' },
            abordo:    { color: '#16A34A', bg: '#E6F9EE', icon: 'checkmark-circle-outline', texto: 'A bordo' },
            entregado: { color: '#0D1B3E', bg: '#E8F0FE', icon: 'school-outline', texto: 'Entregado' },
            ausente:   { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline', texto: 'Ausente' },
          }[hijo.estado] || { color: '#888', bg: '#F5F5F5', icon: 'help-circle-outline', texto: hijo.estado };

          return (
            <View key={hijo.id} style={[styles.hijoEstadoRow, i < hijosAMostrar.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}>
              <View style={styles.hijoAvatar}><Text style={styles.hijoAvatarText}>{hijo.nombre.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.hijoNombre}>{hijo.nombre}</Text>
              <View style={[styles.estadoChip, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={13} color={cfg.color} /><Text style={[styles.estadoChipText, { color: cfg.color }]}>{cfg.texto}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── VISTA CONDUCTOR ─────────────────────────────────────────────────────────
function ViajeActivoConductor({
  tipoViaje,
  estudiantes,
  marcarEstado,
  handleQRScanned,
  handleParentQRScanned,
  finalizarRuta,
  posicionBus,
  rutaInfo,
  pulso,
  bottomInset
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  const abordo = estudiantes.filter(e => e.estado === 'abordo').length;
  const pendiente = estudiantes.filter(e => e.estado === 'pendiente').length;
  const ausente = estudiantes.filter(e => e.estado === 'ausente').length;

  const estudianteActual = tipoViaje === 'ida'
    ? estudiantes.find(e => e.estado === 'pendiente')
    : (estudiantes.find(e => e.estado === 'pendiente') || estudiantes.find(e => e.estado === 'abordo'));

  const regionMapa = posicionBus
    ? {
        latitude: Number(posicionBus.latitude),
        longitude: Number(posicionBus.longitude),
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }
    : {
        latitude: 8.9833,
        longitude: -79.5167,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.gpsBanner, { transform: [{ scale: pulso }] }]}>
          <View style={styles.gpsPunto} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsBannerTitle}>GPS activo · Ruta en curso</Text>
            <Text style={styles.gpsBannerSub}>Los padres están viendo tu ubicación en tiempo real</Text>
          </View>
          <Ionicons name="radio-outline" size={20} color="#fff" />
        </Animated.View>

        {/* Mapa del conductor con las paradas numeradas */}
        <Text style={styles.sectionLabel}>Mapa de paradas</Text>
        <View style={[styles.mapaContainer, { height: 240, marginBottom: 16 }]}>
          <MapView 
            style={styles.mapaSimulado} 
            provider={PROVIDER_DEFAULT} 
            initialRegion={regionMapa}
          >
            {/* Autobús */}
            {posicionBus && (
              <Marker coordinate={posicionBus} title="Mi Ubicación" zIndex={100}>
                <View style={styles.customMarkerBus}><Text style={styles.markerEmoji}>🚌</Text></View>
              </Marker>
            )}

            {/* Paradas de los estudiantes */}
            {(estudiantes || []).filter(e => e.lat && e.lng).map((est, idx) => {
              const numOrden = (!est.orden || est.orden >= 99) ? (idx + 1) : est.orden;
              const markerBg = est.estado === 'abordo' ? '#16A34A' : (est.estado === 'ausente' ? '#DC2626' : (est.estado === 'entregado' ? '#0D1B3E' : '#3B82F6'));
              return (
                <Marker 
                  key={est.id || est._id} 
                  coordinate={{ latitude: Number(est.lat), longitude: Number(est.lng) }} 
                  title={`Parada ${numOrden}: ${est.nombre}`}
                  description={est.direccion || 'Punto de recogida'}
                  zIndex={10}
                >
                  <View style={[styles.customMarkerHito, { backgroundColor: markerBg, width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff' }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{numOrden}</Text>
                  </View>
                </Marker>
              );
            })}

            {/* Destino final: Escuela */}
            <Marker 
              coordinate={
                rutaInfo?.escuela_lat && rutaInfo?.escuela_lng
                  ? { latitude: Number(rutaInfo.escuela_lat), longitude: Number(rutaInfo.escuela_lng) }
                  : { latitude: 8.9975, longitude: -79.5240 }
              } 
              title={rutaInfo?.escuela || 'Colegio San Agustín'} 
              zIndex={5}
            >
              <View style={[styles.customMarkerHito, { backgroundColor: '#10B981' }]}><Text style={styles.markerEmojiSmall}>🏫</Text></View>
            </Marker>
          </MapView>
        </View>

        {/* Panel escáner QR colapsable */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: mostrarEscaner ? '#DC2626' : '#0D1B3E', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 12, 
              borderRadius: 12,
              gap: 8
            }} 
            onPress={() => setMostrarEscaner(!mostrarEscaner)}
          >
            <Ionicons name={mostrarEscaner ? 'close-circle-outline' : 'qr-code-outline'} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {mostrarEscaner ? 'Ocultar Escáner QR' : 'Escanear Código QR en ruta'}
            </Text>
          </TouchableOpacity>

          {mostrarEscaner && (
            <View style={[styles.cameraContainer, { height: 180, marginTop: 8 }]}>
              {permission?.granted ? (
                <CameraView 
                  style={{ flex: 1 }} 
                  facing="back" 
                  onBarcodeScanned={tipoViaje === 'ida' ? handleQRScanned : handleParentQRScanned} 
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
                />
              ) : (
                <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
                  <Text style={styles.btnPrimaryText}>Conceder permiso de cámara</Text>
                </TouchableOpacity>
              )}
              <View style={styles.qrOverlay}>
                <View style={[styles.qrFrame, { width: 120, height: 120 }]}>
                  <View style={[styles.qrCorner, styles.qrCornerTL]} /><View style={[styles.qrCorner, styles.qrCornerTR]} />
                  <View style={[styles.qrCorner, styles.qrCornerBL]} /><View style={[styles.qrCorner, styles.qrCornerBR]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Listado de secuencia de paradas */}
        <Text style={styles.sectionLabel}>Secuencia de paradas</Text>
        <View style={[styles.infoCard, { marginBottom: 16, paddingVertical: 4 }]}>
          {/* Escuela al inicio si es viaje de vuelta */}
          {tipoViaje === 'vuelta' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }}>
              <View style={[styles.customMarkerHito, { backgroundColor: '#10B981', width: 22, height: 22, borderRadius: 11, marginRight: 10 }]}><Text style={{ fontSize: 11 }}>🏫</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0D1B3E' }}>{rutaInfo?.escuela || 'Escuela (Punto de Salida)'}</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>Salida de la ruta escolar</Text>
              </View>
            </View>
          )}

          {(estudiantes || []).map((est, idx) => {
            const numOrden = (!est.orden || est.orden >= 99) ? (idx + 1) : est.orden;
            
            // Mapeo completo de estados para el conductor (incluye entregado)
            const statusCfg = {
              pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#FFF8E1' },
              abordo: { label: 'A Bordo', color: '#16A34A', bg: '#E6F9EE' },
              ausente: { label: 'Ausente', color: '#DC2626', bg: '#FEE2E2' },
              entregado: { label: 'Entregado', color: '#0D1B3E', bg: '#E2E8F0' }
            }[est.estado] || { label: 'Pendiente', color: '#F59E0B', bg: '#FFF8E1' };

            return (
              <View key={est.id || est._id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: idx < estudiantes.length - 1 ? 1 : 0, borderBottomColor: '#E3ECF7' }}>
                <View style={[styles.customMarkerHito, { backgroundColor: est.estado === 'abordo' ? '#16A34A' : (est.estado === 'ausente' ? '#DC2626' : (est.estado === 'entregado' ? '#0D1B3E' : '#3B82F6')), width: 22, height: 22, borderRadius: 11, marginRight: 10 }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{numOrden}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0D1B3E' }}>{est.nombre}</Text>
                  <Text style={{ fontSize: 11, color: '#666' }} numberOfLines={1}>{est.direccion || 'Sin referencia registrada'}</Text>
                </View>
                <View style={{ backgroundColor: statusCfg.bg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: statusCfg.color }}>
                    {statusCfg.label}
                  </Text>
                </View>
                {/* Acciones manuales en línea */}
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 10 }}>
                  {tipoViaje === 'ida' ? (
                    <>
                      {est.estado === 'pendiente' && (
                        <>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#16A34A', padding: 6, borderRadius: 6 }} 
                            onPress={() => marcarEstado(est.id, 'abordo')}
                          >
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#DC2626', padding: 6, borderRadius: 6 }} 
                            onPress={() => marcarEstado(est.id, 'ausente')}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        </>
                      )}
                      {est.estado === 'ausente' && (
                        <TouchableOpacity 
                          style={{ backgroundColor: '#16A34A', padding: 6, borderRadius: 6 }} 
                          onPress={() => marcarEstado(est.id, 'abordo')}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      {est.estado === 'pendiente' && (
                        <>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#16A34A', padding: 6, borderRadius: 6 }} 
                            onPress={() => marcarEstado(est.id, 'abordo')}
                          >
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#DC2626', padding: 6, borderRadius: 6 }} 
                            onPress={() => marcarEstado(est.id, 'ausente')}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        </>
                      )}
                      {est.estado === 'abordo' && (
                        <>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#0D1B3E', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }} 
                            onPress={() => marcarEstado(est.id, 'entregado')}
                          >
                            <Ionicons name="hand-left-outline" size={12} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Entregar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#DC2626', padding: 6, borderRadius: 6 }} 
                            onPress={() => marcarEstado(est.id, 'ausente')}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        </>
                      )}
                      {est.estado === 'ausente' && (
                        <TouchableOpacity 
                          style={{ backgroundColor: '#16A34A', padding: 6, borderRadius: 6 }} 
                          onPress={() => marcarEstado(est.id, 'abordo')}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          })}

          {/* Escuela al final si es viaje de ida */}
          {tipoViaje === 'ida' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#E3ECF7' }}>
              <View style={[styles.customMarkerHito, { backgroundColor: '#10B981', width: 22, height: 22, borderRadius: 11, marginRight: 10 }]}><Text style={{ fontSize: 11 }}>🏫</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0D1B3E' }}>{rutaInfo?.escuela || 'Escuela (Destino Final)'}</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>Llegada de la ruta escolar</Text>
              </View>
            </View>
          )}
        </View>

        {estudianteActual && <IndicadorParada tipoViaje={tipoViaje} student={estudianteActual} />}

         {estudianteActual ? (
          <View style={styles.seccionAccion}>
            {tipoViaje === 'ida' ? (
              <>
                <TarjetaEstudiante student={estudianteActual} />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#16A34A', flex: 1 }]} onPress={() => marcarEstado(estudianteActual.id, 'abordo')}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>Recogido</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#DC2626', width: 110 }]} onPress={() => marcarEstado(estudianteActual.id, 'ausente')}>
                    <Ionicons name="close-circle-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>Ausente</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TarjetaEstudiante student={estudianteActual} />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {estudianteActual.estado === 'abordo' ? (
                    <>
                      <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#0D1B3E', flex: 1 }]} onPress={() => marcarEstado(estudianteActual.id, 'entregado')}>
                        <Ionicons name="hand-left-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>Entregar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#DC2626', width: 110 }]} onPress={() => marcarEstado(estudianteActual.id, 'ausente')}>
                        <Ionicons name="close-circle-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>Ausente</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#16A34A', flex: 1 }]} onPress={() => marcarEstado(estudianteActual.id, 'abordo')}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>A Bordo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#DC2626', width: 110 }]} onPress={() => marcarEstado(estudianteActual.id, 'ausente')}>
                        <Ionicons name="close-circle-outline" size={20} color="#fff" /><Text style={styles.btnActionText}>Ausente</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.seccionFin}>
            <View style={styles.finIconWrap}><Ionicons name="happy-outline" size={48} color="#16A34A" /></View>
            <Text style={styles.finTitle}>¡Todo listo!</Text>
            <Text style={styles.finDesc}>
              {tipoViaje === 'ida'
                ? 'Todos los estudiantes han sido procesados. Presiona el botón a continuación para registrar la llegada a la escuela.'
                : 'Todos los estudiantes a bordo han sido entregados en sus hogares.'}
            </Text>
            <TouchableOpacity style={[styles.btnFinalizar, { marginTop: 10, alignSelf: 'stretch' }]} onPress={finalizarRuta}>
              <Ionicons name={tipoViaje === 'ida' ? 'school-outline' : 'flag'} size={18} color="#fff" />
              <Text style={styles.btnFinalizarText}>{tipoViaje === 'ida' ? 'Llegamos a la escuela' : 'Finalizar Ruta'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.miniStats, { marginTop: 20 }]}>
          <MiniStat valor={abordo}    label="A bordo"   color="#16A34A" />
          <MiniStat valor={pendiente} label="Pendiente" color="#F59E0B" />
          <MiniStat valor={ausente}   label="Ausente"   color="#DC2626" />
        </View>

        <Text style={styles.sectionLabel}>Estudiantes en ruta</Text>
        <View style={styles.infoCard}>
          {estudiantes.map((est, i) => {
            const cfg = {
              pendiente: { color: '#F59E0B', icon: 'time-outline' },
              abordo:    { color: '#16A34A', icon: 'checkmark-circle-outline' },
              ausente:   { color: '#DC2626', icon: 'close-circle-outline' },
              entregado: { color: '#0D1B3E', icon: 'school-outline' },
            }[est.estado] || { color: '#F59E0B', icon: 'time-outline' };

            return (
              <View key={est.id} style={[styles.estRutaRow, i < estudiantes.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}> 
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.estRutaNombre}>{est.nombre}</Text>
                  <Text style={styles.estRutaZona}>{est.zona}</Text>
                </View>
                {tipoViaje === 'vuelta' && est.estado === 'abordo' && (
                  <TouchableOpacity style={styles.btnEntregado} onPress={() => {
                    Alert.alert('Confirmar entrega', `¿Confirmas la entrega de ${est.nombre}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Confirmar', onPress: () => marcarEstado(est.id, 'entregado') },
                    ]);
                  }}><Text style={styles.btnEntregadoText}>Entregar</Text></TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function FilaInfoViaje({ icon, label, valor, last }) {
  return (
    <View style={[styles.filaInfo, !last && { borderBottomWidth: 1, borderBottomColor: '#E3ECF7' }]}>
      <View style={styles.filaInfoIcon}><Ionicons name={icon} size={15} color="#0D1B3E" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaInfoLabel}>{label}</Text>
        <Text style={styles.filaInfoValor}>{valor}</Text>
      </View>
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
  body: { flexGrow: 1, paddingHorizontal: '6%', paddingTop: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E3ECF7', marginVertical: 4 },
  miniStats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  miniStatCard: { flex: 1, backgroundColor: '#F5F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E3ECF7', padding: 12, alignItems: 'center' },
  miniStatValor: { fontSize: 22, fontWeight: 'bold' },
  miniStatLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 15, marginBottom: 4 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  btnFinalizar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0D1B3E', borderRadius: 16, paddingVertical: 15, marginTop: 20 },
  btnFinalizarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnWA: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  estadoViajeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, marginBottom: 20 },
  bannerEspera: { backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7' },
  bannerActivo: { backgroundColor: '#0D1B3E' },
  estadoPuntoGrande: { width: 16, height: 16, borderRadius: 8 },
  puntoBusEspera: { backgroundColor: '#C8D6E5' },
  puntoBusActivo: { backgroundColor: '#FFD700' },
  estadoViajeTitle: { fontSize: 14, fontWeight: '700', color: '#0D1B3E' },
  estadoViajeSub: { fontSize: 12, color: '#888', marginTop: 2 },
  mapaContainer: { marginBottom: 4 },
  mapaSimulado: { height: 200, backgroundColor: '#E8F0E8', borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E3ECF7' },
  customMarkerBus: { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  customMarkerHito: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', elevation: 4 },
  markerEmoji: { fontSize: 28 },
  markerEmojiSmall: { fontSize: 14 },
  mapaFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 },
  mapaFooterText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  mapaInactivo: { height: 200, backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: '10%' },
  mapaInactivoTitle: { fontSize: 15, fontWeight: 'bold', color: '#0D1B3E', marginTop: 10 },
  mapaInactivoDesc: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  gpsBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1B3E', borderRadius: 18, padding: 16, marginBottom: 16 },
  gpsPunto: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD700' },
  gpsBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  gpsBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  infoCard: { backgroundColor: '#F5F8FC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3ECF7', paddingHorizontal: 16, paddingVertical: 4, marginBottom: 4 },
  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  filaInfoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3ECF7' },
  filaInfoLabel: { fontSize: 11, color: '#888', marginBottom: 1 },
  filaInfoValor: { fontSize: 13, fontWeight: '600', color: '#0D1B3E' },
  conductorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatarMed: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  avatarMedText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  conductorNombre: { fontSize: 15, fontWeight: '700', color: '#0D1B3E' },
  conductorSub: { fontSize: 12, color: '#888', marginTop: 2 },
  hijoEstadoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  hijoAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0D1B3E', alignItems: 'center', justifyContent: 'center' },
  hijoAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  hijoNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E', flex: 1 },
  estadoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20 },
  estadoChipText: { fontSize: 11, fontWeight: '700' },
  cameraContainer: { height: 220, borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 1.5, borderColor: '#E3ECF7' },
  permisoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  qrOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  qrFrame: { width: 140, height: 140, position: 'relative' },
  qrCorner: { position: 'absolute', width: 20, height: 20, borderColor: '#FFD700', borderWidth: 3 },
  qrCornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  qrCornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  qrCornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  qrCornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  btnAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15 },
  btnActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  seccionAccion: { backgroundColor: '#fff', borderRadius: 18, padding: 4 },
  seccionFin: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 },
  finIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E6F9EE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  finTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 6 },
  finDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  estRutaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  estRutaNombre: { fontSize: 14, fontWeight: '600', color: '#0D1B3E' },
  estRutaZona: { fontSize: 11, color: '#888', marginTop: 1 },
  btnEntregado: { backgroundColor: '#E6F9EE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  btnEntregadoText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
});
