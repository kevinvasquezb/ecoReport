const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/user/:id - Estadísticas detalladas de usuario
router.get('/user/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    // Validar que el ID sea un número válido
    if (isNaN(userId)) {
      return res.status(400).json({ 
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    // Solo el propio usuario o autoridades pueden ver estadísticas
    if (userId !== currentUserId && req.user.role !== 'authority' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Sin permisos para ver estas estadísticas',
        code: 'FORBIDDEN'
      });
    }

    // Estadísticas principales del usuario
    const userStats = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.puntos,
        u.nivel,
        u.created_at as usuario_desde,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN r.estado IN ('Reportado', 'En proceso') THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN r.estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reportes_ultima_semana,
        COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as reportes_ultimo_mes
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
      WHERE u.id = $1 AND u.activo = true
      GROUP BY u.id, u.nombre, u.email, u.puntos, u.nivel, u.created_at
    `, [userId]);

    if (userStats.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const stats = userStats.rows[0];
    
    // Calcular ranking del usuario
    const ranking = await pool.query(`
      SELECT COUNT(*) + 1 as posicion
      FROM usuarios 
      WHERE puntos > $1 AND activo = true
    `, [stats.puntos]);

    // Estadísticas de reportes por mes (últimos 6 meses)
    const reportesPorMes = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as cantidad
      FROM reportes 
      WHERE usuario_id = $1 AND activo = true 
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `, [userId]);

    // Tipos de residuos más reportados por el usuario
    const tiposResiduos = await pool.query(`
      SELECT 
        COALESCE(tipo_estimado, 'Sin clasificar') as tipo,
        COUNT(*) as cantidad
      FROM reportes 
      WHERE usuario_id = $1 AND activo = true
      GROUP BY tipo_estimado
      ORDER BY cantidad DESC
      LIMIT 5
    `, [userId]);

    // Tiempo promedio de resolución de reportes del usuario
    const tiempoResolucion = await pool.query(`
      SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM (fecha_resolucion - created_at))/3600), 2) as horas_promedio
      FROM reportes 
      WHERE usuario_id = $1 AND estado = 'Limpio' 
        AND fecha_resolucion IS NOT NULL AND activo = true
    `, [userId]);

    console.log(`✅ Estadísticas consultadas para usuario ${userId} por ${currentUserId}`);

    res.json({
      success: true,
      stats: {
        ...stats,
        ranking: ranking.rows[0].posicion || 1,
        porcentaje_resueltos: stats.total_reportes > 0 
          ? Math.round((stats.reportes_resueltos / stats.total_reportes) * 100) 
          : 0,
        tiempo_promedio_resolucion: tiempoResolucion.rows[0]?.horas_promedio || null
      },
      reportesPorMes: reportesPorMes.rows,
      tiposResiduos: tiposResiduos.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/stats/general - Estadísticas generales del sistema
router.get('/general', authMiddleware, async (req, res) => {
  try {
    // Estadísticas generales
    const generalStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT CASE WHEN u.role = 'citizen' THEN u.id END) as total_ciudadanos,
        COUNT(DISTINCT CASE WHEN u.role = 'authority' THEN u.id END) as total_autoridades,
        COUNT(DISTINCT r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN r.estado IN ('Reportado', 'En proceso') THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN r.estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reportes_ultima_semana,
        COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as reportes_ultimo_mes,
        ROUND(AVG(CASE WHEN r.estado = 'Limpio' AND r.fecha_resolucion IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (r.fecha_resolucion - r.created_at))/3600 END), 2) as tiempo_promedio_resolucion_horas
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
      WHERE u.activo = true
    `);

    // Top 5 usuarios más activos
    const topUsers = await pool.query(`
      SELECT 
        u.nombre,
        u.puntos,
        u.nivel,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
      WHERE u.activo = true AND u.role = 'citizen'
      GROUP BY u.id, u.nombre, u.puntos, u.nivel
      HAVING COUNT(r.id) > 0
      ORDER BY u.puntos DESC, total_reportes DESC
      LIMIT 5
    `);

    // Reportes por estado
    const reportesPorEstado = await pool.query(`
      SELECT 
        estado,
        COUNT(*) as cantidad,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reportes WHERE activo = true)), 2) as porcentaje
      FROM reportes 
      WHERE activo = true
      GROUP BY estado
      ORDER BY cantidad DESC
    `);

    // Reportes por mes (últimos 12 meses)
    const reportesPorMes = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as resueltos
      FROM reportes 
      WHERE activo = true AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `);

    // Tipos de residuos más reportados
    const tiposResiduos = await pool.query(`
      SELECT 
        COALESCE(tipo_estimado, 'Sin clasificar') as tipo,
        COUNT(*) as cantidad
      FROM reportes 
      WHERE activo = true
      GROUP BY tipo_estimado
      ORDER BY cantidad DESC
      LIMIT 10
    `);

    // Eficiencia del sistema (porcentaje de resolución)
    const eficiencia = await pool.query(`
      SELECT 
        ROUND(
          (COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(CASE WHEN estado != 'Rechazado' THEN 1 END), 0)), 2
        ) as porcentaje_eficiencia
      FROM reportes 
      WHERE activo = true
    `);

    console.log(`✅ Estadísticas generales consultadas por usuario ${req.user.id}`);

    res.json({
      success: true,
      general: {
        ...generalStats.rows[0],
        porcentaje_eficiencia: eficiencia.rows[0]?.porcentaje_eficiencia || 0
      },
      topUsers: topUsers.rows,
      reportesPorEstado: reportesPorEstado.rows,
      reportesPorMes: reportesPorMes.rows,
      tiposResiduos: tiposResiduos.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas generales:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/stats/dashboard - Estadísticas para dashboard de autoridades
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Solo autoridades y admins pueden acceder
    if (req.user.role !== 'authority' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        details: 'Solo autoridades pueden acceder a estas estadísticas',
        code: 'FORBIDDEN'
      });
    }

    // Métricas del día actual
    const metricsHoy = await pool.query(`
      SELECT 
        COUNT(*) as reportes_hoy,
        COUNT(CASE WHEN estado = 'Reportado' THEN 1 END) as nuevos_hoy,
        COUNT(CASE WHEN estado = 'Limpio' AND fecha_resolucion::date = CURRENT_DATE THEN 1 END) as resueltos_hoy
      FROM reportes 
      WHERE created_at::date = CURRENT_DATE AND activo = true
    `);

    // Reportes urgentes (más de 7 días sin resolver)
    const reportesUrgentes = await pool.query(`
      SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.created_at,
        u.nombre as usuario_nombre,
        EXTRACT(DAYS FROM (NOW() - r.created_at)) as dias_pendiente
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.estado IN ('Reportado', 'En proceso') 
        AND r.created_at < NOW() - INTERVAL '7 days'
        AND r.activo = true
      ORDER BY r.created_at ASC
      LIMIT 10
    `);

    // Carga de trabajo por autoridad
    const cargaTrabajo = await pool.query(`
      SELECT 
        a.nombre as autoridad_nombre,
        COUNT(r.id) as reportes_asignados,
        COUNT(CASE WHEN r.estado = 'En proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as completados
      FROM usuarios a
      LEFT JOIN reportes r ON a.id = r.autoridad_asignada AND r.activo = true
      WHERE a.role = 'authority' AND a.activo = true
      GROUP BY a.id, a.nombre
      ORDER BY reportes_asignados DESC
    `);

    console.log(`✅ Estadísticas de dashboard consultadas por autoridad ${req.user.id}`);

    res.json({
      success: true,
      metricsHoy: metricsHoy.rows[0],
      reportesUrgentes: reportesUrgentes.rows,
      cargaTrabajo: cargaTrabajo.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de dashboard:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;