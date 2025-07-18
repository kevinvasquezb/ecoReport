const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// GET /api/admin/stats - Estadísticas generales del sistema
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Estadísticas de usuarios
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN role = 'citizen' THEN 1 END) as ciudadanos,
        COUNT(CASE WHEN role = 'authority' THEN 1 END) as autoridades,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as administradores,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as usuarios_nuevos_hoy,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as usuarios_nuevos_semana
      FROM usuarios
      WHERE activo = true
    `);

    // Estadísticas de reportes
    const reportsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as reportes_en_proceso,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as reportes_hoy,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reportes_semana,
        COUNT(CASE WHEN imagen_url IS NOT NULL THEN 1 END) as reportes_con_imagen,
        COUNT(CASE WHEN ai_urgencia = 'Alta' THEN 1 END) as reportes_urgentes
      FROM reportes
      WHERE activo = true
    `);

    // Estadísticas de puntos
    const pointsStats = await pool.query(`
      SELECT 
        SUM(puntos) as puntos_totales_otorgados,
        COUNT(*) as transacciones_puntos,
        AVG(puntos) as promedio_puntos_por_transaccion
      FROM puntos_historial
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Top usuarios por puntos
    const topUsers = await pool.query(`
      SELECT 
        id,
        nombre,
        email,
        puntos,
        nivel,
        role
      FROM usuarios
      WHERE activo = true
      ORDER BY puntos DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        usuarios: usersStats.rows[0],
        reportes: reportsStats.rows[0],
        puntos: pointsStats.rows[0],
        top_usuarios: topUsers.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/users - Gestión de usuarios
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, role, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.telefono,
        u.role,
        u.puntos,
        u.nivel,
        u.activo,
        u.created_at,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filtro por rol
    if (role && role !== 'todos') {
      query += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    // Filtro por búsqueda
    if (search && search.trim()) {
      query += ` AND (u.nombre ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    query += `
      GROUP BY u.id, u.email, u.nombre, u.telefono, u.role, u.puntos, u.nivel, u.activo, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) FROM usuarios WHERE 1=1`;
    let countParams = [];
    let countParamIndex = 1;

    if (role && role !== 'todos') {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (search && search.trim()) {
      countQuery += ` AND (nombre ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countParams.push(`%${search.trim()}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      usuarios: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, role, activo, puntos } = req.body;

    if (!nombre || !role) {
      return res.status(400).json({ error: 'Nombre y rol son requeridos' });
    }

    // No permitir cambiar el rol del último admin
    if (role !== 'admin') {
      const adminCount = await pool.query(`
        SELECT COUNT(*) FROM usuarios WHERE role = 'admin' AND activo = true AND id != $1
      `, [id]);

      if (parseInt(adminCount.rows[0].count) === 0) {
        return res.status(400).json({ error: 'No se puede cambiar el rol del último administrador' });
      }
    }

    await pool.query(`
      UPDATE usuarios 
      SET nombre = $1, telefono = $2, role = $3, activo = $4, puntos = $5, updated_at = NOW()
      WHERE id = $6
    `, [nombre, telefono, role, activo, puntos, id]);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/users/:id - Desactivar usuario
router.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no sea el último admin
    const user = await pool.query(`SELECT role FROM usuarios WHERE id = $1`, [id]);
    
    if (user.rows[0]?.role === 'admin') {
      const adminCount = await pool.query(`
        SELECT COUNT(*) FROM usuarios WHERE role = 'admin' AND activo = true AND id != $1
      `, [id]);

      if (parseInt(adminCount.rows[0].count) === 0) {
        return res.status(400).json({ error: 'No se puede desactivar el último administrador' });
      }
    }

    await pool.query(`
      UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/reports - Gestión de reportes
router.get('/reports', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, estado, urgencia, search } = req.query;

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
        r.created_at,
        r.updated_at,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.role as usuario_role,
        au.nombre as autoridad_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN usuarios au ON r.autoridad_asignada = au.id
      WHERE r.activo = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filtro por estado
    if (estado && estado !== 'todos') {
      query += ` AND r.estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }

    // Filtro por urgencia
    if (urgencia && urgencia !== 'todas') {
      query += ` AND r.ai_urgencia = $${paramIndex}`;
      queryParams.push(urgencia);
      paramIndex++;
    }

    // Filtro por búsqueda
    if (search && search.trim()) {
      query += ` AND (r.descripcion ILIKE $${paramIndex} OR r.direccion ILIKE $${paramIndex} OR u.nombre ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    query += `
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      reportes: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo reportes admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/reports/:id - Actualizar reporte
router.put('/reports/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentario_autoridad, autoridad_asignada } = req.body;

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (estado) {
      updateFields.push(`estado = $${paramIndex}`);
      queryParams.push(estado);
      paramIndex++;
    }

    if (comentario_autoridad) {
      updateFields.push(`comentario_autoridad = $${paramIndex}`);
      queryParams.push(comentario_autoridad);
      paramIndex++;
    }

    if (autoridad_asignada) {
      updateFields.push(`autoridad_asignada = $${paramIndex}`);
      queryParams.push(autoridad_asignada);
      paramIndex++;
    }

    if (estado === 'Limpio' || estado === 'Rechazado') {
      updateFields.push(`fecha_resolucion = NOW()`);
    }

    updateFields.push(`updated_at = NOW()`);
    queryParams.push(id);

    const query = `
      UPDATE reportes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await pool.query(query, queryParams);

    res.json({
      success: true,
      message: 'Reporte actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/analytics - Análisis y reportes avanzados
router.get('/analytics', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Reportes por día (últimos 30 días)
    const reportesPorDia = await pool.query(`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as total_reportes,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos
      FROM reportes
      WHERE created_at >= NOW() - INTERVAL '30 days' AND activo = true
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);

    // Reportes por tipo de residuo
    const reportesPorTipo = await pool.query(`
      SELECT 
        COALESCE(tipo_estimado, 'Sin clasificar') as tipo,
        COUNT(*) as cantidad
      FROM reportes
      WHERE activo = true
      GROUP BY tipo_estimado
      ORDER BY cantidad DESC
      LIMIT 10
    `);

    // Reportes por estado
    const reportesPorEstado = await pool.query(`
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM reportes
      WHERE activo = true
      GROUP BY estado
    `);

    // Usuarios más activos
    const usuariosMasActivos = await pool.query(`
      SELECT 
        u.nombre,
        u.email,
        u.puntos,
        COUNT(r.id) as total_reportes
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
      WHERE u.role = 'citizen' AND u.activo = true
      GROUP BY u.id, u.nombre, u.email, u.puntos
      ORDER BY total_reportes DESC
      LIMIT 10
    `);

    // Tiempo promedio de resolución
    const tiempoResolucion = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/3600) as horas_promedio
      FROM reportes
      WHERE estado = 'Limpio' AND fecha_resolucion IS NOT NULL
    `);

    res.json({
      success: true,
      analytics: {
        reportes_por_dia: reportesPorDia.rows,
        reportes_por_tipo: reportesPorTipo.rows,
        reportes_por_estado: reportesPorEstado.rows,
        usuarios_mas_activos: usuariosMasActivos.rows,
        tiempo_promedio_resolucion: tiempoResolucion.rows[0]?.horas_promedio || 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;