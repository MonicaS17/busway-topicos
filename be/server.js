// dependencias 
const express = require('express'); // Framework para el servidor
const mongoose = require('mongoose'); // ODM para MongoDB
const cors = require('cors'); // Middleware para manejar CORS
require('dotenv').config(); // Cargar variables de entorno

// Importación de Sockets e HTTP
const http = require('http');
const { Server } = require('socket.io');

// Importación de Rutas
const authRoutes = require('./routes/auth');
const viajesRoutes = require('./routes/viajes');
const escuelasRoutes = require('./routes/escuelas');
const pagosRoutes = require('./routes/pagos');
const conductorRoutes = require('./routes/conductor'); 
const padresRoutes = require('./routes/padres');
const adminRoutes = require('./routes/admin');
const notificacionesRoutes = require('./routes/notificaciones');

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
app.use(express.json({ limit: '1mb' })); 

// Rutas base de la API
app.use('/api/auth', authRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/padre', padresRoutes);
app.use('/api/escuelas', escuelasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend BusWay funcionando con Sockets y Rutas de Viajes habilitadas 🚀' });
});

// Inicialización inline del socketHandler para que el servidor levante de inmediato
const socketHandler = (ioInstance) => {
  ioInstance.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado a Sockets: ${socket.id}`);
    
    // Dejamos los listeners preparados para el flujo de Grace (Asistencia y GPS)
    socket.on('join_room', (data) => socket.join(data));
    
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado de Sockets: ${socket.id}`);
    });
  });
};

// Inicialización usando nuestra función segura temporal
socketHandler(io);

// Conexión a MongoDB y Arranque del Servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado exitosamente a MongoDB');
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Error conectando a MongoDB:', error);
  });