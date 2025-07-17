const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/puntos/historial - Obtener historial de puntos del usuario
router.get('/historial', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT 
        ph.id,
        ph.puntos,
        ph.tipo_accion,
        ph.descripcion,
        ph.created_at,
        ph.reporte_id,
        r.descripcion as reporte_descripcion
      FROM puntos_historial ph
      LEFT JOIN reportes r ON ph.reporte_id = r.id
      WHERE ph.usuario_id = $1
      ORDER BY ph.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      success: true,
      historial: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo historial de puntos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/puntos/logros - Obtener logros del usuario
router.get('/logros', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener todos los logros con estado desbloqueado
    const result = await pool.query(`
      SELECT 
        l.id,
        l.nombre,
        l.descripcion,
        l.icono,
        l.puntos_requeridos,
        l.reportes_requeridos,
        l.condicion_especial,
        ul.desbloqueado_at,
        CASE WHEN ul.usuario_id IS NOT NULL THEN true ELSE false END as desbloqueado
      FROM logros l
      LEFT JOIN usuarios_logros ul ON l.id = ul.logro_id AND ul.usuario_id = $1
      WHERE l.activo = true
      ORDER BY l.id
    `, [userId]);

    res.json({
      success: true,
      logros: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo logros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/puntos/leaderboard - Obtener tabla de clasificación
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    
    let whereClause = '';
    if (period === 'week') {
      whereClause = "WHERE u.created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      whereClause = "WHERE u.created_at >= NOW() - INTERVAL '30 days'";
    }

    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.puntos,
        u.nivel,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        ROW_NUMBER() OVER (ORDER BY u.puntos DESC) as posicion
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id
      ${whereClause}
      GROUP BY u.id, u.nombre, u.puntos, u.nivel
      ORDER BY u.puntos DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      leaderboard: result.rows,
      period: period
    });

  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/puntos/stats - Obtener estadísticas completas del usuario
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Estadísticas del usuario
    const userStats = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.puntos,
        u.nivel,
        u.created_at,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'Reportado' THEN 1 END) as reportes_pendientes,
        COUNT(CASE WHEN r.estado = 'En proceso' THEN 1 END) as reportes_proceso,
        COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        COUNT(CASE WHEN r.estado = 'Rechazado' THEN 1 END) as reportes_rechazados,
        COUNT(CASE WHEN r.imagen_url IS NOT NULL THEN 1 END) as reportes_con_imagen
      FROM usuarios u
      LEFT JOIN reportes r ON u.id = r.usuario_id
      WHERE u.id = $1
      GROUP BY u.id, u.nombre, u.email, u.puntos, u.nivel, u.created_at
    `, [userId]);

    // Posición en leaderboard
    const positionResult = await pool.query(`
      SELECT COUNT(*) + 1 as posicion
      FROM usuarios 
      WHERE puntos > (SELECT puntos FROM usuarios WHERE id = $1)
    `, [userId]);

    // Últimos puntos ganados
    const recentPoints = await pool.query(`
      SELECT 
        puntos,
        tipo_accion,
        descripcion,
        created_at
      FROM puntos_historial
      WHERE usuario_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    // Logros desbloqueados
    const achievements = await pool.query(`
      SELECT 
        l.nombre,
        l.descripcion,
        l.icono,
        ul.desbloqueado_at
      FROM usuarios_logros ul
      JOIN logros l ON ul.logro_id = l.id
      WHERE ul.usuario_id = $1
      ORDER BY ul.desbloqueado_at DESC
    `, [userId]);

    const user = userStats.rows[0];
    const position = positionResult.rows[0];

    res.json({
      success: true,
      stats: {
        usuario: user,
        posicion: position.posicion,
        historial_reciente: recentPoints.rows,
        logros_desbloqueados: achievements.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/puntos/manual - Otorgar puntos manualmente (solo admin)
router.post('/manual', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { usuario_id, puntos, tipo_accion, descripcion } = req.body;

    if (!usuario_id || !puntos || !tipo_accion) {
      return res.status(400).json({ error: 'usuario_id, puntos y tipo_accion son requeridos' });
    }

    // Llamar función para actualizar puntos
    await pool.query(`
      SELECT actualizar_puntos_usuario($1, $2, $3, $4, NULL)
    `, [usuario_id, puntos, tipo_accion, descripcion]);

    res.json({
      success: true,
      message: 'Puntos otorgados exitosamente'
    });

  } catch (error) {
    console.error('Error otorgando puntos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/puntos/config - Obtener configuración de puntos (solo admin)
router.get('/config', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const result = await pool.query(`
      SELECT * FROM puntos_config
      ORDER BY accion
    `);

    res.json({
      success: true,
      configuracion: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/puntos/config/:id - Actualizar configuración de puntos (solo admin)
router.put('/config/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { puntos, descripcion, activo } = req.body;

    await pool.query(`
      UPDATE puntos_config 
      SET puntos = $1, descripcion = $2, activo = $3, updated_at = NOW()
      WHERE id = $4
    `, [puntos, descripcion, activo, id]);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;