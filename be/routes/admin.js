const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const Log = require('../models/Log');

router.use(verifyToken, requireRole('administrador'));

router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const logs = await Log.find()
      .populate('usuario_id', 'nombre apellido correo tipo')
      .sort({ fecha: -1 })
      .limit(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener el historial de actividad' });
  }
});

module.exports = router;
