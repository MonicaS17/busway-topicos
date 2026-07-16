const mongoose = require('mongoose');

// =========================================================================
// CONFIGURACIÓN DE CONEXIÓN
// =========================================================================

// 1. Tu base de datos local (se lee de tu .env o por defecto)
const LOCAL_URI = 'mongodb://localhost:27017/busway';

// 2. REEMPLAZA ESTO con tu cadena de conexión de MongoDB Atlas (copiada de la consola de Atlas)
// Debe tener el formato: mongodb+srv://<usuario>:<contraseña>@cluster0.xxxx.mongodb.net/busway
const ATLAS_URI = 'mongodb+srv://monica_s17:Monica.s170305@cluster0.ndyjoor.mongodb.net/busway?appName=Cluster0';

async function iniciarMigracion() {
  if (ATLAS_URI.includes('<USUARIO>') || ATLAS_URI.includes('<TU_CLUSTER>')) {
    console.error('❌ ERROR: Debes configurar tu cadena de conexión de MongoDB Atlas (ATLAS_URI) en la línea 11 de este archivo.');
    process.exit(1);
  }

  console.log('🚀 Iniciando migración de base de datos local a la nube...');
  
  let localConn, atlasConn;
  try {
    // Conectar a MongoDB Local
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✓ Conectado a MongoDB Local');

    // Conectar a MongoDB Atlas (Nube)
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✓ Conectado a MongoDB Atlas (Nube)');

    // Obtener la lista de colecciones locales
    const collections = await localConn.db.listCollections().toArray();
    console.log(`📋 Se encontraron ${collections.length} colecciones para migrar.\n`);

    for (const col of collections) {
      const colName = col.name;

      // Omitir colecciones del sistema de MongoDB
      if (colName.startsWith('system.')) continue;

      console.log(`⏳ Migrando colección [${colName}]...`);
      
      // Obtener todos los documentos de la colección local
      const docs = await localConn.collection(colName).find({}).toArray();
      console.log(`   - Encontrados ${docs.length} documentos locales.`);

      if (docs.length > 0) {
        // Limpiar la colección en Atlas para evitar duplicados en re-ejecuciones
        await atlasConn.collection(colName).deleteMany({});
        
        // Insertar los documentos en Atlas
        await atlasConn.collection(colName).insertMany(docs);
        console.log(`   ✓ Copiados ${docs.length} documentos a Atlas exitosamente.`);
      } else {
        console.log(`   ⚠ Colección vacía, omitiendo inserción.`);
      }
      console.log('----------------------------------------------------');
    }

    console.log('\n🎉 ¡Migración completada con éxito! Todos tus datos locales ya están en la nube.');
  } catch (error) {
    console.error('❌ Ocurrió un error durante la migración:', error);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    process.exit(0);
  }
}

iniciarMigracion();
