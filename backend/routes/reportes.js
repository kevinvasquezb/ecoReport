const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');
const { upload, handleMulterError, validateImageBuffer } = require('../middleware/upload');
const { uploadImage, uploadThumbnail } = require('../utils/cloudinary');
const { notifyReportStatusChange, notifyAuthoritiesNewReport, checkAndGrantAchievements } = require('./notifications');

const router = express.Router();

// POST /api/reportes - Crear nuevo reporte con imagen
router.post('/', 
  authMiddleware, 
  upload.single('imagen'), 
  handleMulterError,
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

      if (descripcion.trim().length > 500) {
        return res.status(400).json({ 
          error: 'Descripción demasiado larga (máximo 500 caracteres)',
          code: 'DESCRIPTION_TOO_LONG'
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

      console.log(`📍 Creando reporte en: ${lat}, ${lng} por usuario ${userId}`);
      
      let imagen_url = null;
      let imagen_public_id = null;
      let imagen_thumbnail_url = null;
      let thumbnail_public_id = null;

      // Solo procesar imagen si se subió una
      if (req.file) {
        // Validar buffer de imagen
        validateImageBuffer(req.file.buffer);

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

        imagen_url = imageUpload.secure_url;
        imagen_public_id = imageUpload.public_id;
        imagen_thumbnail_url = thumbnailUpload.secure_url;
        thumbnail_public_id = thumbnailUpload.public_id;
      } else {
        console.log('📷 Sin imagen subida - creando reporte solo con texto');
      }

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
        imagen_url,
        imagen_public_id,
        imagen_thumbnail_url,
        thumbnail_public_id
      ]);

      const reporte = result.rows[0];

      // Actualizar puntos del usuario
      const puntosGanados = req.file ? 15 : 10; // Más puntos si incluye imagen
      await pool.query(
        'UPDATE usuarios SET puntos = puntos + $1, updated_at = NOW() WHERE id = $2',
        [puntosGanados, userId]
      );

      console.log(`✅ Reporte creado exitosamente con ID: ${reporte.id}, +${puntosGanados} puntos`);

      // Notificar a autoridades (async, no bloquear respuesta)
      notifyAuthoritiesNewReport(reporte.id).catch(err => 
        console.error('Error enviando notificaciones:', err)
      );

      // Verificar logros (async, no bloquear respuesta)
      checkAndGrantAchievements(userId).catch(err => 
        console.error('Error verificando logros:', err)
      );

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
          created_at: reporte.created_at,
          tiene_imagen: !!reporte.imagen_url
        },
        puntos_ganados: puntosGanados
      });

    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      
      if (error.name === 'Error' && error.message.includes('cloudinary')) {
        return res.status(500).json({ 
          error: 'Error subiendo imagen. Intente nuevamente.',
          code: 'CLOUDINARY_ERROR'
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /api/reportes - Listar reportes con filtros avanzados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { 
      page = 1, 
      limit = 20, 
      estado, 
      tipo, 
      fecha_desde, 
      fecha_hasta,
      search,
      orden = 'created_at',
      direccion_orden = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log(`📋 Listando reportes para usuario ${userId} (${userRole})`);

    let query = `
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.direccion,
        r.tipo_estimado,
        r.imagen_url,
        r.imagen_thumbnail_url,
        r.estado,
        r.created_at,
        r.updated_at,
        r.fecha_resolucion,
        r.comentario_autoridad,
        u.nombre as usuario_nombre,
        u.id as usuario_id,
        ua.nombre as autoridad_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN usuarios ua ON r.autoridad_asignada = ua.id
      WHERE r.activo = true
    `;
    
    const queryParams = [];
    let paramCount = 0;

    // Si es citizen, solo ver sus reportes
    if (userRole === 'citizen') {
      query += ` AND r.usuario_id = $${++paramCount}`;
      queryParams.push(userId);
    }

    // Filtros
    if (estado) {
      query += ` AND r.estado = $${++paramCount}`;
      queryParams.push(estado);
    }

    if (tipo) {
      query += ` AND r.tipo_estimado ILIKE $${++paramCount}`;
      queryParams.push(`%${tipo}%`);
    }

    if (fecha_desde) {
      query += ` AND r.created_at >= $${++paramCount}`;
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ` AND r.created_at <= $${++paramCount}`;
      queryParams.push(fecha_hasta + ' 23:59:59');
    }

    if (search) {
      query += ` AND (r.descripcion ILIKE $${++paramCount} OR r.direccion ILIKE $${paramCount} OR r.tipo_estimado ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Validar orden
    const validOrders = ['created_at', 'updated_at', 'estado', 'tipo_estimado'];
    const orderBy = validOrders.includes(orden) ? orden : 'created_at';
    const direction = direccion_orden.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY r.${orderBy} ${direction}`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true
    `;
    
    const countParams = [];
    let countParamCount = 0;

    if (userRole === 'citizen') {
      countQuery += ` AND r.usuario_id = $${++countParamCount}`;
      countParams.push(userId);
    }

    if (estado) {
      countQuery += ` AND r.estado = $${++countParamCount}`;
      countParams.push(estado);
    }

    if (tipo) {
      countQuery += ` AND r.tipo_estimado ILIKE $${++countParamCount}`;
      countParams.push(`%${tipo}%`);
    }

    if (fecha_desde) {
      countQuery += ` AND r.created_at >= $${++countParamCount}`;
      countParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      countQuery += ` AND r.created_at <= $${++countParamCount}`;
      countParams.push(fecha_hasta + ' 23:59:59');
    }

    if (search) {
      countQuery += ` AND (r.descripcion ILIKE $${++countParamCount} OR r.direccion ILIKE $${countParamCount} OR r.tipo_estimado ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ ${result.rows.length} reportes encontrados de ${total} total`);

    res.json({
      success: true,
      reportes: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
        has_next: offset + result.rows.length < total,
        has_prev: parseInt(page) > 1
      },
      filtros_aplicados: {
        estado,
        tipo,
        fecha_desde,
        fecha_hasta,
        search,
        orden: orderBy,
        direccion_orden: direction
      },
      usuario: {
        id: userId,
        role: userRole
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
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

    let query = `
      SELECT 
        r.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        ua.nombre as autoridad_nombre,
        ua.email as autoridad_email
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

    const reporte = result.rows[0];

    // Si es autoridad, registrar que vio el reporte
    if (userRole === 'authority' || userRole === 'admin') {
      await pool.query(
        'UPDATE reportes SET updated_at = NOW() WHERE id = $1',
        [reporteId]
      );
    }

    console.log(`✅ Reporte ${reporteId} obtenido por usuario ${userId}`);

    res.json({
      reporte: reporte
    });

  } catch (error) {
    console.error('❌ Error obteniendo reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/reportes/:id - Actualizar reporte (solo autoridades)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const reporteId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { estado, comentario_autoridad } = req.body;

    if (isNaN(reporteId)) {
      return res.status(400).json({ 
        error: 'ID de reporte inválido',
        code: 'INVALID_REPORTE_ID'
      });
    }

    // Solo autoridades pueden actualizar reportes
    if (userRole !== 'authority' && userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar reportes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (!estado) {
      return res.status(400).json({ 
        error: 'Estado es requerido',
        code: 'MISSING_ESTADO'
      });
    }

    const estadosValidos = ['Reportado', 'En proceso', 'Limpio', 'Rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido',
        valid_estados: estadosValidos,
        code: 'INVALID_ESTADO'
      });
    }

    console.log(`📝 Actualizando reporte ${reporteId} a estado "${estado}" por usuario ${userId}`);

    // Verificar que el reporte existe
    const reporteQuery = await pool.query(
      'SELECT id, estado, usuario_id FROM reportes WHERE id = $1 AND activo = true',
      [reporteId]
    );

    if (reporteQuery.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reporte no encontrado',
        code: 'REPORTE_NOT_FOUND'
      });
    }

    const reporteActual = reporteQuery.rows[0];
    const estadoAnterior = reporteActual.estado;

    // Construir query de actualización
    let updateQuery = `
      UPDATE reportes 
      SET estado = $1, autoridad_asignada = $2, updated_at = NOW()
    `;
    const updateParams = [estado, userId];
    let paramCount = 2;

    if (comentario_autoridad) {
      updateQuery += `, comentario_autoridad = $${++paramCount}`;
      updateParams.push(comentario_autoridad.trim());
    }

    if (estado === 'Limpio' || estado === 'Rechazado') {
      updateQuery += `, fecha_resolucion = NOW()`;
    }

    updateQuery += ` WHERE id = $${++paramCount} RETURNING *`;
    updateParams.push(reporteId);

    const result = await pool.query(updateQuery, updateParams);
    const reporteActualizado = result.rows[0];

    // Actualizar puntos si el reporte fue resuelto
    if (estado === 'Limpio' && estadoAnterior !== 'Limpio') {
      const puntosExtra = 25;
      await pool.query(
        'UPDATE usuarios SET puntos = puntos + $1, updated_at = NOW() WHERE id = $2',
        [puntosExtra, reporteActual.usuario_id]
      );
      
      console.log(`🏆 +${puntosExtra} puntos otorgados al usuario ${reporteActual.usuario_id} por reporte resuelto`);
    }

    console.log(`✅ Reporte ${reporteId} actualizado exitosamente`);

    // Notificar al usuario del cambio de estado (async)
    notifyReportStatusChange(reporteId, estado, comentario_autoridad).catch(err => 
      console.error('Error enviando notificación:', err)
    );

    // Verificar logros si se resolvió (async)
    if (estado === 'Limpio') {
      checkAndGrantAchievements(reporteActual.usuario_id).catch(err => 
        console.error('Error verificando logros:', err)
      );
    }

    res.json({
      message: 'Reporte actualizado exitosamente',
      reporte: reporteActualizado,
      cambios: {
        estado_anterior: estadoAnterior,
        estado_nuevo: estado,
        autoridad_asignada: userId,
        fecha_actualizacion: reporteActualizado.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/reportes/:id - Eliminar reporte (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
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

    console.log(`🗑️ Eliminando reporte ${reporteId} por usuario ${userId}`);

    let query = 'UPDATE reportes SET activo = false, updated_at = NOW() WHERE id = $1';
    const queryParams = [reporteId];

    // Si es citizen, solo puede eliminar sus propios reportes
    if (userRole === 'citizen') {
      query += ' AND usuario_id = $2';
      queryParams.push(userId);
    }

    query += ' RETURNING id, descripcion';

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reporte no encontrado o no tienes permisos para eliminarlo',
        code: 'REPORTE_NOT_FOUND_OR_NO_PERMISSION'
      });
    }

    console.log(`✅ Reporte ${reporteId} eliminado exitosamente`);

    res.json({
      message: 'Reporte eliminado exitosamente',
      reporte_id: reporteId
    });

  } catch (error) {
    console.error('❌ Error eliminando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/reportes/nearby/:lat/:lng - Obtener reportes cercanos
router.get('/nearby/:lat/:lng', authMiddleware, async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    const { radius = 1000, limit = 10 } = req.query; // radius en metros

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas',
        code: 'INVALID_COORDINATES'
      });
    }

    console.log(`📍 Buscando reportes cercanos a ${lat}, ${lng} en radio de ${radius}m`);

    // Usar fórmula de Haversine para calcular distancia
    const query = `
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.direccion,
        r.tipo_estimado,
        r.imagen_thumbnail_url,
        r.estado,
        r.created_at,
        u.nombre as usuario_nombre,
        (
          6371000 * acos(
            cos(radians($1)) * cos(radians(r.latitud)) * 
            cos(radians(r.longitud) - radians($2)) + 
            sin(radians($1)) * sin(radians(r.latitud))
          )
        ) as distancia
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true
      AND (
        6371000 * acos(
          cos(radians($1)) * cos(radians(r.latitud)) * 
          cos(radians(r.longitud) - radians($2)) + 
          sin(radians($1)) * sin(radians(r.latitud))
        )
      ) <= $3
      ORDER BY distancia ASC
      LIMIT $4
    `;

    const result = await pool.query(query, [lat, lng, parseInt(radius), parseInt(limit)]);

    console.log(`✅ ${result.rows.length} reportes cercanos encontrados`);

    res.json({
      reportes_cercanos: result.rows,
      centro: { lat, lng },
      radio_metros: parseInt(radius),
      total_encontrados: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo reportes cercanos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/reportes/:id/comentarios - Agregar comentario a reporte (futuro)
router.post('/:id/comentarios', authMiddleware, async (req, res) => {
  try {
    const reporteId = parseInt(req.params.id);
    const userId = req.user.id;
    const { comentario } = req.body;

    if (isNaN(reporteId)) {
      return res.status(400).json({ 
        error: 'ID de reporte inválido',
        code: 'INVALID_REPORTE_ID'
      });
    }

    if (!comentario || comentario.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Comentario requerido (mínimo 5 caracteres)',
        code: 'INVALID_COMMENT'
      });
    }

    console.log(`💬 Agregando comentario a reporte ${reporteId} por usuario ${userId}`);

    // Verificar que el reporte existe
    const reporteExists = await pool.query(
      'SELECT id FROM reportes WHERE id = $1 AND activo = true',
      [reporteId]
    );

    if (reporteExists.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Reporte no encontrado',
        code: 'REPORTE_NOT_FOUND'
      });
    }

    // Insertar comentario (tabla que se debe crear)
    const result = await pool.query(`
      INSERT INTO comentarios_reportes (reporte_id, usuario_id, comentario, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [reporteId, userId, comentario.trim()]);

    console.log(`✅ Comentario agregado exitosamente`);

    res.status(201).json({
      message: 'Comentario agregado exitosamente',
      comentario: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error agregando comentario:', error);
    
    // Si la tabla no existe, informar que la funcionalidad está en desarrollo
    if (error.code === '42P01') {
      return res.status(501).json({ 
        error: 'Funcionalidad de comentarios en desarrollo',
        code: 'FEATURE_NOT_IMPLEMENTED'
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;