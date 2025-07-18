const express = require('express');
const { pool } = require('../database/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    const offset = (page - 1) * limit;

    console.log(`📬 Obteniendo notificaciones para usuario ${userId}`);

    let query = `
      SELECT 
        n.id,
        n.tipo,
        n.titulo,
        n.mensaje,
        n.data,
        n.leida,
        n.created_at,
        r.id as reporte_id,
        r.descripcion as reporte_descripcion,
        r.estado as reporte_estado
      FROM notificaciones n
      LEFT JOIN reportes r ON n.reporte_id = r.id
      WHERE n.usuario_id = $1
    `;

    const queryParams = [userId];
    let paramCount = 1;

    if (unread_only === 'true') {
      query += ` AND n.leida = false`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Contar total de notificaciones
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notificaciones n
      WHERE n.usuario_id = $1
    `;
    const countParams = [userId];

    if (unread_only === 'true') {
      countQuery += ` AND n.leida = false`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Contar no leídas
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as unread FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [userId]
    );
    const unreadCount = parseInt(unreadResult.rows[0].unread);

    console.log(`✅ ${result.rows.length} notificaciones obtenidas (${unreadCount} no leídas)`);

    res.json({
      notifications: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit),
        has_next: offset + result.rows.length < total,
        has_prev: page > 1
      },
      unread_count: unreadCount
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'NOTIFICATIONS_ERROR'
    });
  }
});

// PATCH /api/notifications/:id/read - Marcar notificación como leída
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ 
        error: 'ID de notificación inválido',
        code: 'INVALID_NOTIFICATION_ID'
      });
    }

    console.log(`📖 Marcando notificación ${notificationId} como leída para usuario ${userId}`);

    // Verificar que la notificación pertenece al usuario
    const result = await pool.query(
      'UPDATE notificaciones SET leida = true, updated_at = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Notificación no encontrada',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    console.log('✅ Notificación marcada como leída');

    res.json({
      message: 'Notificación marcada como leída',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'MARK_READ_ERROR'
    });
  }
});

// PATCH /api/notifications/read-all - Marcar todas las notificaciones como leídas
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📖 Marcando todas las notificaciones como leídas para usuario ${userId}`);

    const result = await pool.query(
      'UPDATE notificaciones SET leida = true, updated_at = NOW() WHERE usuario_id = $1 AND leida = false RETURNING id',
      [userId]
    );

    console.log(`✅ ${result.rows.length} notificaciones marcadas como leídas`);

    res.json({
      message: 'Todas las notificaciones marcadas como leídas',
      updated_count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'MARK_ALL_READ_ERROR'
    });
  }
});

// DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ 
        error: 'ID de notificación inválido',
        code: 'INVALID_NOTIFICATION_ID'
      });
    }

    console.log(`🗑️ Eliminando notificación ${notificationId} para usuario ${userId}`);

    const result = await pool.query(
      'DELETE FROM notificaciones WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Notificación no encontrada',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    console.log('✅ Notificación eliminada');

    res.json({
      message: 'Notificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando notificación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'DELETE_NOTIFICATION_ERROR'
    });
  }
});

// POST /api/notifications/test - Crear notificación de prueba (solo development)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        error: 'Endpoint no disponible en producción',
        code: 'NOT_AVAILABLE_IN_PRODUCTION'
      });
    }

    const userId = req.user.id;
    const { tipo = 'info', titulo = 'Notificación de prueba', mensaje = 'Esta es una notificación de prueba' } = req.body;

    console.log(`🧪 Creando notificación de prueba para usuario ${userId}`);

    const result = await pool.query(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, data, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [userId, tipo, titulo, mensaje, JSON.stringify({ test: true })]);

    console.log('✅ Notificación de prueba creada');

    res.status(201).json({
      message: 'Notificación de prueba creada',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creando notificación de prueba:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: 'TEST_NOTIFICATION_ERROR'
    });
  }
});

