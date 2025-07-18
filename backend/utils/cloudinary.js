const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para subir imagen desde buffer
const uploadImage = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'image',
        folder: 'ecoreports/reportes', // Organizar en carpetas
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
          { quality: 'auto:good' }, // Optimización automática
          { format: 'auto' } // Formato automático (webp si es compatible)
        ],
        ...options
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Error en uploadImage:', error);
    throw error;
  }
};

// Función para generar thumbnail
const uploadThumbnail = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const thumbnailOptions = {
        resource_type: 'image',
        folder: 'ecoreports/thumbnails',
        transformation: [
          { width: 300, height: 300, crop: 'fill' }, // Thumbnail cuadrado
          { quality: 'auto:low' }, // Menor calidad para thumbnails
          { format: 'auto' }
        ],
        ...options
      };

      cloudinary.uploader.upload_stream(
        thumbnailOptions,
        (error, result) => {
          if (error) {
            console.error('Error subiendo thumbnail:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Error en uploadThumbnail:', error);
    throw error;
  }
};

// Función para eliminar imagen
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    throw error;
  }
};

// Función para probar conexión
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Conexión a Cloudinary exitosa:', result);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Cloudinary:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadThumbnail,
  deleteImage,
  testConnection
};