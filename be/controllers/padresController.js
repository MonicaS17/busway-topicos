const Usuario = require('../models/Usuario');
const Hijo = require('../models/Estudiante');

exports.getHijos = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ firebase_uid: req.user.uid });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const hijos = await Hijo.find({ padre_id: usuario._id });
    res.json({ hijos });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener hijos' });
  }
};