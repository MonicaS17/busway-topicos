const mongoose = require('mongoose');

// Tu cadena de conexión a Atlas con /busway
const ATLAS_URI = 'mongodb+srv://monica_s17:Monica.s170305@cluster0.ndyjoor.mongodb.net/busway?appName=Cluster0';

async function testConnection() {
  console.log('🔌 Conectando a MongoDB Atlas...');
  try {
    const conn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✓ Conexión exitosa a Atlas!');

    // Consultar directamente la colección 'usuarios'
    const usuarios = await conn.collection('usuarios').find({}).toArray();
    console.log(`\n👥 Total de usuarios encontrados: ${usuarios.length}`);
    
    console.log('\n--- Detalle de Usuarios ---');
    usuarios.forEach(u => {
      console.log(`- Nombre: ${u.nombre} ${u.apellido} | Correo: ${u.correo} | UID: ${u.firebase_uid} | Tipo: ${u.tipo}`);
    });

    const targetUid = 'K6kmqKa9IHNuGZEkwHXh3ijs3rq1';
    const findByUid = usuarios.find(u => u.firebase_uid === targetUid);
    
    if (findByUid) {
      console.log(`\n🎯 ✓ El usuario con UID ${targetUid} existe en Atlas!`);
    } else {
      console.log(`\n❌ ERROR: El usuario con UID ${targetUid} NO se encuentra en Atlas.`);
    }

    await conn.close();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

testConnection();
