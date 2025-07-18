const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/dashboard - Estadísticas para el dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📊 Obteniendo estadísticas dashboard para usuario ${userId} (${userRole})`);

    let userStats = {};
    let globalStats = {};

    if (userRole === 'citizen') {
      // Estadísticas del ciudadano
      const userStatsQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_reportes,
          COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos,
          COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as reportes_en_proceso,
          COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as reportes_pendientes,
          COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
          COUNT(CASE WHEN imagen_url IS NOT NULL THEN 1 END) as reportes_con_imagen,
          COALESCE(AVG(CASE WHEN estado = 'Limpio' AND fecha_resolucion IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/86400 
          END), 0) as tiempo_promedio_resolucion_dias
        FROM reportes 
        WHERE usuario_id = $1 AND activo = true
      `, [userId]);

      userStats = userStatsQuery.rows[0];

      // Estadísticas de tendencia mensual del usuario
      const trendQuery = await pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as mes,
          COUNT(*) as cantidad
        FROM reportes 
        WHERE usuario_id = $1 AND activo = true
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes DESC
        LIMIT 6
      `, [userId]);

      userStats.tendencia_mensual = trendQuery.rows;

    } else if (userRole === 'authority' || userRole === 'admin') {
      // Estadísticas globales para autoridades
      const globalStatsQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_reportes,
          COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as en_proceso,
          COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos,
          COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as reportes_hoy,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as reportes_semana,
          COUNT(CASE WHEN imagen_url IS NOT NULL THEN 1 END) as con_imagen
        FROM reportes 
        WHERE activo = true
      `);

      globalStats = globalStatsQuery.rows[0];

      // Top tipos de residuos
      const tiposQuery = await pool.query(`
        SELECT 
          tipo_estimado,
          COUNT(*) as cantidad,
          COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos
        FROM reportes 
        WHERE activo = true AND tipo_estimado IS NOT NULL
        GROUP BY tipo_estimado
        ORDER BY cantidad DESC
        LIMIT 10
      `);

      globalStats.tipos_residuos = tiposQuery.rows;

      // Estadísticas por zona (usando coordenadas)
      const zonasQuery = await pool.query(`
        SELECT 
          ROUND(latitud::numeric, 2) as lat_zona,
          ROUND(longitud::numeric, 2) as lng_zona,
          COUNT(*) as cantidad,
          AVG(CASE WHEN estado = 'Limpio' AND fecha_resolucion IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/86400 
          END) as tiempo_promedio_resolucion
        FROM reportes 
        WHERE activo = true
        GROUP BY ROUND(latitud::numeric, 2), ROUND(longitud::numeric, 2)
        HAVING COUNT(*) > 1
        ORDER BY cantidad DESC
        LIMIT 20
      `);

      globalStats.zonas_problematicas = zonasQuery.rows;

      // Tendencia de reportes por día (últimos 30 días)
      const tendenciaQuery = await pool.query(`
        SELECT 
          DATE(created_at) as fecha,
          COUNT(*) as reportes_creados,
          COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos
        FROM reportes 
        WHERE activo = true 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
      `);

      globalStats.tendencia_diaria = tendenciaQuery.rows;
    }

    // Estadísticas generales del sistema
    const systemStatsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE role = 'citizen' AND activo = true) as ciudadanos,
        (SELECT COUNT(*) FROM usuarios WHERE role = 'authority' AND activo = true) as autoridades,
        (SELECT COUNT(*) FROM reportes WHERE activo = true) as total_reportes_sistema,
        (SELECT AVG(puntos) FROM usuarios WHERE role = 'citizen' AND activo = true) as promedio_puntos_ciudadanos
    `);

    const systemStats = systemStatsQuery.rows[0];

    // Ranking de usuarios (solo para citizens)
    let ranking = [];
    if (userRole === 'citizen') {
      const rankingQuery = await pool.query(`
        SELECT 
          nombre,
          puntos,
          nivel,
          (SELECT COUNT(*) FROM reportes r WHERE r.usuario_id = u.id AND r.activo = true) as total_reportes,
          ROW_NUMBER() OVER (ORDER BY puntos DESC) as posicion
        FROM usuarios u
        WHERE role = 'citizen' AND activo = true
        ORDER BY puntos DESC
        LIMIT 10
      `);

      ranking = rankingQuery.rows;

      // Encontrar posición del usuario actual
      const userRankQuery = await pool.query(`
        SELECT 
          COUNT(*) as usuarios_arriba
        FROM usuarios 
        WHERE role = 'citizen' AND activo = true AND puntos > (
          SELECT puntos FROM usuarios WHERE id = $1
        )
      `, [userId]);

      userStats.posicion_ranking = userRankQuery.rows[0].usuarios_arriba + 1;
    }

    const response = {
      user_stats: userStats,
      global_stats: globalStats,
      system_stats: systemStats,
      ranking: ranking,
      user: {
        id: userId,
        role: userRole
      },
      generated_at: new Date().toISOString()
    };

    console.log('✅ Estadísticas generadas exitosamente');

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'STATS_ERROR'
    });
  }
});

// GET /api/stats/user/:userId - Estadísticas específicas de un usuario (solo autoridades)
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;
    const targetUserId = parseInt(req.params.userId);

    // Solo autoridades pueden ver estadísticas de otros usuarios
    if (requestingUserRole !== 'authority' && requestingUserRole !== 'admin' && requestingUserId !== targetUserId) {
      return res.status(403).json({ 
        error: 'No tienes permisos para ver estas estadísticas',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    // Verificar que el usuario existe
    const userQuery = await pool.query(
      'SELECT id, nombre, email, role, puntos, nivel, created_at FROM usuarios WHERE id = $1 AND activo = true',
      [targetUserId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const targetUser = userQuery.rows[0];

    // Estadísticas detalladas del usuario
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as reportes_en_proceso,
        COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN imagen_url IS NOT NULL THEN 1 END) as reportes_con_imagen,
        MIN(created_at) as primer_reporte,
        MAX(created_at) as ultimo_reporte,
        COUNT(DISTINCT tipo_estimado) as tipos_diferentes_reportados,
        AVG(CASE WHEN estado = 'Limpio' AND fecha_resolucion IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/86400 
        END) as tiempo_promedio_resolucion_dias
      FROM reportes 
      WHERE usuario_id = $1 AND activo = true
    `, [targetUserId]);

    const userStats = statsQuery.rows[0];

    // Actividad mensual
    const activityQuery = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as reportes_creados,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos
      FROM reportes 
      WHERE usuario_id = $1 AND activo = true
      AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes DESC
    `, [targetUserId]);

    // Tipos de residuos reportados
    const tiposQuery = await pool.query(`
      SELECT 
        tipo_estimado,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos
      FROM reportes 
      WHERE usuario_id = $1 AND activo = true AND tipo_estimado IS NOT NULL
      GROUP BY tipo_estimado
      ORDER BY cantidad DESC
    `, [targetUserId]);

    const response = {
      user: targetUser,
      stats: userStats,
      activity_monthly: activityQuery.rows,
      waste_types: tiposQuery.rows,
      generated_at: new Date().toISOString(),
      generated_by: {
        id: requestingUserId,
        role: requestingUserRole
      }
    };

    console.log(`✅ Estadísticas de usuario ${targetUserId} generadas para ${requestingUserId}`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'USER_STATS_ERROR'
    });
  }
});

// GET /api/stats/reports - Estadísticas avanzadas de reportes
router.get('/reports', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { 
      start_date, 
      end_date, 
      tipo, 
      estado, 
      zona 
    } = req.query;

    let baseQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos,
        COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados,
        COUNT(CASE WHEN imagen_url IS NOT NULL THEN 1 END) as con_imagen,
        AVG(CASE WHEN estado = 'Limpio' AND fecha_resolucion IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/86400 
        END) as tiempo_promedio_resolucion_dias
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.activo = true
    `;

    const queryParams = [];
    let paramCount = 0;

    // Filtros
    if (userRole === 'citizen') {
      baseQuery += ` AND r.usuario_id = $${++paramCount}`;
      queryParams.push(userId);
    }

    if (start_date) {
      baseQuery += ` AND r.created_at >= $${++paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      baseQuery += ` AND r.created_at <= $${++paramCount}`;
      queryParams.push(end_date + ' 23:59:59');
    }

    if (tipo) {
      baseQuery += ` AND r.tipo_estimado = $${++paramCount}`;
      queryParams.push(tipo);
    }

    if (estado) {
      baseQuery += ` AND r.estado = $${++paramCount}`;
      queryParams.push(estado);
    }

    const statsResult = await pool.query(baseQuery, queryParams);
    const stats = statsResult.rows[0];

    // Query adicional para distribución por días de la semana
    let weekdayQuery = `
      SELECT 
        EXTRACT(DOW FROM created_at) as dia_semana,
        COUNT(*) as cantidad
      FROM reportes r
      WHERE r.activo = true
    `;

    if (userRole === 'citizen') {
      weekdayQuery += ` AND r.usuario_id = ${userId}`;
    }

    const weekdayParams = [];
    let weekdayParamCount = 0;

    if (start_date) {
      weekdayQuery += ` AND r.created_at >= $${++weekdayParamCount}`;
      weekdayParams.push(start_date);
    }

    if (end_date) {
      weekdayQuery += ` AND r.created_at <= $${++weekdayParamCount}`;
      weekdayParams.push(end_date + ' 23:59:59');
    }

    weekdayQuery += ` GROUP BY EXTRACT(DOW FROM created_at) ORDER BY dia_semana`;

    const weekdayResult = await pool.query(weekdayQuery, weekdayParams);

    // Mapear días de la semana
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const distribucionSemanal = weekdayResult.rows.map(row => ({
      dia: diasSemana[row.dia_semana],
      cantidad: parseInt(row.cantidad)
    }));

    const response = {
      stats: stats,
      distribucion_semanal: distribucionSemanal,
      filtros_aplicados: {
        start_date,
        end_date,
        tipo,
        estado,
        zona,
        user_role: userRole
      },
      generated_at: new Date().toISOString()
    };

    console.log('✅ Estadísticas de reportes generadas exitosamente');

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de reportes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'REPORT_STATS_ERROR'
    });
  }
});

module.exports = router;