const mongoose = require('mongoose');

// Cadena de conexión base
const ATLAS_URI = 'mongodb+srv://monica_s17:Monica.s170305@cluster0.ndyjoor.mongodb.net/?appName=Cluster0';

async function listDbs() {
  console.log('🔌 Conectando a MongoDB Atlas para listar bases de datos...');
  try {
    const conn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✓ Conectado!');

    // Listar las bases de datos en el cluster
    const adminDb = conn.db.admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('\n=== Bases de Datos en tu Atlas Cluster ===');
    for (const dbInfo of dbs.databases) {
      console.log(`- Nombre: ${dbInfo.name} | Tamaño en disco: ${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      
      // Conectar a esta base de datos específica para ver colecciones
      const tempConn = await mongoose.createConnection(`${ATLAS_URI.replace('/?', `/${dbInfo.name}?`)}`).asPromise();
      const cols = await tempConn.db.listCollections().toArray();
      console.log(`  Colecciones: [${cols.map(c => c.name).join(', ')}]`);
      
      if (cols.some(c => c.name === 'usuarios')) {
        const count = await tempConn.collection('usuarios').countDocuments({});
        console.log(`  🎯 Usuarios en esta bd: ${count}`);
      }
      await tempConn.close();
      console.log('----------------------------------------------------');
    }

    await conn.close();
  } catch (err) {
    console.error('❌ Error de diagnóstico:', err.message);
  }
}

listDbs();
