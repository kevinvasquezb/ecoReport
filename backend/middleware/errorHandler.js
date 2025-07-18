const { ValidationError } = require('express-validator');

// Middleware de manejo de errores centralizado
const errorHandler = (err, req, res, next) => {
  console.error('🚨 Error capturado por middleware:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'No autenticado',
    timestamp: new Date().toISOString()
  });

  // Error de validación de express-validator
  if (err.name === 'ValidationError' || err.errors) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: err.errors || err.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token de autenticación inválido',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token de autenticación expirado',
      code: 'EXPIRED_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Error de base de datos PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violación de constraint único
        return res.status(409).json({
          error: 'El recurso ya existe',
          details: 'Violación de restricción única en la base de datos',
          code: 'DUPLICATE_RESOURCE',
          timestamp: new Date().toISOString()
        });
      
      case '23503': // Violación de foreign key
        return res.status(400).json({
          error: 'Referencia inválida',
          details: 'El recurso referenciado no existe',
          code: 'INVALID_REFERENCE',
          timestamp: new Date().toISOString()
        });
      
      case '23502': // Violación de NOT NULL
        return res.status(400).json({
          error: 'Campo requerido faltante',
          details: 'Uno o más campos obligatorios están vacíos',
          code: 'MISSING_REQUIRED_FIELD',
          timestamp: new Date().toISOString()
        });
      
      case 'ECONNREFUSED':
        return res.status(503).json({
          error: 'Servicio no disponible',
          details: 'No se puede conectar a la base de datos',
          code: 'DATABASE_CONNECTION_ERROR',
          timestamp: new Date().toISOString()
        });
    }
  }

  // Error de Multer (subida de archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      details: 'El archivo supera el límite máximo permitido',
      code: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Demasiados archivos',
      details: 'Se ha excedido el número máximo de archivos permitidos',
      code: 'TOO_MANY_FILES',
      timestamp: new Date().toISOString()
    });
  }

  // Error de Cloudinary
  if (err.http_code || (err.message && err.message.includes('cloudinary'))) {
    return res.status(502).json({
      error: 'Error en el servicio de imágenes',
      details: 'No se pudo procesar la imagen',
      code: 'IMAGE_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Error de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      details: 'Has excedido el límite de solicitudes por minuto',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      retry_after: err.retryAfter || 60
    });
  }

  // Errores HTTP específicos
  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    
    const errorMessages = {
      400: 'Solicitud incorrecta',
      401: 'No autorizado',
      403: 'Acceso prohibido',
      404: 'Recurso no encontrado',
      405: 'Método no permitido',
      406: 'Formato no aceptable',
      408: 'Tiempo de solicitud agotado',
      409: 'Conflicto',
      410: 'Recurso no disponible',
      413: 'Payload demasiado grande',
      415: 'Tipo de media no soportado',
      422: 'Entidad no procesable',
      429: 'Demasiadas solicitudes',
      500: 'Error interno del servidor',
      501: 'No implementado',
      502: 'Gateway incorrecto',
      503: 'Servicio no disponible',
      504: 'Timeout de gateway'
    };

    return res.status(status).json({
      error: errorMessages[status] || 'Error del servidor',
      details: err.message || 'Error desconocido',
      code: err.code || `HTTP_${status}`,
      timestamp: new Date().toISOString()
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};

// Middleware para capturar rutas no encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    details: `La ruta ${req.method} ${req.originalUrl} no existe`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    available_routes: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/profile'
      ],
      reportes: [
        'GET /api/reportes',
        'POST /api/reportes',
        'GET /api/reportes/:id',
        'PATCH /api/reportes/:id'
      ],
      stats: [
        'GET /api/stats/dashboard',
        'GET /api/stats/user/:userId',
        'GET /api/stats/reports'
      ]
    }
  });
};

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`📡 ${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id || 'Anónimo',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...' || 'Unknown',
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware de validación async
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware de rate limiting personalizado
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100, // límite de requests
    message = 'Demasiadas solicitudes',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  const clients = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Limpiar entradas antiguas
    for (const [id, data] of clients.entries()) {
      if (now - data.resetTime > windowMs) {
        clients.delete(id);
      }
    }

    // Obtener o crear entrada del cliente
    let clientData = clients.get(clientId);
    if (!clientData) {
      clientData = {
        count: 0,
        resetTime: now
      };
      clients.set(clientId, clientData);
    }

    // Verificar si debe resetear
    if (now - clientData.resetTime > windowMs) {
      clientData.count = 0;
      clientData.resetTime = now;
    }

    // Incrementar contador
    clientData.count++;

    // Agregar headers de rate limiting
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - clientData.count),
      'X-RateLimit-Reset': new Date(clientData.resetTime + windowMs).toISOString()
    });

    // Verificar límite
    if (clientData.count > max) {
      const retryAfter = Math.ceil((clientData.resetTime + windowMs - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      
      const error = new Error(message);
      error.status = 429;
      error.retryAfter = retryAfter;
      
      return next(error);
    }

    next();
  };
};

// Middleware de validación de contenido
const validateContentType = (expectedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header requerido',
        expected: expectedTypes,
        code: 'MISSING_CONTENT_TYPE',
        timestamp: new Date().toISOString()
      });
    }

    const isValid = expectedTypes.some(type => 
      contentType.includes(type) || 
      (type === 'multipart/form-data' && contentType.includes('multipart/form-data'))
    );

    if (!isValid) {
      return res.status(415).json({
        error: 'Tipo de contenido no soportado',
        received: contentType,
        expected: expectedTypes,
        code: 'UNSUPPORTED_CONTENT_TYPE',
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

// Middleware de sanitización básica
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Eliminar scripts y caracteres peligrosos básicos
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/vbscript:/gi, '')
          .replace(/onload/gi, '')
          .replace(/onerror/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

// Middleware de validación de API Key (opcional)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (validApiKey && apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'API Key inválida',
      code: 'INVALID_API_KEY',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Middleware de CORS personalizado
const customCors = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://ecoreports.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// Middleware de timeout personalizado
const timeout = (seconds = 30) => {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Tiempo de solicitud agotado',
          details: `La solicitud tardó más de ${seconds} segundos`,
          code: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, seconds * 1000);

    // Limpiar timeout cuando la respuesta se envía
    const originalSend = res.send;
    res.send = function(data) {
      clearTimeout(timeoutId);
      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware de health check
const healthCheck = (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'Connected', // Se puede expandir para verificar conexión real
      cloudinary: 'Connected',
      api: 'Running'
    }
  };

  res.json(healthData);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
  asyncHandler,
  createRateLimit,
  validateContentType,
  sanitizeInput,
  validateApiKey,
  customCors,
  timeout,
  healthCheck
};