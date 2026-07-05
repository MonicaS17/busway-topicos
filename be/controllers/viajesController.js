const Viaje = require('../models/Viaje');
const Estudiante = require('../models/Estudiante');

// Obtener el viaje activo de un conductor
// Filtra ÚNICAMENTE por estado: 'activo'. Si no existe → 404 limpio.
exports.getViajeActivoConductor = async (req, res) => {
  try {
    const Ruta = require('../models/Ruta');
    const ruta = await Ruta.findOne({ conductor_id: req.user.id });
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no asignada a este conductor.' });
    }

    const { calcularFaseRuta } = require('../utils/viajeHelper');
    const fase = await calcularFaseRuta(ruta._id);

    let viajeActivo = null;
    if (fase === 'en_curso') {
      viajeActivo = await Viaje.findOne({
        ruta_id: ruta._id,
        estado: 'activo'
      });
    }

    return res.json({
      viaje: viajeActivo,
      fase: fase === 'en_curso' ? 'activo' : fase
    });
  } catch (error) {
    console.error('Error al obtener el viaje activo del conductor:', error);
    res.status(500).json({ error: 'Error al obtener el viaje activo.' });
  }
};

// Obtener el viaje activo para un padre
// Filtra con lógica estricta y fases según el día actual.
exports.getViajeActivoPadre = async (req, res) => {
  try {
    const Estudiante = require('../models/Estudiante');
    const Viaje = require('../models/Viaje');

    // Obtener los hijos del padre
    const parentId = req.user.id || req.user._id;
    const hijos = await Estudiante.find({
      padre_id: parentId
    }).select('ruta_id conductor_id');

    if (!hijos.length) {
      return res.json({ viaje: null, fase: 'sin_viaje' });
    }

    // Si viene ruta_id como query param, usar ese
    //    Si no, buscar en todas las rutas de los hijos
    const rutaIds = req.query.ruta_id
      ? [req.query.ruta_id]
      : hijos.map(h => h.ruta_id).filter(Boolean);

    if (!rutaIds.length) {
      return res.json({ viaje: null, fase: 'sin_viaje' });
    }

    const rutaId = rutaIds[0];

    const { calcularFaseRuta } = require('../utils/viajeHelper');
    const fase = await calcularFaseRuta(rutaId);

    let viajeActivo = null;
    if (fase === 'en_curso') {
      viajeActivo = await Viaje.findOne({
        ruta_id: rutaId,
        estado: 'activo'
      }).populate('ruta_id', 'nombre_ruta zona horario_salida');
    }

    res.json({ viaje: viajeActivo, fase });
  } catch (error) {
    console.error('Error en getViajeActivoPadre:', error);
    res.status(500).json({ error: 'Error interno al obtener el viaje activo.' });
  }
};

// Obtener el historial completo de viajes
exports.getHistorialViajes = async (req, res) => {
  try {
    const query = req.user.tipo === 'conductor'
      ? { conductor_id: req.user.id }
      : { 'asistencias.hijo_id': { $in: req.user.hijos_ids || [] } };

    const historial = await Viaje.find(query).sort({ hora_salida: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de viajes.' });
  }
};
