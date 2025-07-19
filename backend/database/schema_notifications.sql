-- Esquema de notificaciones para EcoReports
-- Ejecutar después de tener las tablas usuarios y reportes

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  reporte_id INTEGER REFERENCES reportes(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'reporte_creado',
    'reporte_actualizado', 
    'reporte_resuelto',
    'reporte_rechazado',
    'nuevo_nivel',
    'puntos_ganados',
    'sistema',
    'mantenimiento'
  )),
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(created_at DESC);
CREATE INDEX idx_notificaciones_prioridad ON notificaciones(prioridad);
CREATE INDEX idx_notificaciones_activa ON notificaciones(activa);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notificaciones_updated_at 
    BEFORE UPDATE ON notificaciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notificaciones_updated_at();

-- Función para crear notificación automáticamente
CREATE OR REPLACE FUNCTION crear_notificacion(
    p_usuario_id INTEGER,
    p_tipo VARCHAR(50),
    p_titulo VARCHAR(255),
    p_mensaje TEXT,
    p_reporte_id INTEGER DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_prioridad VARCHAR(20) DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
    nueva_notificacion_id INTEGER;
BEGIN
    INSERT INTO notificaciones (
        usuario_id, 
        tipo, 
        titulo, 
        mensaje, 
        reporte_id, 
        data, 
        prioridad
    ) VALUES (
        p_usuario_id,
        p_tipo,
        p_titulo,
        p_mensaje,
        p_reporte_id,
        p_data,
        p_prioridad
    ) RETURNING id INTO nueva_notificacion_id;
    
    RETURN nueva_notificacion_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION marcar_todas_leidas(p_usuario_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    notificaciones_actualizadas INTEGER;
BEGIN
    UPDATE notificaciones 
    SET leida = TRUE, updated_at = NOW()
    WHERE usuario_id = p_usuario_id AND leida = FALSE AND activa = TRUE;
    
    GET DIAGNOSTICS notificaciones_actualizadas = ROW_COUNT;
    RETURN notificaciones_actualizadas;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear notificación cuando se crea un reporte
CREATE OR REPLACE FUNCTION notificar_reporte_creado()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar al usuario que creó el reporte
    PERFORM crear_notificacion(
        NEW.usuario_id,
        'reporte_creado',
        'Reporte creado exitosamente',
        'Tu reporte ha sido registrado y será revisado por las autoridades.',
        NEW.id,
        json_build_object(
            'reporte_id', NEW.id,
            'latitud', NEW.latitud,
            'longitud', NEW.longitud
        )::jsonb,
        'normal'
    );
    
    -- Notificar a todas las autoridades activas
    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, reporte_id, prioridad)
    SELECT 
        u.id,
        'reporte_creado',
        'Nuevo reporte ambiental',
        'Se ha reportado un nuevo problema ambiental que requiere atención.',
        NEW.id,
        'alta'
    FROM usuarios u 
    WHERE u.role = 'authority' AND u.activo = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_reporte_creado
    AFTER INSERT ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION notificar_reporte_creado();

-- Trigger para crear notificación cuando se actualiza estado de reporte
CREATE OR REPLACE FUNCTION notificar_reporte_actualizado()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo notificar si cambió el estado
    IF OLD.estado != NEW.estado THEN
        -- Determinar el mensaje según el nuevo estado
        DECLARE
            mensaje_estado TEXT;
            tipo_notif VARCHAR(50);
            prioridad_notif VARCHAR(20) := 'normal';
        BEGIN
            CASE NEW.estado
                WHEN 'En proceso' THEN
                    mensaje_estado := 'Tu reporte está siendo procesado por las autoridades.';
                    tipo_notif := 'reporte_actualizado';
                WHEN 'Limpio' THEN
                    mensaje_estado := '¡Excelente! Tu reporte ha sido resuelto. Gracias por contribuir a una ciudad más limpia.';
                    tipo_notif := 'reporte_resuelto';
                    prioridad_notif := 'alta';
                WHEN 'Rechazado' THEN
                    mensaje_estado := 'Tu reporte ha sido rechazado. ' || COALESCE(NEW.comentario_autoridad, 'Revisa los detalles para más información.');
                    tipo_notif := 'reporte_rechazado';
                ELSE
                    mensaje_estado := 'El estado de tu reporte ha sido actualizado.';
                    tipo_notif := 'reporte_actualizado';
            END CASE;
            
            -- Crear la notificación
            PERFORM crear_notificacion(
                NEW.usuario_id,
                tipo_notif,
                'Actualización de tu reporte',
                mensaje_estado,
                NEW.id,
                json_build_object(
                    'estado_anterior', OLD.estado,
                    'estado_nuevo', NEW.estado,
                    'comentario_autoridad', NEW.comentario_autoridad
                )::jsonb,
                prioridad_notif
            );
            
            -- Si se resolvió, dar puntos al usuario
            IF NEW.estado = 'Limpio' AND OLD.estado != 'Limpio' THEN
                UPDATE usuarios 
                SET puntos = puntos + 10,
                    nivel = CASE 
                        WHEN puntos + 10 >= 1000 THEN 5
                        WHEN puntos + 10 >= 500 THEN 4
                        WHEN puntos + 10 >= 250 THEN 3
                        WHEN puntos + 10 >= 100 THEN 2
                        ELSE 1
                    END
                WHERE id = NEW.usuario_id;
                
                -- Notificar sobre los puntos ganados
                PERFORM crear_notificacion(
                    NEW.usuario_id,
                    'puntos_ganados',
                    '¡Has ganado 10 puntos!',
                    'Tu reporte resuelto te ha otorgado 10 puntos EcoReports.',
                    NEW.id,
                    json_build_object('puntos_ganados', 10)::jsonb,
                    'normal'
                );
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_reporte_actualizado
    AFTER UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION notificar_reporte_actualizado();

-- Insertar algunas notificaciones de ejemplo (opcional)
-- Esto se puede ejecutar para tener datos de prueba

/*
-- Ejemplo de notificaciones para usuarios existentes
INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, prioridad) VALUES
(4, 'sistema', 'Bienvenido a EcoReports', 'Gracias por unirte a nuestra comunidad de ciudadanos comprometidos con el medio ambiente.', 'normal'),
(4, 'sistema', 'Cómo usar EcoReports', 'Toma fotos de acumulación de residuos, añade la ubicación GPS y ayúdanos a crear ciudades más limpias.', 'baja');
*/

-- Comentarios de documentación
COMMENT ON TABLE notificaciones IS 'Tabla para almacenar notificaciones del sistema para usuarios';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipo de notificación: reporte_creado, reporte_actualizado, reporte_resuelto, etc.';
COMMENT ON COLUMN notificaciones.data IS 'Datos adicionales en formato JSON para la notificación';
COMMENT ON COLUMN notificaciones.prioridad IS 'Prioridad de la notificación: baja, normal, alta, urgente';