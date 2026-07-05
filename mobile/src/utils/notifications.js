import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Obtener si es Expo Go
const esExpoGo = Constants.appOwnership === 'expo';
const habilitado = !esExpoGo && Device.isDevice;

/**
 * Inicializa la configuración de notificaciones push de forma segura
 */
export async function inicializarNotificaciones() {
  if (esExpoGo || !Device.isDevice) {
    console.log('[FCM] Notificaciones deshabilitadas en Expo Go / Simulador.');
    console.log('[FCM] Para probar: npx expo run:android');
    return null;
  }

  try {
    // Configuración para mostrar las notificaciones cuando la app está en primer plano (foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[FCM] Permiso para notificaciones push denegado.');
      return null;
    }

    // Obtener token FCM nativo
    let token = null;
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('[FCM] Token FCM nativo obtenido:', token);
    } catch (error) {
      console.error('[FCM] Error obteniendo token nativo:', error);
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync();
        token = expoToken.data;
        console.log('[FCM] Expo Push Token obtenido (fallback):', token);
      } catch (err) {
        console.error('[FCM] Error al obtener Expo Push Token:', err);
      }
    }

    // Registrar listeners
    Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      console.log('[FCM] Notificación recibida en foreground:', title, body);
    });

    // Guardado de token en backend omitido por ahora en esta iteración.
    console.log('[FCM] Inicialización completada con éxito.');
    return token;
  } catch (error) {
    console.error('[FCM] Error en inicializarNotificaciones:', error);
    return null;
  }
}

/**
 * Funciones auxiliares heredadas para compatibilidad con otras pantallas
 */
export async function registerForPushNotificationsAsync() {
  if (!habilitado) return null;
  return registerForPushNotificationsAsyncInternal();
}

async function registerForPushNotificationsAsyncInternal() {
  let token;
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    token = deviceToken.data;
  } catch (e) {
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync();
      token = expoToken.data;
    } catch (err) {}
  }
  return token;
}

export async function registerAndSaveTokenAsync() {
  console.log('[Notificaciones] registerAndSaveTokenAsync: Omitido guardar el token FCM en la base de datos en esta iteración.');
  return null;
}

export function addNotificationReceivedListener(handler) {
  if (!habilitado) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseReceivedListener(handler) {
  if (!habilitado) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(handler);
}
