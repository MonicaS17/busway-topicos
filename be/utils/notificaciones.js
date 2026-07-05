const admin = require('../config/firebaseAdmin');

/**
 * Envía una notificación push a través de Firebase Admin SDK.
 * @param {Object} params
 * @param {string} params.token - Token FCM del destinatario
 * @param {string} params.titulo - Título de la notificación
 * @param {string} params.mensaje - Contenido/cuerpo de la notificación
 * @param {Object} [params.data] - Datos adicionales opcionales para la app
 */
async function sendPushNotification({ token, titulo, mensaje, data }) {
  // Validar token antes de llamar a Firebase
  if (!token || typeof token !== 'string' || token.length < 20) {
    console.log('[FCM] Token inválido o ausente, omitiendo.');
    return;
  }

  const serializedData = {};
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      serializedData[key] = String(value);
    }
  }

  const message = {
    token,
    notification: { title: titulo, body: mensaje },
    data: serializedData
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM] Enviada:', response);
  } catch (error) {
    // No lanzar excepción — el flujo del viaje no debe verse afectado
    console.warn('[FCM] Error no crítico:', error.code, error.message);
  }
}

module.exports = { sendPushNotification };