// Función utilitaria para crear notificaciones (uso interno)
const createNotification = async (userId, tipo, titulo, mensaje, data = {}, reporteId = null) => {
  try {
    const result = await pool.query(`
      INSERT INTO notificaciones (usuario_id, reporte_id, tipo, titulo, mensaje, data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [userId, reporteId, tipo, titulo, mensaje, JSON.stringify(data)]);

    console.log(`📬 Notificación creada: ${tipo} para usuario ${userId}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
};

// Función para notificar cambio de estado de reporte
const notifyReportStatusChange = async (reporteId, newStatus, comment = null) => {
  try {
    // Obtener información del reporte y usuario
    const reporteQuery = await pool.query(`
      SELECT 
        r.id, r.usuario_id, r.descripcion, r.tipo_estimado,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1
    `, [reporteId]);

    if (reporteQuery.rows.length === 0) {
      throw new Error('Reporte no encontrado');
    }

    const reporte = reporteQuery.rows[0];
    
    let titulo, mensaje, tipo;
    
    switch (newStatus) {
      case 'En proceso':
        tipo = 'status_update';
        titulo = '🔄 Tu reporte está siendo procesado';
        mensaje = `Tu reporte "${reporte.tipo_estimado || 'de residuos'}" está ahora en proceso de resolución.`;
        break;
      
      case 'Limpio':
        tipo = 'report_resolved';
        titulo = '✅ ¡Tu reporte ha sido resuelto!';
        mensaje = `El problema de "${reporte.tipo_estimado || 'residuos'}" que reportaste ya ha sido solucionado. ¡Gracias por contribuir a una ciudad más limpia!`;
        break;
      
      case 'Rechazado':
        tipo = 'report_rejected';
        titulo = '❌ Tu reporte ha sido rechazado';
        mensaje = `Tu reporte de "${reporte.tipo_estimado || 'residuos'}" ha sido rechazado.${comment ? ` Motivo: ${comment}` : ''}`;
        break;
      
      default:
        tipo = 'status_update';
        titulo = '📋 Estado de tu reporte actualizado';
        mensaje = `El estado de tu reporte ha sido actualizado a: ${newStatus}`;
    }

    const data = {
      reporte_id: reporteId,
      old_status: null,
      new_status: newStatus,
      comment: comment
    };

    await createNotification(reporte.usuario_id, tipo, titulo, mensaje, data, reporteId);
    
    console.log(`✅ Notificación de cambio de estado enviada a usuario ${reporte.usuario_id}`);
    
  } catch (error) {
    console.error('❌ Error enviando notificación de cambio de estado:', error);
  }
};

// Función para notificar nuevos reportes a autoridades
const notifyAuthoritiesNewReport = async (reporteId) => {
  try {
    // Obtener información del reporte
    const reporteQuery = await pool.query(`
      SELECT 
        r.id, r.descripcion, r.tipo_estimado, r.direccion,
        u.nombre as usuario_nombre
      FROM reportes r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1
    `, [reporteId]);

    if (reporteQuery.rows.length === 0) {
      throw new Error('Reporte no encontrado');
    }

    const reporte = reporteQuery.rows[0];

    // Obtener todas las autoridades activas
    const authoritiesQuery = await pool.query(
      "SELECT id FROM usuarios WHERE role = 'authority' AND activo = true"
    );

    const titulo = '📋 Nuevo reporte recibido';
    const mensaje = `Nuevo reporte de "${reporte.tipo_estimado || 'residuos'}" creado por ${reporte.usuario_nombre}${reporte.direccion ? ` en ${reporte.direccion}` : ''}.`;
    const data = {
      reporte_id: reporteId,
      action_required: true,
      priority: 'normal'
    };

    // Crear notificación para cada autoridad
    for (const authority of authoritiesQuery.rows) {
      await createNotification(authority.id, 'new_report', titulo, mensaje, data, reporteId);
    }

    console.log(`✅ Notificaciones de nuevo reporte enviadas a ${authoritiesQuery.rows.length} autoridades`);
    
  } catch (error) {
    console.error('❌ Error enviando notificaciones a autoridades:', error);
  }
};

// Función para notificar logros a usuarios
const notifyUserAchievement = async (userId, achievement, points = 0) => {
  try {
    const achievementMessages = {
      'first_report': {
        titulo: '🎉 ¡Primer Reporte!',
        mensaje: `¡Felicidades! Has creado tu primer reporte. Has ganado ${points} puntos.`,
        tipo: 'achievement'
      },
      'active_reporter': {
        titulo: '🏆 EcoReporter Activo',
        mensaje: `¡Excelente! Has creado 5 reportes. Has ganado ${points} puntos y desbloqueado el logro "EcoReporter Activo".`,
        tipo: 'achievement'
      },
      'problem_solver': {
        titulo: '✨ Solucionador de Problemas',
        mensaje: `¡Increíble! Uno de tus reportes ha sido resuelto. Has ganado ${points} puntos adicionales.`,
        tipo: 'achievement'
      },
      'committed_reporter': {
        titulo: '🌟 EcoReporter Comprometido',
        mensaje: `¡Impresionante! Has creado 10 reportes. Has ganado ${points} puntos y alcanzado el nivel "EcoReporter Comprometido".`,
        tipo: 'achievement'
      },
      'level_up': {
        titulo: '📈 ¡Subiste de Nivel!',
        mensaje: `¡Felicidades! Has alcanzado un nuevo nivel. Has ganado ${points} puntos de bonificación.`,
        tipo: 'level_up'
      }
    };

    const achievementData = achievementMessages[achievement];
    if (!achievementData) {
      console.log(`⚠️ Logro no reconocido: ${achievement}`);
      return;
    }

    const data = {
      achievement: achievement,
      points_earned: points,
      timestamp: new Date().toISOString()
    };

    await createNotification(userId, achievementData.tipo, achievementData.titulo, achievementData.mensaje, data);
    
    console.log(`🏆 Notificación de logro "${achievement}" enviada a usuario ${userId}`);
    
  } catch (error) {
    console.error('❌ Error enviando notificación de logro:', error);
  }
};

// Función para verificar y otorgar logros
const checkAndGrantAchievements = async (userId) => {
  try {
    // Obtener estadísticas del usuario
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(CASE WHEN estado = 'Limpio' THEN 1 END) as reportes_resueltos,
        u.puntos, u.nivel
      FROM reportes r
      RIGHT JOIN usuarios u ON r.usuario_id = u.id
      WHERE u.id = $1 AND u.activo = true
      GROUP BY u.id, u.puntos, u.nivel
    `, [userId]);

    if (statsQuery.rows.length === 0) {
      return;
    }

    const stats = statsQuery.rows[0];
    const reportes = parseInt(stats.total_reportes);
    const resueltos = parseInt(stats.reportes_resueltos);

    // Verificar logros
    if (reportes === 1) {
      await notifyUserAchievement(userId, 'first_report', 10);
    }
    
    if (reportes === 5) {
      await notifyUserAchievement(userId, 'active_reporter', 25);
    }
    
    if (reportes === 10) {
      await notifyUserAchievement(userId, 'committed_reporter', 50);
    }
    
    if (resueltos > 0 && resueltos % 5 === 0) {
      await notifyUserAchievement(userId, 'problem_solver', resueltos * 5);
    }

  } catch (error) {
    console.error('❌ Error verificando logros:', error);
  }
};

// Función para enviar notificaciones urgentes
const sendUrgentNotification = async (userIds, titulo, mensaje, data = {}) => {
  try {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    const notifications = [];
    for (const userId of userIds) {
      const notification = await createNotification(userId, 'urgent', titulo, mensaje, { ...data, urgent: true });
      notifications.push(notification);
    }

    console.log(`🚨 ${notifications.length} notificaciones urgentes enviadas`);
    return notifications;
    
  } catch (error) {
    console.error('❌ Error enviando notificaciones urgentes:', error);
    throw error;
  }
};

// Función para limpiar notificaciones antiguas (para usar en cron job)
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const result = await pool.query(
      'DELETE FROM notificaciones WHERE created_at < NOW() - INTERVAL $1 DAY RETURNING id',
      [daysOld]
    );

    console.log(`🧹 ${result.rows.length} notificaciones antiguas eliminadas (más de ${daysOld} días)`);
    return result.rows.length;
    
  } catch (error) {
    console.error('❌ Error limpiando notificaciones antiguas:', error);
    throw error;
  }
};

// Función para obtener estadísticas de notificaciones
const getNotificationStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN leida = false THEN 1 END) as no_leidas,
        COUNT(CASE WHEN tipo = 'achievement' THEN 1 END) as logros,
        COUNT(CASE WHEN tipo = 'status_update' THEN 1 END) as actualizaciones_estado,
        COUNT(CASE WHEN tipo = 'new_report' THEN 1 END) as nuevos_reportes,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as hoy,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as esta_semana
      FROM notificaciones
    `);

    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de notificaciones:', error);
    throw error;
  }
};

module.exports = {
  router,
  createNotification,
  notifyReportStatusChange,
  notifyAuthoritiesNewReport,
  notifyUserAchievement,
  checkAndGrantAchievements,
  sendUrgentNotification,
  cleanupOldNotifications,
  getNotificationStats
};