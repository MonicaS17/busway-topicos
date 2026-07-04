const Usuario = require('../models/Usuario');

const requireRole = (...roles) => async (req, res, next) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!roles.includes(usuario.tipo)) return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(500).json({ error: 'No se pudo validar el rol del usuario' });
  }
};

module.exports = requireRole;
