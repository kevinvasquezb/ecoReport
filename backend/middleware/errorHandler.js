const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    message: err.message,
    name: err.name,
    code: err.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  // Error de base de datos - Clave duplicada
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'El recurso ya existe',
      details: 'Ya existe un registro con estos datos únicos',
      code: 'DUPLICATE_RESOURCE',
      timestamp: new Date().toISOString()
    });
  }

  // Error de base de datos - Violación de restricción
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida',
      details: 'El recurso referenciado no existe',
      code: 'FOREIGN_KEY_VIOLATION',
      timestamp: new Date().toISOString()
    });
  }

  // Error de base de datos - Restricción NOT NULL
  if (err.code === '23502') {
    return res.status(400).json({
      error: 'Campo requerido faltante',
      details: 'Uno o más campos obligatorios están vacíos',
      code: 'NOT_NULL_VIOLATION',
      timestamp: new Date().toISOString()
    });
  }

  // Error de conexión a base de datos
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      details: 'No se puede conectar a la base de datos',
      code: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Error de Multer (subida de archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Archivo demasiado grande',
      details: 'El archivo excede el tamaño máximo permitido (10MB)',
      code: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    });
  }

  // Error de Cloudinary
  if (err.message && err.message.includes('cloudinary')) {
    return res.status(500).json({
      error: 'Error procesando imagen',
      details: 'No se pudo subir la imagen. Intente nuevamente.',
      code: 'IMAGE_UPLOAD_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Error 404 personalizado
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      details: err.message || 'El recurso solicitado no existe',
      code: 'RESOURCE_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // Error 403 personalizado
  if (err.status === 403) {
    return res.status(403).json({
      error: 'Acceso denegado',
      details: err.message || 'No tiene permisos para acceder a este recurso',
      code: 'ACCESS_DENIED',
      timestamp: new Date().toISOString()
    });
  }

  // Error 500 genérico
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};