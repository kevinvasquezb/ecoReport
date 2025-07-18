const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔍 Auth Middleware - Verificando autorización...');
    
    // Obtener token del header
    const authHeader = req.headers.authorization;
    console.log('📋 Authorization header:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader) {
      console.log('❌ No hay header de autorización');
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar formato Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Formato de token inválido');
      return res.status(401).json({ 
        error: 'Formato de token inválido',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Extraer token
    const token = authHeader.substring(7); // Remover "Bearer "
    console.log('🔑 Token extraído:', token ? 'SÍ' : 'NO');
    
    if (!token) {
      console.log('❌ Token vacío');
      return res.status(401).json({ 
        error: 'Token vacío',
        code: 'EMPTY_TOKEN'
      });
    }

    // Verificar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token JWT válido para usuario:', decoded.email);
    } catch (jwtError) {
      console.log('❌ Error verificando JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          error: 'Error de autenticación',
          code: 'AUTH_ERROR'
        });
      }
    }

    // Verificar que el usuario existe en la base de datos
    try {
      const userResult = await pool.query(
        'SELECT id, email, nombre, telefono, role, puntos, nivel, activo FROM usuarios WHERE id = $1 AND activo = true',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        console.log('❌ Usuario no encontrado en BD:', decoded.id);
        return res.status(401).json({ 
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];
      console.log('✅ Usuario verificado en BD:', user.email);

      // Agregar información del usuario al request
      req.user = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        role: user.role,
        puntos: user.puntos,
        nivel: user.nivel
      };

      console.log('✅ Auth Middleware - Usuario autorizado:', req.user.email);
      next();

    } catch (dbError) {
      console.error('❌ Error consultando usuario en BD:', dbError);
      return res.status(500).json({ 
        error: 'Error interno del servidor',
        code: 'DATABASE_ERROR'
      });
    }

  } catch (error) {
    console.error('❌ Error general en auth middleware:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = authMiddleware;