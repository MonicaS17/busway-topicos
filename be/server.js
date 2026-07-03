// dependencias 
const express = require('express'); // Framework para el servidor
const mongoose = require('mongoose'); // ODM para MongoDB
const cors = require('cors'); // Middleware para manejar CORS
require('dotenv').config(); // Cargar variables de entorno

// Importación de Rutas (Ajustadas a exportaciones directas)
const authRoutes = require('./routes/auth');
const escuelasRoutes = require('./routes/escuelas');
const pagosRoutes = require('./routes/pagos');
const conductorRoutes = require('./routes/conductor'); // <-- ¡Limpiado aquí! Ya no necesita el { router: ... }
const padreRoutes = require('./routes/padres');
const adminRoutes = require('./routes/admin');
const notificacionesRoutes = require('./routes/notificaciones');
const stripeRoutes = require('./routes/stripe');

const app = express();

app.use(cors());

// Stripe webhook necesita el body raw (sin procesar) para verificar la firma
// DEBE ir antes de express.json() para que no convierta el body a objeto
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' })) 

// Rutas base de la API
app.use('/api/auth', authRoutes);
app.use('/api/escuelas', escuelasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/padre', padreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/stripe', stripeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend BusWay funcionando correctamente 🚀' });
});

// Conexión a MongoDB y Arranque del Servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado exitosamente a MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Error conectando a MongoDB:', error);
  });
