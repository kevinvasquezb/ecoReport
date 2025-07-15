const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 5000;

const { testConnection } = require('./database/connection');

// Probar conexión al iniciar servidor
testConnection();

// Probar Cloudinary
const { testConnection: testCloudinary } = require('./utils/cloudinary');
testCloudinary();

// Importar rutas
const authRoutes = require('./routes/auth');

const reportesRoutes = require('./routes/reportes');

// Middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Para imágenes base64
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);

app.use('/api/reportes', reportesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'EcoReports API funcionando! 🌱',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Manejo de errores básico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});

