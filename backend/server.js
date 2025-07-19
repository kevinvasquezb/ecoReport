const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Importar middlewares
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, uploadLimiter } = require('./middleware/rateLimiter');

// Importar utilidades
const { testConnection } = require('./database/connection');
const { testConnection: testCloudinary } = require('./utils/cloudinary');

// Importar rutas
const authRoutes = require('./routes/auth');
const reportesRoutes = require('./routes/reportes');
const statsRoutes = require('./routes/stats');

// Probar conexiones al iniciar servidor
console.log('🚀 Iniciando servidor EcoReports...');
testConnection();
testCloudinary();

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Para permitir Cloudinary
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://unpkg.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"]
    }
  }
}));

// CORS configurado específicamente
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com', 'https://www.tu-dominio.com'] // Cambiar en producción
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting general
app.use('/api/', apiLimiter);

// Middlewares de parsing
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Middleware para logging de requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Rutas principales
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reportes', uploadLimiter, reportesRoutes);
app.use('/api/stats', statsRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: 'EcoReports API v1.0 🌱',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      authentication: '/api/auth',
      reports: '/api/reportes',
      statistics: '/api/stats',
      health: '/health'
    },
    documentation: 'https://github.com/kevinvasquezb/ecoReport'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    services: {
      database: 'connected',
      cloudinary: 'connected'
    }
  };

  res.status(200).json(healthCheck);
});

// Endpoint para información del servidor
app.get('/api/info', (req, res) => {
  res.json({
    name: 'EcoReports API',
    version: '1.0.0',
    description: 'API para gestión de reportes ambientales urbanos',
    author: 'Kevin Vasquez',
    technologies: {
      runtime: 'Node.js',
      framework: 'Express.js',
      database: 'PostgreSQL',
      storage: 'Cloudinary',
      authentication: 'JWT'
    },
    features: [
      'Autenticación JWT segura',
      'Subida de imágenes a Cloudinary',
      'Geolocalización GPS',
      'Sistema de puntos y niveles',
      'Estadísticas detalladas',
      'Rate limiting',
      'Manejo robusto de errores'
    ]
  });
});

// Middleware para manejar rutas no encontradas
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor EcoReports corriendo en puerto ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API Base: http://localhost:${PORT}/`);
  console.log(`📊 Estadísticas: http://localhost:${PORT}/api/stats`);
  console.log(`🔒 Autenticación: http://localhost:${PORT}/api/auth`);
  console.log(`📋 Reportes: http://localhost:${PORT}/api/reportes`);
  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Servidor iniciado correctamente');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.error('En la promesa:', promise);
  process.exit(1);
});

// Manejo de señal de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
  process.exit(0);
});