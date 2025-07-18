const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar middlewares personalizados
const { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  customCors, 
  timeout, 
  healthCheck,
  sanitizeInput,
  validateContentType,
  createRateLimit 
} = require('./middleware/errorHandler');

// Importar conexiones y utilidades
const { testConnection } = require('./database/connection');
const { testConnection: testCloudinary } = require('./utils/cloudinary');

// Importar rutas
const authRoutes = require('./routes/auth');
const reportesRoutes = require('./routes/reportes');
const statsRoutes = require('./routes/stats');
const { router: notificationsRoutes } = require('./routes/notifications');

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// CONFIGURACIÓN INICIAL
// ============================================================================

console.log('🚀 Iniciando EcoReports Backend...');
console.log(`📊 Entorno: ${NODE_ENV}`);
console.log(`🔌 Puerto: ${PORT}`);

// Probar conexiones al iniciar
(async () => {
  try {
    console.log('🔍 Verificando conexiones...');
    
    // Probar conexión a PostgreSQL
    await testConnection();
    
    // Probar conexión a Cloudinary
    await testCloudinary();
    
    console.log('✅ Todas las conexiones verificadas exitosamente');
  } catch (error) {
    console.error('❌ Error en las conexiones:', error.message);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

// ============================================================================
// MIDDLEWARES DE SEGURIDAD
// ============================================================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://cloudinary.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS personalizado
app.use(customCors);

// Rate limiting global
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === 'production' ? 100 : 1000, // límite por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    details: 'Intenta nuevamente en 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para health check
    return req.path === '/health' || req.path === '/';
  }
});

app.use(globalRateLimit);

// Timeout global
app.use(timeout(30)); // 30 segundos

// Logging de requests
if (NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ============================================================================
// MIDDLEWARES DE PARSING
// ============================================================================

// Body parsing con límites de seguridad
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Sanitización de entrada
app.use(sanitizeInput);

// Validación de Content-Type para rutas que lo requieren
app.use('/api/auth', validateContentType(['application/json']));
app.use('/api/stats', validateContentType(['application/json']));
app.use('/api/notifications', validateContentType(['application/json']));

// Para reportes permitir multipart/form-data (imágenes)
app.use('/api/reportes', validateContentType(['application/json', 'multipart/form-data']));

// ============================================================================
// RUTAS PRINCIPALES
// ============================================================================

// Health check (sin rate limiting estricto)
app.get('/health', healthCheck);

// Ruta raíz con información del API
app.get('/', (req, res) => {
  res.json({ 
    message: 'EcoReports API v2.0 🌱',
    status: 'Operativo',
    version: '2.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    documentation: {
      base_url: `http://localhost:${PORT}`,
      endpoints: {
        auth: '/api/auth',
        reportes: '/api/reportes',
        stats: '/api/stats',
        notifications: '/api/notifications'
      }
    },
    features: [
      'Autenticación JWT',
      'Subida de imágenes',
      'Geolocalización',
      'Sistema de notificaciones',
      'Estadísticas avanzadas',
      'Gamificación'
    ],
    limits: {
      max_file_size: '10MB',
      rate_limit: NODE_ENV === 'production' ? '100 req/15min' : '1000 req/15min',
      request_timeout: '30s'
    }
  });
});

// ============================================================================
// RATE LIMITING ESPECÍFICO POR RUTA
// ============================================================================

// Rate limiting más estricto para autenticación
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === 'production' ? 5 : 50, // máximo 5 intentos en producción
  message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.'
});

// Rate limiting para reportes
const reportsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: NODE_ENV === 'production' ? 10 : 100, // máximo 10 reportes por minuto
  message: 'Demasiados reportes creados. Espera un momento.'
});

// Rate limiting para notificaciones
const notificationsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: NODE_ENV === 'production' ? 30 : 300, // máximo 30 requests por minuto
  message: 'Demasiadas solicitudes de notificaciones.'
});

// ============================================================================
// MONTAJE DE RUTAS CON RATE LIMITING
// ============================================================================

// Rutas de autenticación con rate limiting estricto
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api/auth', authRoutes);

// Rutas de reportes con rate limiting moderado
app.use('/api/reportes', reportsRateLimit, reportesRoutes);

// Rutas de estadísticas (sin rate limiting extra)
app.use('/api/stats', statsRoutes);

// Rutas de notificaciones con rate limiting
app.use('/api/notifications', notificationsRateLimit, notificationsRoutes);

// ============================================================================
// RUTAS DE DESARROLLO Y TESTING
// ============================================================================

if (NODE_ENV === 'development') {
  // Ruta para probar errores
  app.get('/test-error', (req, res, next) => {
    const error = new Error('Error de prueba');
    error.status = 500;
    next(error);
  });

  // Ruta para probar rate limiting
  app.get('/test-rate-limit', createRateLimit({
    windowMs: 60 * 1000,
    max: 2,
    message: 'Rate limit de prueba alcanzado'
  }), (req, res) => {
    res.json({ message: 'Rate limit test OK' });
  });

  // Información de rutas disponibles
  app.get('/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            routes.push({
              path: middleware.regexp.source.replace('\\/?(?=\\/|$)', '') + handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });

    res.json({
      total_routes: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path))
    });
  });
}

// ============================================================================
// MIDDLEWARES DE MANEJO DE ERRORES
// ============================================================================

// Capturar rutas no encontradas (debe ir antes del error handler)
app.use('*', notFoundHandler);

// Manejador de errores centralizado (debe ir al final)
app.use(errorHandler);

// ============================================================================
// MANEJO DE SEÑALES DEL SISTEMA
// ============================================================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM recibido. Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT recibido. Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('🎉 ================================');
  console.log('🚀 EcoReports Backend v2.0 Iniciado');
  console.log('🎉 ================================');
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL Base: http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Documentación: http://localhost:${PORT}/`);
  
  if (NODE_ENV === 'development') {
    console.log(`🛠️  Rutas disponibles: http://localhost:${PORT}/routes`);
    console.log(`🧪 Test error: http://localhost:${PORT}/test-error`);
  }
  
  console.log('🎉 ================================');
  console.log('✅ ¡Listo para recibir requests!');
  console.log('🎉 ================================');
});

// ============================================================================
// CONFIGURACIÓN DEL SERVIDOR
// ============================================================================

// Configurar timeouts del servidor
server.timeout = 30000; // 30 segundos
server.keepAliveTimeout = 65000; // 65 segundos
server.headersTimeout = 66000; // 66 segundos

// ============================================================================
// EXPORTAR PARA TESTING
// ============================================================================

module.exports = app;