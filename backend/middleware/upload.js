const multer = require('multer');
const path = require('path');

// Configurar almacenamiento en memoria (no en disco)
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`✅ Archivo válido: ${file.originalname} (${file.mimetype})`);
    return cb(null, true);
  } else {
    console.log(`❌ Archivo inválido: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Solo se permiten imágenes (JPEG, JPG, PNG, WebP, GIF). Recibido: ${file.mimetype}`));
  }
};

// Configuración principal de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1 // Solo un archivo por request
  },
  fileFilter: fileFilter,
});

// Middleware personalizado para manejo de errores de Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          error: 'Archivo demasiado grande. Máximo 10MB permitido.',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          error: 'Demasiados archivos. Solo se permite 1 imagen.',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Campo de archivo inesperado. Use "imagen".',
          code: 'UNEXPECTED_FIELD'
        });
      default:
        return res.status(400).json({ 
          error: `Error de subida: ${err.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  } else if (err) {
    // Error del filtro de archivos
    return res.status(400).json({ 
      error: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  next();
};

// Middleware para validar que se subió un archivo (opcional)
const requireImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ 
      error: 'Imagen requerida. Suba un archivo en el campo "imagen".',
      code: 'NO_FILE_UPLOADED'
    });
  }
  
  console.log(`📁 Archivo recibido: ${req.file.originalname} (${req.file.size} bytes)`);
  next();
};

// Middleware para validar que NO se requiere archivo (opcional)
const optionalImage = (req, res, next) => {
  if (req.file) {
    console.log(`📁 Archivo opcional recibido: ${req.file.originalname} (${req.file.size} bytes)`);
  } else {
    console.log(`📁 Sin archivo subido (opcional)`);
  }
  next();
};

// Función utilitaria para validar buffer de imagen
const validateImageBuffer = (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Buffer de imagen vacío');
  }
  
  // Verificar magic numbers para validar tipo de archivo real
  const signatures = {
    'jpeg': [0xFF, 0xD8, 0xFF],
    'png': [0x89, 0x50, 0x4E, 0x47],
    'gif': [0x47, 0x49, 0x46],
    'webp': [0x52, 0x49, 0x46, 0x46] // RIFF (WebP container)
  };
  
  for (const [type, signature] of Object.entries(signatures)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      return type;
    }
  }
  
  throw new Error('Formato de imagen no válido o archivo corrupto');
};

module.exports = {
  upload,
  handleMulterError,
  requireImage,
  optionalImage,
  validateImageBuffer
};