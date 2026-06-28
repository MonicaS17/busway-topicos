// TODO: Integrar con Firebase Admin SDK
// Instalar: npm install firebase-admin
// Documentación: https://firebase.google.com/docs/cloud-messaging/send-message
async function sendPushNotification({ token, titulo, mensaje, data }) {
  console.log('[FIREBASE STUB] Notificación pendiente de integración:');
  console.log({ token, titulo, mensaje, data });
  // Reemplazar este bloque con la llamada real a Firebase Admin:
  // await admin.messaging().send({ token, notification: { title: titulo, body: mensaje }, data });
}

module.exports = { sendPushNotification };
