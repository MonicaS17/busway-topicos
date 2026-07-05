const Usuario = require('../models/Usuario');
const Vehiculo = require('../models/Vehiculo');

// GET perfil completo del conductor y su vehículo asignado
exports.getDatosConductor = async (req, res) => {
  try {
    // Buscamos al conductor por su uid de Firebase
    const conductor = await Usuario.findOne({ firebase_uid: req.user.uid });
    
    if (!conductor || conductor.tipo !== 'conductor') {
      return res.status(444).json({ error: 'Conductor no encontrado o el usuario no es un conductor' });
    }

    // Buscamos el vehículo asociado a su ID de MongoDB
    const vehiculo = await Vehiculo.findOne({ conductor_id: conductor._id });

    res.json({
      conductor,
      vehiculo: vehiculo || null // Si aún no tiene carro, devuelve null de forma segura
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener los datos del conductor' });
  }
};

// PATCH para actualizar datos específicos (como el teléfono o zona de cobertura)
exports.actualizarPerfilConductor = async (req, res) => {
  try {
    const { telefono, zona_cobertura, horario_inicio, foto_perfil } = req.body;

    //Actualizamos los campos dinámicos dentro del objeto datos_conductor
    const conductorActualizado = await Usuario.findOneAndUpdate(
      { firebase_uid: req.user.uid },
      {
        $set: {
          foto_perfil: foto_perfil || undefined, // Por si cambia su foto
          "datos_conductor.telefono": telefono,
          "datos_conductor.zona_cobertura": zona_cobertura,
          "datos_conductor.horario_inicio": horario_inicio
        }
      },
      { returnDocument: 'after' } //Para que devuelva el documento con los cambios aplicados
    );

    if (!conductorActualizado) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ mensaje: 'Perfil actualizado con éxito', conductor: conductorActualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al actualizar el perfil' });
  }
};