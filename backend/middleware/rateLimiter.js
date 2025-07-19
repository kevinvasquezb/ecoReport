const rateLimit = require('express-rate-limit');

// Rate limiter general para toda la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    details: 'Has excedido el límite de 100 solicitudes por 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Devolver info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
  handler: (req, res) => {
    console.warn(`Rate limit excedido para IP: ${req.ip}, URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP',
      details: 'Has excedido el límite de 100 solicitudes por 15 minutos',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter específico para autenticación (más estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos de autenticación por 15 minutos
  message: {
    error: 'Demasiados intentos de autenticación',
    details: 'Has excedido el límite de 10 intentos de login por 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
    retryAfter: '15 minutos'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    console.warn(`Rate limit de auth excedido para IP: ${req.ip}, intentando: ${req.body.email || 'email desconocido'}`);
    res.status(429).json({
      error: 'Demasiados intentos de autenticación',
      details: 'Por seguridad, has sido bloqueado temporalmente. Intenta en 15 minutos.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter para subida de archivos (más restrictivo)
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // Máximo 20 uploads por 10 minutos
  message: {
    error: 'Demasiadas subidas de archivos',
    details: 'Has excedido el límite de 20 subidas por 10 minutos',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
    retryAfter: '10 minutos'
  },
  handler: (req, res) => {
    console.warn(`Rate limit de upload excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiadas subidas de archivos',
      details: 'Has excedido el límite de 20 subidas por 10 minutos',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      retryAfter: '10 minutos'
    });
  }
});

// Rate limiter muy estricto para operaciones críticas
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 requests por hora
  message: {
    error: 'Límite de operaciones críticas excedido',
    details: 'Has excedido el límite de 5 operaciones críticas por hora',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
    retryAfter: '1 hora'
  },
  handler: (req, res) => {
    console.warn(`Rate limit estricto excedido para IP: ${req.ip}, URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Límite de operaciones críticas excedido',
      details: 'Has excedido el límite de 5 operaciones críticas por hora',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      retryAfter: '1 hora'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  strictLimiter
};