const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const viajesController = require('../controllers/viajesController');

// Obtener el viaje activo de un conductor
router.get('/activo/conductor', verifyToken, viajesController.getViajeActivoConductor);

// Obtener el viaje activo para un padre (de sus hijos)
router.get('/activo/padre', verifyToken, viajesController.getViajeActivoPadre);

// Obtener el historial completo de viajes
router.get('/historial', verifyToken, viajesController.getHistorialViajes);

module.exports = router;