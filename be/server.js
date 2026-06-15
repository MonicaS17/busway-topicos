// dependencias 
const express = require('express'); // Framework para el servidor
const mongoose = require('mongoose'); // ODM para MongoDB
const cors = require('cors'); // Middleware para manejar CORS
require('dotenv').config(); // Cargar variables de entorno

// Importación de Rutas
const http = require('http');
const { Server } = require('socket.io');

// Importación de Rutas (Unificado con la limpieza de origin/main)
const authRoutes = require('./routes/auth');
const viajesRoutes = require('./routes/viajes');
const conductorRoutes = require('./routes/conductor'); // origin/main: ya no necesita .router
const padresRoutes = require('./routes/padres');
const escuelasRoutes = require('./routes/escuelas');
const pagosRoutes = require('./routes/pagos');

// socketHandler para manejar eventos de Socket.IO (asistencia y GPS)
const socketHandler = require('./sockets/socketHandler');

const app = express();

// Servidor HTTP combinado para Express y Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
// Mantener origin/main: añade límite seguro para peticiones JSON
app.use(express.json({ limit: '1mb' })); 

// Rutas base de la API
app.use('/api/auth', authRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/padre', padresRoutes);
app.use('/api/escuelas', escuelasRoutes);
app.use('/api/pagos', pagosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend BusWay funcionando con Sockets y Rutas de Viajes habilitadas 🚀' });
});

// Mantener HEAD: Inicialización del socketHandler para asistencia y GPS
socketHandler(io);

// Conexión a MongoDB y Arranque del Servidor (Combinado con logs elegantes de main)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado exitosamente a MongoDB');
    // CORRECCIÓN CLAVE: Usar 'server.listen' (HEAD) en lugar de 'app.listen' (main)
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Error conectando a MongoDB:', error);
  });