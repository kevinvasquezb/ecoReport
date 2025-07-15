const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No hay token, acceso denegado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener usuario de la BD
    const result = await pool.query(
      'SELECT id, email, nombre, role FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Añadir usuario al request
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Error en auth middleware:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;