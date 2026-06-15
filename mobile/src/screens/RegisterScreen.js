import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
  Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { reconocerTexto } from '../config/vision';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';
import {
  validarCorreo, validarContrasena,
  validarTelefono, mensajeFirebase
} from '../utils/validaciones';

export default function RegisterScreen({ navigation, route }) {
  const { tipo } = route.params;
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [modoCamara, setModoCamara] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Datos básicos
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estados OCR
  const [cedulaOcrValidada, setCedulaOcrValidada] = useState(false);
  const [licenciaOcrValidada, setLicenciaOcrValidada] = useState(false);
  const [letraLicencia, setLetraLicencia] = useState('');
  const [facialVerificado, setFacialVerificado] = useState(false);

  // Datos del vehículo
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [numAsientos, setNumAsientos] = useState('');

  // Estado simulación ATTT
  const [estadoATTT, setEstadoATTT] = useState(null);
  const [verificandoATTT, setVerificandoATTT] = useState(false);

  const totalPasos = tipo === 'conductor' ? 5 : 3;

  // ── VALIDAR PASO 1 ──────────────────────────────────────
  const validarPaso1 = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre');
      return false;
    }
    if (!apellido.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu apellido');
      return false;
    }
    if (!correo.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu correo electrónico');
      return false;
    }
    if (!validarCorreo(correo)) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido (ej: nombre@correo.com)');
      return false;
    }
    if (!contrasena.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa una contraseña');
      return false;
    }
    if (!validarContrasena(contrasena)) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (tipo === 'conductor') {
      if (!telefono.trim()) {
        Alert.alert('Campo requerido', 'Por favor ingresa tu teléfono de contacto');
        return false;
      }
      if (!validarTelefono(telefono)) {
        Alert.alert('Teléfono inválido', 'El formato debe ser: 6500-1234');
        return false;
      }
    }
    return true;
  };

  // ── VALIDAR PASO VEHÍCULO ────────────────────────────────
  const validarPasoVehiculo = () => {
    if (tipo === 'padre') return true;
    if (!placa.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la placa del bus');
      return false;
    }
    if (!marca.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la marca del bus');
      return false;
    }
    if (!modelo.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el modelo del bus');
      return false;
    }
    if (!anio.trim() || isNaN(anio) || anio.length !== 4) {
      Alert.alert('Año inválido', 'Por favor ingresa un año válido (ej: 2018)');
      return false;
    }
    if (!numAsientos.trim() || isNaN(numAsientos)) {
      Alert.alert('Campo requerido', 'Por favor ingresa el número de asientos');
      return false;
    }
    return true;
  };

  // ── SIMULACIÓN ATTT ──────────────────────────────────────
  const simularVerificacionATTT = async () => {
    if (!validarPasoVehiculo()) return;
    setVerificandoATTT(true);

    setEstadoATTT('pendiente');
    await new Promise(r => setTimeout(r, 5000));

    setEstadoATTT('en_revision');
    await new Promise(r => setTimeout(r, 5000));

    setEstadoATTT('aprobado');
    await new Promise(r => setTimeout(r, 5000));

    setVerificandoATTT(false);
    setPaso(5);
  };

  // ── ABRIR CÁMARA ─────────────────────────────────────────
  const escanearDocumento = async (modoEscaneo) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear tu documento');
        return;
      }
    }
    setModoCamara(modoEscaneo);
    setCamaraActiva(true);
  };

  const verificarRostro = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para verificar tu identidad');
        return;
      }
    }
    setModoCamara('facial');
    setCamaraActiva(true);
  };

  // ── TOMAR FOTO ───────────────────────────────────────────
  const tomarFoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'La cámara no está lista. Intenta de nuevo.');
      return;
    }
    try {
      setCargando(true);
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCamaraActiva(false);
      const texto = await reconocerTexto(foto.uri);
      console.log('📄 Texto reconocido:', texto);
      if (modoCamara === 'cedula') procesarOCRCedula(texto);
      else if (modoCamara === 'licencia') procesarOCRLicencia(texto);
    } catch (_error) {
      Alert.alert('Error', `No pudimos leer el documento: ${_error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const capturarRostro = async () => {
    if (!cameraRef.current) return;
    try {
      setCargando(true);
      await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCamaraActiva(false);
      setFacialVerificado(true);
      Alert.alert('✅ Identidad verificada', 'Tu rostro fue verificado correctamente');
    } catch (_error) {
      Alert.alert('Error', 'No pudimos verificar tu identidad. Intenta de nuevo');
    } finally {
      setCargando(false);
    }
  };

  // ── OCR CÉDULA ───────────────────────────────────────────
  const procesarOCRCedula = (texto) => {
    const cedulaRegex = /\d{1,2}-\d{3,4}-\d{1,6}|E-\d{1,2}-\d{1,6}|PE-\d{3,4}-\d{1,6}/;
    const cedulaEncontrada = texto.match(cedulaRegex);
    if (!cedulaEncontrada) {
      Alert.alert('No pudimos leer la cédula', 'Asegúrate de que la cédula esté bien iluminada y enfocada, luego intenta de nuevo');
      return;
    }
    setCedula(cedulaEncontrada[0]);
    setCedulaOcrValidada(true);
    Alert.alert('✅ Cédula verificada', `Cédula detectada: ${cedulaEncontrada[0]}\nVerifica que sea correcta.`);
  };

  // ── OCR LICENCIA ─────────────────────────────────────────
  const procesarOCRLicencia = (texto) => {
    const letrasPermitidas = ['E1', 'E2', 'E3'];
    const letraEncontrada = letrasPermitidas.find(l => texto.includes(l));

    if (!letraEncontrada) {
      Alert.alert(
        'Licencia no válida',
        'Tu licencia no tiene una letra permitida para conducir buses escolares en Panamá.\n\nLetras permitidas: E1, E2, E3\n\nSi crees que es un error, asegúrate de que la licencia esté bien iluminada e intenta de nuevo.'
      );
      return;
    }

    const cedulaRegex = /\d{1,2}-\d{3,4}-\d{1,6}|E-\d{1,2}-\d{1,6}|PE-\d{3,4}-\d{1,6}/;
    const cedulaEnLicencia = texto.match(cedulaRegex);

    if (cedulaEnLicencia && cedula && cedulaEnLicencia[0] !== cedula) {
      Alert.alert(
        '⚠️ Cédula no coincide',
        `La cédula de la licencia (${cedulaEnLicencia[0]}) no coincide con la cédula que escaneaste (${cedula}).\n\nAsegúrate de usar tu propia licencia.`
      );
      return;
    }

    setLetraLicencia(letraEncontrada);
    setLicenciaOcrValidada(true);
    Alert.alert('✅ Licencia válida', `Tu licencia tiene letra ${letraEncontrada}, permitida para conducir buses escolares en Panamá.`);
  };

  // ── REGISTRO FINAL ───────────────────────────────────────
  const handleRegister = async () => {
    try {
      setCargando(true);
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const firebase_uid = userCredential.user.uid;

      await api.post('/api/auth/register', {
        firebase_uid, nombre, apellido, correo, cedula, tipo,
        datos_conductor: tipo === 'conductor' ? {
          telefono,
          escuelas_ids: [],
          zona_cobertura: '',
          horario_inicio: '',
          cedula_ocr_validada: cedulaOcrValidada,
          licencia_ocr_validada: licenciaOcrValidada,
          estado_verificacion_att: 'aprobado',
          calificacion_promedio: 0,
          total_resenas: 0,
          metodo_pago: null
        } : null,
        datos_padre: tipo === 'padre' ? {
          cedula_ocr_validada: cedulaOcrValidada,
          facial_verificado: facialVerificado,
          stripe_customer_id: '',
          token_tarjeta: '',
          ultimos_4_digitos: '',
          hijos: []
        } : null,
        vehiculo: tipo === 'conductor' ? {
          placa, marca, modelo,
          anio: parseInt(anio, 10),
          num_asientos: parseInt(numAsientos, 10),
          estado_verificacion: 'aprobado',
          fecha_vencimiento_verificacion: null
        } : null
      });

      Alert.alert(
        '🎉 ¡Registro exitoso!',
        tipo === 'conductor'
          ? 'Tu cuenta fue creada y verificada por la ATTT. Ya puedes iniciar sesión.'
          : 'Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.',
        [{ text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }]
      );

    } catch (error) {
      if (error.response) {
        Alert.alert('Error del Servidor', JSON.stringify(error.response.data));
      } else if (error.request) {
        Alert.alert('Error de Red', 'No se pudo conectar con el servidor de BusWay.');
      } else {
        Alert.alert('Error en el registro', mensajeFirebase(error.code));
      }
      console.error('Register error:', error);
    } finally {
      setCargando(false);
    }
  };

  // ── VISTA CÁMARA ─────────────────────────────────────────
  if (camaraActiva) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={modoCamara === 'facial' ? 'front' : 'back'}
        />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>
            {modoCamara === 'cedula' && '📄 Apunta al frente de tu cédula'}
            {modoCamara === 'licencia' && '🪪 Apunta al frente de tu licencia'}
            {modoCamara === 'facial' && '🤳 Centra tu rostro en la pantalla'}
          </Text>
          <View style={styles.cameraFrame} />
          <TouchableOpacity
            style={styles.btnCapturar}
            onPress={modoCamara === 'facial' ? capturarRostro : tomarFoto}
          >
            <Text style={styles.btnCapturarText}>
              {cargando ? 'Procesando...' : '📸 Capturar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancelarCamara} onPress={() => setCamaraActiva(false)}>
            <Text style={styles.btnCancelarCamaraText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── BOTONES DE NAVEGACIÓN REUTILIZABLES ──────────────────
  const BotonAtras = ({ onPress }) => (
    <TouchableOpacity style={styles.btnAtras} onPress={onPress}>
      <Text style={styles.btnAtrasArrow}>‹</Text>
    </TouchableOpacity>
  );

  // ── PASO 1: DATOS BÁSICOS ────────────────────────────────
  const renderPaso1 = () => (
    <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.pasoTitulo}>Datos personales</Text>
      <Text style={styles.pasoDesc}>Ingresa tu información personal. Tu cédula se verificará en el siguiente paso.</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="#aaa" value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Apellido *</Text>
      <TextInput style={styles.input} placeholder="Tu apellido" placeholderTextColor="#aaa" value={apellido} onChangeText={setApellido} />

      <Text style={styles.label}>Correo electrónico *</Text>
      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        placeholderTextColor="#aaa"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Contraseña *</Text>
      <TextInput
        style={styles.input}
        placeholder="Mínimo 6 caracteres"
        placeholderTextColor="#aaa"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
      />

      {tipo === 'conductor' && (
        <>
          <Text style={styles.label}>Teléfono de contacto *</Text>
          <TextInput
            style={styles.input}
            placeholder="6500-1234"
            placeholderTextColor="#aaa"
            value={telefono}
            onChangeText={(text) => {
              const limpio = text.replace(/[^0-9-]/g, '');
              setTelefono(limpio);
            }}
            keyboardType="default"
            maxLength={9}
          />
          <Text style={styles.hint}>Este número será visible para los padres en el marketplace</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.btnNext}
        onPress={() => { if (validarPaso1()) setPaso(2); }}
      >
        <Text style={styles.btnNextText}>Continuar →</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── PASO 2: OCR CÉDULA ───────────────────────────────────
  const renderPaso2 = () => (
    <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.pasoTitulo}>Verificación de cédula</Text>
      <Text style={styles.pasoDesc}>Escanea tu cédula para verificar tu identidad.</Text>

      <View style={styles.ocrCard}>
        <View style={styles.ocrIconCircle}>
          <Text style={styles.ocrIcon}>🪪</Text>
        </View>
        <Text style={styles.ocrTitle}>Cédula de identidad</Text>
        <Text style={styles.ocrDesc}>Asegúrate de tener buena iluminación y que la cédula esté enfocada y completa en la pantalla</Text>

        {cedulaOcrValidada ? (
          <View style={styles.validadoBadge}>
            <Text style={styles.validadoText}>✅ Cédula verificada — {cedula}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnOcr} onPress={() => escanearDocumento('cedula')}>
            <Text style={styles.btnOcrText}>📷 Escanear cédula</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.botonesNav}>
        <BotonAtras onPress={() => setPaso(1)} />
        <TouchableOpacity
          style={[styles.btnNext, { flex: 1 }, !cedulaOcrValidada && styles.btnDisabled]}
          onPress={() => {
            if (cedulaOcrValidada) setPaso(3);
            else Alert.alert('Requerido', 'Debes escanear tu cédula para continuar');
          }}
        >
          <Text style={styles.btnNextText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ── PASO 3: OCR LICENCIA o FACIAL ───────────────────────
  const renderPaso3 = () => (
    <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 60 }}>
      {tipo === 'conductor' ? (
        <>
          <Text style={styles.pasoTitulo}>Verificación de licencia</Text>
          <Text style={styles.pasoDesc}>La ATTT exige licencia con letra E1, E2 o E3 para conducir buses escolares en Panamá</Text>

          <View style={styles.ocrCard}>
            <View style={styles.ocrIconCircle}>
              <Text style={styles.ocrIcon}>🪪</Text>
            </View>
            <Text style={styles.ocrTitle}>Licencia de conducir</Text>
            <Text style={styles.ocrDesc}>El sistema verificará que tu licencia tenga letra E1, E2 o E3 y que coincida con tu cédula</Text>

            {licenciaOcrValidada ? (
              <View style={styles.validadoBadge}>
                <Text style={styles.validadoText}>✅ Licencia verificada — letra {letraLicencia}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnOcr} onPress={() => escanearDocumento('licencia')}>
                <Text style={styles.btnOcrText}>📷 Escanear licencia</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.pasoTitulo}>Verificación de identidad</Text>
          <Text style={styles.pasoDesc}>Necesitamos verificar tu identidad mediante reconocimiento facial</Text>

          <View style={styles.ocrCard}>
            <View style={styles.ocrIconCircle}>
              <Text style={styles.ocrIcon}>🤳</Text>
            </View>
            <Text style={styles.ocrTitle}>Reconocimiento facial</Text>
            <Text style={styles.ocrDesc}>Colócate en un lugar bien iluminado y mira directamente a la cámara frontal</Text>

            {facialVerificado ? (
              <View style={styles.validadoBadge}>
                <Text style={styles.validadoText}>✅ Identidad verificada</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnOcr} onPress={verificarRostro}>
                <Text style={styles.btnOcrText}>🤳 Verificar identidad</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <View style={styles.botonesNav}>
        <BotonAtras onPress={() => setPaso(2)} />
        <TouchableOpacity
          style={[
            styles.btnNext, { flex: 1 },
            !(tipo === 'conductor' ? licenciaOcrValidada : facialVerificado) && styles.btnDisabled
          ]}
          onPress={() => {
            const validado = tipo === 'conductor' ? licenciaOcrValidada : facialVerificado;
            if (validado) setPaso(4);
            else Alert.alert(
              'Requerido',
              tipo === 'conductor'
                ? 'Debes escanear tu licencia para continuar'
                : 'Debes verificar tu identidad para continuar'
            );
          }}
        >
          <Text style={styles.btnNextText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ── PASO 4: VEHÍCULO (conductor) o RESUMEN (padre) ──────
  const renderPaso4 = () => (
    <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 60 }}>
      {tipo === 'conductor' ? (
        <>
          <Text style={styles.pasoTitulo}>Datos del bus</Text>
          <Text style={styles.pasoDesc}>Esta información será verificada por el sistema según los registros de la ATTT</Text>

          <Text style={styles.label}>Placa *</Text>
          <TextInput style={styles.input} placeholder="BC-1234" placeholderTextColor="#aaa" value={placa} onChangeText={setPlaca} autoCapitalize="characters" />

          <Text style={styles.label}>Marca *</Text>
          <TextInput style={styles.input} placeholder="Toyota" placeholderTextColor="#aaa" value={marca} onChangeText={setMarca} />

          <Text style={styles.label}>Modelo *</Text>
          <TextInput style={styles.input} placeholder="Coaster" placeholderTextColor="#aaa" value={modelo} onChangeText={setModelo} />

          <Text style={styles.label}>Año *</Text>
          <TextInput style={styles.input} placeholder="2018" placeholderTextColor="#aaa" value={anio} onChangeText={setAnio} keyboardType="numeric" maxLength={4} />

          <Text style={styles.label}>Número de asientos *</Text>
          <TextInput style={styles.input} placeholder="20" placeholderTextColor="#aaa" value={numAsientos} onChangeText={setNumAsientos} keyboardType="numeric" />

          {/* Simulación ATTT */}
          {verificandoATTT || estadoATTT ? (
            <View style={styles.atttCard}>
              <Text style={styles.atttTitulo}>Verificación ATTT</Text>

              <View style={styles.atttEstado}>
                <View style={[styles.atttDot, estadoATTT === 'pendiente' || estadoATTT === 'en_revision' || estadoATTT === 'aprobado' ? styles.dotActivo : styles.dotInactivo]} />
                <Text style={[styles.atttTexto, estadoATTT === 'pendiente' && styles.atttTextoActivo]}>Pendiente</Text>
                {estadoATTT === 'pendiente' && <ActivityIndicator size="small" color="#FFD700" style={{ marginLeft: 8 }} />}
              </View>

              <View style={styles.atttLinea} />

              <View style={styles.atttEstado}>
                <View style={[styles.atttDot, estadoATTT === 'en_revision' || estadoATTT === 'aprobado' ? styles.dotActivo : styles.dotInactivo]} />
                <Text style={[styles.atttTexto, estadoATTT === 'en_revision' && styles.atttTextoActivo]}>En revisión</Text>
                {estadoATTT === 'en_revision' && <ActivityIndicator size="small" color="#FFD700" style={{ marginLeft: 8 }} />}
              </View>

              <View style={styles.atttLinea} />

              <View style={styles.atttEstado}>
                <View style={[styles.atttDot, estadoATTT === 'aprobado' ? styles.dotAprobado : styles.dotInactivo]} />
                <Text style={[styles.atttTexto, estadoATTT === 'aprobado' && styles.atttTextoAprobado]}>
                  {estadoATTT === 'aprobado' ? '✅ Aprobado' : 'Aprobado'}
                </Text>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.pasoTitulo}>¡Todo listo!</Text>
          <Text style={styles.pasoDesc}>Tu cuenta está lista para ser creada. Podrás agregar a tus hijos después de iniciar sesión.</Text>

          <View style={styles.resumenCard}>
            <Text style={styles.resumenItem}>✅ Datos personales</Text>
            <Text style={styles.resumenItem}>✅ Cédula verificada — {cedula}</Text>
            <Text style={styles.resumenItem}>✅ Identidad verificada</Text>
            <Text style={styles.resumenItem}>💳 Tarjeta — se registra al contratar servicio</Text>
          </View>
        </>
      )}

      <View style={styles.botonesNav}>
        <BotonAtras onPress={() => setPaso(3)} />
        {tipo === 'conductor' ? (
          <TouchableOpacity
            style={[styles.btnNext, { flex: 1 }, verificandoATTT && styles.btnDisabled]}
            onPress={simularVerificacionATTT}
            disabled={verificandoATTT}
          >
            {verificandoATTT
              ? <ActivityIndicator color="#0D1B3E" />
              : <Text style={styles.btnNextText}>Verificar con ATTT →</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnNext, { flex: 1 }, cargando && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator color="#0D1B3E" />
              : <Text style={styles.btnNextText}>Crear cuenta</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  // ── PASO 5: CONFIRMACIÓN FINAL (solo conductor) ──────────
  const renderPaso5 = () => (
    <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.pasoTitulo}>¡Todo verificado!</Text>
      <Text style={styles.pasoDesc}>Tus datos fueron aprobados por la ATTT. Tu cuenta está lista.</Text>

      <View style={styles.resumenCard}>
        <Text style={styles.resumenItem}>✅ Datos personales</Text>
        <Text style={styles.resumenItem}>✅ Cédula verificada — {cedula}</Text>
        <Text style={styles.resumenItem}>✅ Licencia letra {letraLicencia}</Text>
        <Text style={styles.resumenItem}>✅ Bus registrado — {placa}</Text>
        <Text style={styles.resumenItem}>✅ Verificación ATTT aprobada</Text>
      </View>

      <TouchableOpacity
        style={[styles.btnNext, { marginTop: 24 }, cargando && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={cargando}
      >
        {cargando
          ? <ActivityIndicator color="#0D1B3E" />
          : <Text style={styles.btnNextText}>Crear cuenta</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B3E" />

      {/* Header azul con botón de regreso y progreso */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
            <Text style={styles.btnVolverArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.pasoLabel}>Paso {paso} de {totalPasos}</Text>
        </View>

        <Text style={styles.headerTitle}>
          {tipo === 'conductor' ? 'Registro — Conductor' : 'Registro — Padre de familia'}
        </Text>

        <View style={styles.pasos}>
          {Array.from({ length: totalPasos }).map((_, i) => (
            <View key={i} style={[styles.pasoBar, paso >= i + 1 && styles.pasoBarActivo]} />
          ))}
        </View>
      </View>

      {/* Card blanca con el contenido del paso */}
      <View style={styles.card}>
        {paso === 1 && renderPaso1()}
        {paso === 2 && renderPaso2()}
        {paso === 3 && renderPaso3()}
        {paso === 4 && renderPaso4()}
        {paso === 5 && renderPaso5()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B3E' },

  // Header
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: '6%',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  btnVolver: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnVolverArrow: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 14 },
  pasos: { flexDirection: 'row', gap: 6 },
  pasoBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  pasoBarActivo: { backgroundColor: '#FFD700' },
  pasoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  form: { flex: 1, paddingHorizontal: '7%', paddingTop: 28 },

  pasoTitulo: { fontSize: 22, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 6 },
  pasoDesc: { fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, color: '#555', marginBottom: 8, marginTop: 14, fontWeight: '600' },
  hint: { fontSize: 12, color: '#aaa', marginTop: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#eee', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, backgroundColor: '#f9fafb', color: '#0D1B3E',
  },

  // Botones de navegación
  btnNext: {
    backgroundColor: '#FFD700', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnNextText: { color: '#0D1B3E', fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  botonesNav: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 40 },
  btnAtras: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: '#F5F8FC', borderWidth: 1.5, borderColor: '#E3ECF7',
    alignItems: 'center', justifyContent: 'center',
  },
  btnAtrasArrow: { color: '#0D1B3E', fontSize: 28, fontWeight: '600', marginTop: -2 },

  // OCR Card
  ocrCard: {
    backgroundColor: '#F5F8FC', borderRadius: 20,
    padding: 28, alignItems: 'center', marginTop: 8,
    borderWidth: 1.5, borderColor: '#E3ECF7',
  },
  ocrIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0D1B3E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  ocrIcon: { fontSize: 32 },
  ocrTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 8 },
  ocrDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  btnOcr: {
    backgroundColor: '#0D1B3E', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 20,
  },
  btnOcrText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  validadoBadge: {
    backgroundColor: '#E1F5EE', borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 20, marginTop: 20,
  },
  validadoText: { color: '#0F6E56', fontSize: 14, fontWeight: '600' },

  // Resumen
  resumenCard: {
    backgroundColor: '#F5F8FC', borderRadius: 20,
    padding: 24, marginTop: 16, gap: 14,
    borderWidth: 1.5, borderColor: '#E3ECF7',
  },
  resumenItem: { fontSize: 15, color: '#333' },

  // ATTT
  atttCard: {
    backgroundColor: '#F5F8FC', borderRadius: 20,
    padding: 24, marginTop: 24,
    borderWidth: 1.5, borderColor: '#E3ECF7',
  },
  atttTitulo: { fontSize: 16, fontWeight: 'bold', color: '#0D1B3E', marginBottom: 16 },
  atttEstado: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  atttDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  dotActivo: { backgroundColor: '#FFD700' },
  dotAprobado: { backgroundColor: '#1D9E75' },
  dotInactivo: { backgroundColor: '#ddd' },
  atttTexto: { fontSize: 15, color: '#999' },
  atttTextoActivo: { color: '#0D1B3E', fontWeight: '600' },
  atttTextoAprobado: { color: '#1D9E75', fontWeight: '600' },
  atttLinea: { width: 2, height: 20, backgroundColor: '#eee', marginLeft: 6, marginVertical: 2 },

  // Cámara
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraOverlay: {
    flex: 1, alignItems: 'center',
    justifyContent: 'space-between', padding: 40,
  },
  cameraTitle: {
    color: '#fff', fontSize: 18, fontWeight: 'bold',
    textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12, borderRadius: 10,
  },
  cameraFrame: {
    width: 280, height: 180,
    borderWidth: 2, borderColor: '#FFD700', borderRadius: 12,
  },
  btnCapturar: {
    backgroundColor: '#FFD700', borderRadius: 50,
    paddingVertical: 16, paddingHorizontal: 40,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnCapturarText: { color: '#0D1B3E', fontSize: 16, fontWeight: 'bold' },
  btnCancelarCamara: { paddingVertical: 10 },
  btnCancelarCamaraText: { color: '#fff', fontSize: 15 },
});