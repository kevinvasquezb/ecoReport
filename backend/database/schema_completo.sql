-- ECOREPORTS - SCHEMA COMPLETO DE BASE DE DATOS
-- Versión: 2.0 - Incluye todas las tablas necesarias

-- ============================================================================
-- TABLA: usuarios (YA EXISTENTE - ACTUALIZADA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  puntos INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_puntos ON usuarios(puntos DESC);

-- ============================================================================
-- TABLA: reportes (YA EXISTENTE - ACTUALIZADA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reportes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Geolocalización
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  direccion TEXT,
  
  -- Contenido del reporte
  descripcion TEXT NOT NULL,
  tipo_estimado VARCHAR(100),
  
  -- Imágenes en Cloudinary
  imagen_url VARCHAR(500),
  imagen_public_id VARCHAR(255),
  imagen_thumbnail_url VARCHAR(500),
  thumbnail_public_id VARCHAR(255),
  
  -- Campos de IA (para futuro uso)
  ai_tipo_residuo VARCHAR(100),
  ai_urgencia VARCHAR(20) CHECK (ai_urgencia IN ('Alta', 'Media', 'Baja')),
  ai_cantidad VARCHAR(50),
  ai_resumen TEXT,
  ai_recomendaciones TEXT,
  ai_confianza DECIMAL(3,2),
  ai_procesado_at TIMESTAMP,
  
  -- Gestión de estados
  estado VARCHAR(50) DEFAULT 'Reportado' CHECK (estado IN ('Reportado', 'En proceso', 'Limpio', 'Rechazado')),
  autoridad_asignada INTEGER REFERENCES usuarios(id),
  comentario_autoridad TEXT,
  fecha_resolucion TIMESTAMP,
  
  -- Metadatos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_ubicacion ON reportes(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_reportes_ai_urgencia ON reportes(ai_urgencia);
CREATE INDEX IF NOT EXISTS idx_reportes_autoridad ON reportes(autoridad_asignada);
CREATE INDEX IF NOT EXISTS idx_reportes_activo ON reportes(activo);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo_estimado);

-- ============================================================================
-- TABLA: notificaciones (NUEVA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  reporte_id INTEGER REFERENCES reportes(id) ON DELETE SET NULL,
  
  -- Contenido de la notificación
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('info', 'success', 'warning', 'error', 'achievement', 'status_update', 'new_report', 'report_resolved', 'report_rejected', 'level_up', 'urgent')),
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Estado
  leida BOOLEAN DEFAULT FALSE,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_reporte ON notificaciones(reporte_id);

-- ============================================================================
-- TABLA: comentarios_reportes (NUEVA - PARA FUTURO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS comentarios_reportes (
  id SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Contenido del comentario
  comentario TEXT NOT NULL,
  
  -- Metadatos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para comentarios
CREATE INDEX IF NOT EXISTS idx_comentarios_reporte ON comentarios_reportes(reporte_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario ON comentarios_reportes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_fecha ON comentarios_reportes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_activo ON comentarios_reportes(activo);

-- ============================================================================
-- TABLA: sesiones_activas (NUEVA - PARA FUTURO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sesiones_activas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Información de la sesión
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  
  -- Control de sesión
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  activa BOOLEAN DEFAULT true,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_activas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones_activas(token_hash);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones_activas(expires_at);
CREATE INDEX IF NOT EXISTS idx_sesiones_activa ON sesiones_activas(activa);

-- ============================================================================
-- TABLA: logros_usuarios (NUEVA - SISTEMA DE LOGROS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logros_usuarios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Información del logro
  logro_tipo VARCHAR(50) NOT NULL CHECK (logro_tipo IN ('first_report', 'active_reporter', 'committed_reporter', 'problem_solver', 'level_up', 'streak_reporter', 'photo_reporter', 'verified_reporter')),
  logro_nombre VARCHAR(255) NOT NULL,
  logro_descripcion TEXT,
  puntos_otorgados INTEGER DEFAULT 0,
  
  -- Metadatos del logro
  data JSONB DEFAULT '{}',
  desbloqueado_at TIMESTAMP DEFAULT NOW()
);

-- Índices para logros
CREATE INDEX IF NOT EXISTS idx_logros_usuario ON logros_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logros_tipo ON logros_usuarios(logro_tipo);
CREATE INDEX IF NOT EXISTS idx_logros_fecha ON logros_usuarios(desbloqueado_at DESC);

-- Constraint único para evitar logros duplicados
ALTER TABLE logros_usuarios ADD CONSTRAINT IF NOT EXISTS uk_logros_usuario_tipo 
UNIQUE (usuario_id, logro_tipo);

-- ============================================================================
-- TABLA: estadisticas_sistema (NUEVA - MÉTRICAS GLOBALES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS estadisticas_sistema (
  id SERIAL PRIMARY KEY,
  
  -- Métricas del día
  fecha DATE NOT NULL UNIQUE,
  total_reportes INTEGER DEFAULT 0,
  reportes_creados INTEGER DEFAULT 0,
  reportes_resueltos INTEGER DEFAULT 0,
  reportes_rechazados INTEGER DEFAULT 0,
  
  -- Métricas de usuarios
  usuarios_activos INTEGER DEFAULT 0,
  nuevos_usuarios INTEGER DEFAULT 0,
  
  -- Métricas de engagement
  reportes_con_imagen INTEGER DEFAULT 0,
  tiempo_promedio_resolucion DECIMAL(8,2), -- en días
  
  -- Metadatos
  actualizado_at TIMESTAMP DEFAULT NOW()
);

-- Índices para estadísticas
CREATE INDEX IF NOT EXISTS idx_estadisticas_fecha ON estadisticas_sistema(fecha DESC);

-- ============================================================================
-- TABLA: configuracion_sistema (NUEVA - CONFIGURACIONES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id SERIAL PRIMARY KEY,
  
  -- Configuración
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  descripcion TEXT,
  
  -- Control
  activa BOOLEAN DEFAULT true,
  modificable BOOLEAN DEFAULT true,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para configuración
CREATE INDEX IF NOT EXISTS idx_config_clave ON configuracion_sistema(clave);
CREATE INDEX IF NOT EXISTS idx_config_activa ON configuracion_sistema(activa);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reportes_updated_at ON reportes;
CREATE TRIGGER update_reportes_updated_at 
    BEFORE UPDATE ON reportes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notificaciones_updated_at ON notificaciones;
CREATE TRIGGER update_notificaciones_updated_at 
    BEFORE UPDATE ON notificaciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comentarios_updated_at ON comentarios_reportes;
CREATE TRIGGER update_comentarios_updated_at 
    BEFORE UPDATE ON comentarios_reportes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_updated_at ON configuracion_sistema;
CREATE TRIGGER update_config_updated_at 
    BEFORE UPDATE ON configuracion_sistema 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIÓN PARA CALCULAR NIVEL BASADO EN PUNTOS
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_nivel(puntos INTEGER)
RETURNS INTEGER AS $$
BEGIN
    CASE 
        WHEN puntos < 100 THEN RETURN 1;
        WHEN puntos < 250 THEN RETURN 2;
        WHEN puntos < 500 THEN RETURN 3;
        WHEN puntos < 1000 THEN RETURN 4;
        WHEN puntos < 2000 THEN RETURN 5;
        ELSE RETURN 6;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER PARA ACTUALIZAR NIVEL AUTOMÁTICAMENTE
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_nivel_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si los puntos cambiaron
    IF OLD.puntos IS DISTINCT FROM NEW.puntos THEN
        NEW.nivel = calcular_nivel(NEW.puntos);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_nivel ON usuarios;
CREATE TRIGGER trigger_actualizar_nivel
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_nivel_usuario();

-- ============================================================================
-- DATOS INICIALES DEL SISTEMA
-- ============================================================================

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES
('puntos_por_reporte', '10', 'number', 'Puntos base por crear un reporte'),
('puntos_por_imagen', '5', 'number', 'Puntos extra por incluir imagen'),
('puntos_por_resolucion', '25', 'number', 'Puntos extra cuando se resuelve el reporte'),
('max_reportes_por_dia', '10', 'number', 'Máximo de reportes por usuario por día'),
('tiempo_edicion_reporte', '30', 'number', 'Minutos que se puede editar un reporte'),
('notificaciones_activas', 'true', 'boolean', 'Si las notificaciones están activas'),
('logros_activos', 'true', 'boolean', 'Si el sistema de logros está activo'),
('version_sistema', '2.0.0', 'string', 'Versión actual del sistema')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista para reportes con información completa del usuario
CREATE OR REPLACE VIEW v_reportes_completos AS
SELECT 
    r.*,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    u.role as usuario_role,
    u.puntos as usuario_puntos,
    ua.nombre as autoridad_nombre,
    ua.email as autoridad_email,
    CASE 
        WHEN r.imagen_url IS NOT NULL THEN true 
        ELSE false 
    END as tiene_imagen,
    CASE 
        WHEN r.fecha_resolucion IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (r.fecha_resolucion - r.created_at))/86400 
        ELSE NULL 
    END as dias_resolucion
FROM reportes r
JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN usuarios ua ON r.autoridad_asignada = ua.id
WHERE r.activo = true;

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW v_estadisticas_usuarios AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.role,
    u.puntos,
    u.nivel,
    u.created_at as miembro_desde,
    COUNT(r.id) as total_reportes,
    COUNT(CASE WHEN r.estado = 'Limpio' THEN 1 END) as reportes_resueltos,
    COUNT(CASE WHEN r.estado = 'En proceso' THEN 1 END) as reportes_en_proceso,
    COUNT(CASE WHEN r.estado = 'Reportado' THEN 1 END) as reportes_pendientes,
    COUNT(CASE WHEN r.imagen_url IS NOT NULL THEN 1 END) as reportes_con_imagen,
    COUNT(l.id) as total_logros,
    AVG(CASE WHEN r.fecha_resolucion IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (r.fecha_resolucion - r.created_at))/86400 
    END) as promedio_dias_resolucion
FROM usuarios u
LEFT JOIN reportes r ON u.id = r.usuario_id AND r.activo = true
LEFT JOIN logros_usuarios l ON u.id = l.usuario_id
WHERE u.activo = true
GROUP BY u.id, u.nombre, u.email, u.role, u.puntos, u.nivel, u.created_at;

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para obtener reportes cercanos usando Haversine
CREATE OR REPLACE FUNCTION obtener_reportes_cercanos(
    lat_centro DECIMAL,
    lng_centro DECIMAL,
    radio_metros INTEGER DEFAULT 1000,
    limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    id INTEGER,
    descripcion TEXT,
    latitud DECIMAL,
    longitud DECIMAL,
    direccion TEXT,
    tipo_estimado VARCHAR,
    estado VARCHAR,
    distancia_metros INTEGER,
    usuario_nombre VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.direccion,
        r.tipo_estimado,
        r.estado,
        ROUND(
            6371000 * acos(
                cos(radians(lat_centro)) * cos(radians(r.latitud)) * 
                cos(radians(r.longitud) - radians(lng_centro)) + 
                sin(radians(lat_centro)) * sin(radians(r.latitud))
            )
        )::INTEGER as distancia_metros,
        u.nombre as usuario_nombre
    FROM reportes r
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.activo = true
    AND (
        6371000 * acos(
            cos(radians(lat_centro)) * cos(radians(r.latitud)) * 
            cos(radians(r.longitud) - radians(lng_centro)) + 
            sin(radians(lat_centro)) * sin(radians(r.latitud))
        )
    ) <= radio_metros
    ORDER BY distancia_metros ASC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE reportes IS 'Tabla de reportes de residuos urbanos';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para usuarios';
COMMENT ON TABLE comentarios_reportes IS 'Comentarios en reportes (funcionalidad futura)';
COMMENT ON TABLE sesiones_activas IS 'Control de sesiones activas (seguridad)';
COMMENT ON TABLE logros_usuarios IS 'Sistema de gamificación y logros';
COMMENT ON TABLE estadisticas_sistema IS 'Métricas diarias del sistema';
COMMENT ON TABLE configuracion_sistema IS 'Configuraciones del sistema';

COMMENT ON FUNCTION calcular_nivel(INTEGER) IS 'Calcula el nivel basado en puntos del usuario';
COMMENT ON FUNCTION obtener_reportes_cercanos(DECIMAL, DECIMAL, INTEGER, INTEGER) IS 'Encuentra reportes cercanos usando coordenadas GPS';

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================

-- Mostrar resumen de tablas creadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('usuarios', 'reportes', 'notificaciones', 'comentarios_reportes', 'sesiones_activas', 'logros_usuarios', 'estadisticas_sistema', 'configuracion_sistema')
ORDER BY tablename;