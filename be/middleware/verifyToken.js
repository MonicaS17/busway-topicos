const admin = require('firebase-admin');
const mongoose = require('mongoose');

let hasFirebase = false;
try {
  const serviceAccount = require('../serviceAccount.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  hasFirebase = true;
} catch (e) {
  console.warn("⚠️ Firebase Admin credentials not found. Using Mock Auth mode.");
}

// Middleware para verificar token Firebase o mock
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken = null;

    if (token.startsWith('mock_token_for_')) {
      const uid = token.replace('mock_token_for_', '');
      decodedToken = { uid };
    } else if (hasFirebase) {
      decodedToken = await admin.auth().verifyIdToken(token);
    } else {
      // Si no hay Firebase y es un token JWT real, decodificar el payload manualmente
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          decodedToken = {
            uid: payload.user_id || payload.uid || payload.sub,
            email: payload.email
          };
        } catch (e) {
          decodedToken = { uid: token };
        }
      } else {
        decodedToken = { uid: token };
      }
    }

    // Enriquecer req.user con datos de la BD de MongoDB
    const Usuario = mongoose.model('usuarios');
    let dbUser = await Usuario.findOne({ firebase_uid: decodedToken.uid });
    
    if (!dbUser) {
      // También intentar buscar por correo si el token de desarrollo contenía el correo
      dbUser = await Usuario.findOne({ correo: decodedToken.uid });
      if (dbUser) {
        decodedToken.uid = dbUser.firebase_uid;
      }
    }

    if (!dbUser) {
      // Si no existe, dejamos continuar (ej. para registro)
      req.user = decodedToken;
      return next();
    }

    req.user = {
      ...decodedToken,
      id: dbUser._id.toString(),
      tipo: dbUser.tipo,
    };

    if (dbUser.tipo === 'padre') {
      const Estudiante = require('../models/Estudiante');
      const estudiantes = await Estudiante.find({ padre_id: dbUser._id });
      req.user.hijos_ids = estudiantes.map(h => h._id.toString());
    }

    next();

  } catch (error) {
    console.error('Error en verifyToken:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = verifyToken;