const Viaje = require('../models/Viaje');
const Estudiante = require('../models/Estudiante');

// Obtener el viaje activo de un conductor
exports.getViajeActivoConductor = async (req, res) => {
  try {
    // Buscamos un viaje cuyo estado sea 'activo' o 'en_espera' para el conductor autenticado
    const viajeActivo = await Viaje.findOne({ 
      conductor_id: req.user.id, 
      estado: { $in: ['activo', 'en_espera'] } 
    });
    
    if (!viajeActivo) {
      return res.status(404).json({ mensaje: 'No hay ninguna ruta en progreso actualmente.' });
    }
    
    res.json(viajeActivo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el viaje activo.' });
  }
};

// Obtener el viaje activo para un padre (de sus estudiantes/hijos)
exports.getViajeActivoPadre = async (req, res) => {
  try {
    // Buscar estudiantes del padre usando el modelo estandarizado Estudiante
    const estudiantes = await Estudiante.find({ padre_id: req.user.id });
    if (!estudiantes || estudiantes.length === 0) {
      return res.json([]);
    }
    
    const conductorIds = estudiantes.map(e => e.conductor_id).filter(id => id);
    
    // Buscar viajes activos o en espera de estos conductores
    const viajesActivos = await Viaje.find({
      conductor_id: { $in: conductorIds },
      estado: { $in: ['activo', 'en_espera'] }
    });
    
    res.json(viajesActivos);
  } catch (error) {
    console.error('Error al obtener viaje activo para padre:', error);
    res.status(500).json({ error: 'Error al obtener el viaje activo.' });
  }
};

// Obtener el historial completo de viajes
exports.getHistorialViajes = async (req, res) => {
  try {
    const query = req.user.tipo === 'conductor' 
      ? { conductor_id: req.user.id } 
      // Lógica adaptada según rol
      : { 'asistencias.hijo_id': { $in: req.user.hijos_ids || [] } };

    const historial = await Viaje.find(query).sort({ hora_salida: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de viajes.' });
  }
};
