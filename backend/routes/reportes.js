const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');
const { upload, handleMulterError, requireImage, validateImageBuffer } = require('../middleware/upload');
const { uploadImage, uploadThumbnail } = require('../utils/cloudinary');

const router = express.Router();

// POST /api/reportes - Crear nuevo reporte con imagen
router.post('/', 
  authMiddleware, 
  upload.single('imagen'), 
  handleMulterError,
  requireImage,
  async (req, res) => {
    try {
      const { descripcion, latitud, longitud, direccion, tipo_estimado } = req.body;
      const userId = req.user.id;

      // Validaciones básicas
      if (!descripcion || descripcion.trim().length < 10) {
        return res.status(400).json({ 
          error: 'Descripción requerida (mínimo 10 caracteres)',
          code: 'INVALID_DESCRIPTION'
        });
      }

      if (!latitud || !longitud) {
        return res.status(400).json({ 
          error: 'Coordenadas (latitud y longitud) son requeridas',
          code: 'MISSING_COORDINATES'
        });
      }

      // Validar rango de coordenadas
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ 
          error: 'Latitud inválida (debe estar entre -90 y 90)',
          code: 'INVALID_LATITUDE'
        });
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: 'Longitud inválida (debe estar entre -180 y 180)',
          code: 'INVALID_LONGITUDE'
        });
      }

      // Validar buffer de imagen
      validateImageBuffer(req.file.buffer);

      console.log(`📍 Creando reporte en: ${lat}, ${lng} por usuario ${userId}`);
      
      // Subir imagen principal a Cloudinary
      console.log('📤 Subiendo imagen principal a Cloudinary...');
      const imageUpload = await uploadImage(req.file.buffer, {
        public_id: `reporte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // Subir thumbnail a Cloudinary
      console.log('📤 Subiendo thumbnail a Cloudinary...');
      const thumbnailUpload = await uploadThumbnail(req.file.buffer, {
        public_id: `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // Insertar reporte en base de datos
      const result = await pool.query(`
        INSERT INTO reportes (
          usuario_id, 
          latitud, 
          longitud, 
          direccion, 
          descripcion, 
          tipo_estimado,
          imagen_url,
          imagen_public_id,
          imagen_thumbnail_url,
          thumbnail_public_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId,
        lat,
        lng,
        direccion || null,
        descripcion.trim(),
        tipo_estimado || null,
        imageUpload.secure_url,
        imageUpload.public_id,
        thumbnailUpload.secure_url,
        thumbnailUpload.public_id
      ]);

      const reporte = result.rows[0];

      console.log(`✅ Reporte creado exitosamente con ID: ${reporte.id}`);

      res.status(201).json({
        message: 'Reporte creado exitosamente',
        reporte: {
          id: reporte.id,
          descripcion: reporte.descripcion,
          latitud: reporte.latitud,
          longitud: reporte.longitud,
          direccion: reporte.direccion,
          tipo_estimado: reporte.tipo_estimado,
          imagen_url: reporte.imagen_url,
          imagen_thumbnail_url: reporte.imagen_thumbnail_url,
          estado: reporte.estado,
          created_at: reporte.created_at
        }
      });

    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      
      // Si es error de Cloudinary, dar más detalles
      if (error.name === 'Error' && error.message.includes('cloudinary')) {
        return res.status(500).json({ 
          error: 'Error subiendo imagen. Intente nuevamente.',
          code: 'CLOUDINARY_ERROR'
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /api/reportes - Listar reportes (versión simplificada)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📋 Listando reportes para usuario ${userId} (${userRole})`);

    // Query simple
    let query = `
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.direccion,
        r.imagen_url,
        r.imagen_thumbnail_url,
        r.estado,
        r.created_at,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true
    `;
    
    const queryParams = [];

    // Si es citizen, solo ver sus reportes
    if (userRole === 'citizen') {
      query += ` AND r.usuario_id = $1`;
      queryParams.push(userId);
    }

    query += ` ORDER BY r.created_at DESC LIMIT 50`;

    console.log('🔍 Ejecutando query:', query);
    console.log('🔍 Parámetros:', queryParams);

    // Ejecutar query
    const result = await pool.query(query, queryParams);

    console.log(`✅ Encontrados ${result.rows.length} reportes`);

    res.json({
      success: true,
      reportes: result.rows,
      total: result.rows.length,
      usuario: {
        id: userId,
        role: userRole
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    console.error('❌ Stack completo:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/reportes/:id - Obtener reporte específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const reporteId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(reporteId)) {
      return res.status(400).json({ 
        error: 'ID de reporte inválido',
        code: 'INVALID_REPORTE_ID'
      });
    }

    // Query base
    let query = `
      SELECT 
        r.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        ua.nombre as autoridad_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN usuarios ua ON r.autoridad_asignada = ua.id
      WHERE r.id = $1 AND r.activo = true
    `;

    const queryParams = [reporteId];

    // Si es citizen, solo puede ver sus propios reportes
    if (userRole === 'citizen') {
      query += ` AND r.usuario_id = $2`;
      queryParams.push(userId);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reporte no encontrado',
        code: 'REPORTE_NOT_FOUND'
      });
    }

    res.json({
      reporte: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/reportes/:id - Actualizar estado del reporte (solo autoridades)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const reporteId = parseInt(req.params.id);
    const { estado, comentario_autoridad } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Solo autoridades y admins pueden actualizar reportes
    if (userRole === 'citizen') {
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar reportes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(reporteId)) {
      return res.status(400).json({ 
        error: 'ID de reporte inválido',
        code: 'INVALID_REPORTE_ID'
      });
    }

    // Validar estado
    const estadosValidos = ['Reportado', 'En proceso', 'Limpio', 'Rechazado'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`,
        code: 'INVALID_STATE'
      });
    }

    // Verificar que el reporte existe
    const reporteExistente = await pool.query(
      'SELECT * FROM reportes WHERE id = $1 AND activo = true',
      [reporteId]
    );

    if (reporteExistente.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reporte no encontrado',
        code: 'REPORTE_NOT_FOUND'
      });
    }

    // Construir query de actualización
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    if (estado) {
      paramCount++;
      updateFields.push(`estado = $${paramCount}`);
      queryParams.push(estado);
    }

    if (comentario_autoridad !== undefined) {
      paramCount++;
      updateFields.push(`comentario_autoridad = $${paramCount}`);
      queryParams.push(comentario_autoridad);
    }

    // Asignar autoridad y fecha de resolución
    paramCount++;
    updateFields.push(`autoridad_asignada = $${paramCount}`);
    queryParams.push(userId);

    if (estado === 'Limpio' || estado === 'Rechazado') {
      paramCount++;
      updateFields.push(`fecha_resolucion = $${paramCount}`);
      queryParams.push(new Date());
    }

    // Actualizar updated_at (el trigger lo hace automáticamente)
    
    // Ejecutar actualización
    paramCount++;
    const updateQuery = `
      UPDATE reportes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND activo = true
      RETURNING *
    `;
    queryParams.push(reporteId);

    const result = await pool.query(updateQuery, queryParams);

    console.log(`✅ Reporte ${reporteId} actualizado por autoridad ${userId}`);

    res.json({
      message: 'Reporte actualizado exitosamente',
      reporte: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;