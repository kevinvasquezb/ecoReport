const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar rol authority o admin
const requireAuthority = (req, res, next) => {
  if (req.user.role !== 'authority' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de autoridad.' });
  }
  next();
};

// GET /api/authority/stats - Estadísticas para autoridades
router.get('/stats', authMiddleware, requireAuthority, async (req, res) => {
  try {
    // Estadísticas generales de reportes
    const reportsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as reportes_en_proceso,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as reportes_hoy,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reportes_semana,
        COUNT(CASE WHEN ai_urgencia = 'Alta' AND estado IN ('Reportado', 'En proceso') THEN 1 END) as reportes_urgentes
      FROM reportes
      WHERE activo = true
    `);

    // Reportes asignados a esta autoridad
    const myReportsStats = await pool.query(`
      SELECT 
        COUNT(*) as reportes_asignados,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos_por_mi
      FROM reportes
      WHERE autoridad_asignada = $1 AND activo = true
    `, [req.user.id]);

    // Actividad de hoy
    const todayActivity = await pool.query(`
      SELECT 
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as reportes_nuevos_hoy,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as en_proceso_total,
        COUNT(CASE WHEN fecha_resolucion >= NOW() - INTERVAL '24 hours' THEN 1 END) as resueltos_hoy
      FROM reportes
      WHERE activo = true
    `);

    // Tipos de residuos más reportados
    const tiposResiduos = await pool.query(`
      SELECT 
        COALESCE(tipo_estimado, 'Sin clasificar') as tipo,
        COUNT(*) as cantidad
      FROM reportes
      WHERE activo = true AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY tipo_estimado
      ORDER BY cantidad DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        general: reportsStats.rows[0],
        mis_reportes: myReportsStats.rows[0],
        actividad_hoy: todayActivity.rows[0],
        tipos_residuos: tiposResiduos.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas autoridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/authority/reports - Obtener reportes para gestión
router.get('/reports', authMiddleware, requireAuthority, async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      estado = 'todos', 
      urgencia = 'todas',
      asignados_a_mi = 'false',
      search = ''
    } = req.query;

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
        r.ai_urgencia,
        r.ai_tipo_residuo,
        r.ai_resumen,
        r.comentario_autoridad,
        r.created_at,
        r.updated_at,
        r.fecha_resolucion,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.telefono as usuario_telefono,
        au.nombre as autoridad_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN usuarios au ON r.autoridad_asignada = au.id
      WHERE r.activo = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filtro por estado
    if (estado !== 'todos') {
      query += ` AND r.estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }

    // Filtro por urgencia
    if (urgencia !== 'todas') {
      query += ` AND r.ai_urgencia = $${paramIndex}`;
      queryParams.push(urgencia);
      paramIndex++;
    }

    // Filtro por reportes asignados a mí
    if (asignados_a_mi === 'true') {
      query += ` AND r.autoridad_asignada = $${paramIndex}`;
      queryParams.push(req.user.id);
      paramIndex++;
    }

    // Filtro por búsqueda
    if (search.trim()) {
      query += ` AND (r.descripcion ILIKE $${paramIndex} OR r.direccion ILIKE $${paramIndex} OR u.nombre ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    query += `
      ORDER BY 
        CASE WHEN r.ai_urgencia = 'Alta' THEN 1 
             WHEN r.ai_urgencia = 'Media' THEN 2 
             ELSE 3 END,
        r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) FROM reportes r JOIN usuarios u ON r.usuario_id = u.id WHERE r.activo = true`;
    let countParams = [];
    let countParamIndex = 1;

    if (estado !== 'todos') {
      countQuery += ` AND r.estado = $${countParamIndex}`;
      countParams.push(estado);
      countParamIndex++;
    }

    if (urgencia !== 'todas') {
      countQuery += ` AND r.ai_urgencia = $${countParamIndex}`;
      countParams.push(urgencia);
      countParamIndex++;
    }

    if (asignados_a_mi === 'true') {
      countQuery += ` AND r.autoridad_asignada = $${countParamIndex}`;
      countParams.push(req.user.id);
      countParamIndex++;
    }

    if (search.trim()) {
      countQuery += ` AND (r.descripcion ILIKE $${countParamIndex} OR r.direccion ILIKE $${countParamIndex} OR u.nombre ILIKE $${countParamIndex})`;
      countParams.push(`%${search.trim()}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      reportes: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error obteniendo reportes autoridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/authority/reports/:id - Actualizar estado de reporte
router.put('/reports/:id', authMiddleware, requireAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentario_autoridad, asignar_a_mi = false } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'Estado es requerido' });
    }

    const updateFields = ['estado = $1', 'updated_at = NOW()'];
    const queryParams = [estado];
    let paramIndex = 2;

    // Agregar comentario si se proporciona
    if (comentario_autoridad && comentario_autoridad.trim()) {
      updateFields.push(`comentario_autoridad = $${paramIndex}`);
      queryParams.push(comentario_autoridad.trim());
      paramIndex++;
    }

    // Asignar a mí si se solicita
    if (asignar_a_mi) {
      updateFields.push(`autoridad_asignada = ${paramIndex}`);
      queryParams.push(req.user.id);
      paramIndex++;
    }

    // Marcar fecha de resolución si se resuelve o rechaza
    if (estado === 'Limpio' || estado === 'Rechazado') {
      updateFields.push('fecha_resolucion = NOW()');
    }

    queryParams.push(id);

    const query = `
      UPDATE reportes 
      SET ${updateFields.join(', ')}
      WHERE id = ${paramIndex} AND activo = true
    `;

    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Obtener datos actualizados del reporte
    const updatedReport = await pool.query(`
      SELECT 
        r.*,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Reporte actualizado exitosamente',
      reporte: updatedReport.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/authority/reports/:id/assign - Asignar reporte a autoridad
router.put('/reports/:id/assign', authMiddleware, requireAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const { autoridad_id } = req.body;

    // Verificar que la autoridad existe
    if (autoridad_id) {
      const authorityExists = await pool.query(`
        SELECT id FROM usuarios 
        WHERE id = $1 AND role IN ('authority', 'admin') AND activo = true
      `, [autoridad_id]);

      if (authorityExists.rows.length === 0) {
        return res.status(400).json({ error: 'Autoridad no válida' });
      }
    }

    await pool.query(`
      UPDATE reportes 
      SET autoridad_asignada = $1, updated_at = NOW()
      WHERE id = $2 AND activo = true
    `, [autoridad_id, id]);

    res.json({
      success: true,
      message: autoridad_id ? 'Reporte asignado exitosamente' : 'Asignación removida exitosamente'
    });

  } catch (error) {
    console.error('Error asignando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/authority/authorities - Obtener lista de autoridades para asignación
router.get('/authorities', authMiddleware, requireAuthority, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        email,
        COUNT(r.id) as reportes_asignados
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.autoridad_asignada AND r.estado IN ('Reportado', 'En proceso')
      WHERE u.role IN ('authority', 'admin') AND u.activo = true
      GROUP BY u.id, u.nombre, u.email
      ORDER BY reportes_asignados ASC, u.nombre
    `);

    res.json({
      success: true,
      autoridades: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo autoridades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/authority/dashboard-data - Datos específicos para dashboard
router.get('/dashboard-data', authMiddleware, requireAuthority, async (req, res) => {
  try {
    // Reportes recientes (últimos 10)
    const recentReports = await pool.query(`
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.estado,
        r.ai_urgencia,
        r.created_at,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    // Reportes urgentes pendientes
    const urgentReports = await pool.query(`
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.ai_urgencia,
        r.created_at,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true 
        AND r.ai_urgencia = 'Alta' 
        AND r.estado IN ('Reportado', 'En proceso')
      ORDER BY r.created_at ASC
      LIMIT 5
    `);

    // Mis reportes asignados
    const myAssignedReports = await pool.query(`
      SELECT 
        r.id,
        r.descripcion,
        r.estado,
        r.ai_urgencia,
        r.created_at,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.autoridad_asignada = $1 
        AND r.activo = true
        AND r.estado IN ('Reportado', 'En proceso')
      ORDER BY r.created_at ASC
      LIMIT 5
    `, [req.user.id]);

    res.json({
      success: true,
      dashboard: {
        reportes_recientes: recentReports.rows,
        reportes_urgentes: urgentReports.rows,
        mis_reportes_asignados: myAssignedReports.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos de dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/authority/reports/:id/bulk-action - Acción masiva en reportes
router.post('/bulk-action', authMiddleware, requireAuthority, async (req, res) => {
  try {
    const { accion, reporte_ids, nuevo_estado, comentario, autoridad_id } = req.body;

    if (!accion || !reporte_ids || !Array.isArray(reporte_ids)) {
      return res.status(400).json({ error: 'Acción y lista de reportes son requeridos' });
    }

    let query = '';
    let queryParams = [];

    switch (accion) {
      case 'cambiar_estado':
        if (!nuevo_estado) {
          return res.status(400).json({ error: 'Nuevo estado es requerido' });
        }
        
        query = `
          UPDATE reportes 
          SET estado = $1, 
              comentario_autoridad = COALESCE($2, comentario_autoridad),
              fecha_resolucion = CASE WHEN $1 IN ('Limpio', 'Rechazado') THEN NOW() ELSE fecha_resolucion END,
              updated_at = NOW()
          WHERE id = ANY($3) AND activo = true
        `;
        queryParams = [nuevo_estado, comentario, reporte_ids];
        break;

      case 'asignar_autoridad':
        query = `
          UPDATE reportes 
          SET autoridad_asignada = $1, updated_at = NOW()
          WHERE id = ANY($2) AND activo = true
        `;
        queryParams = [autoridad_id, reporte_ids];
        break;

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      message: `${result.rowCount} reportes actualizados exitosamente`,
      reportes_actualizados: result.rowCount
    });

  } catch (error) {
    console.error('Error en acción masiva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;