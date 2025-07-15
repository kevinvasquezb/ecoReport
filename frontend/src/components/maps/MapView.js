import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ 
  reportes = [], 
  center = [-16.5000, -68.1193], // La Paz, Bolivia por defecto
  zoom = 13,
  height = '400px',
  onReporteClick = null,
  showUserLocation = true,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Colores por estado de reporte
  const getMarkerColor = (estado) => {
    const colors = {
      'Reportado': '#f59e0b', // Amarillo
      'En proceso': '#3b82f6', // Azul
      'Limpio': '#10b981',     // Verde
      'Rechazado': '#ef4444',  // Rojo
    };
    return colors[estado] || '#6b7280'; // Gris por defecto
  };

  // Crear icono personalizado para cada estado
  const createCustomIcon = (estado) => {
    const color = getMarkerColor(estado);
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">
            📍
          </div>
        </div>
      `,
      iconSize: [25, 35],
      iconAnchor: [12, 35],
      popupAnchor: [1, -34],
    });
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ Inicializando mapa Leaflet...');

    const map = L.map(mapRef.current).setView(center, zoom);

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Obtener ubicación del usuario si está habilitado
    if (showUserLocation) {
      obtenerUbicacionUsuario();
    }

    console.log('✅ Mapa inicializado correctamente');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Obtener ubicación del usuario
  const obtenerUbicacionUsuario = () => {
    if (!navigator.geolocation) {
      console.log('⚠️ Geolocalización no disponible');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLoadingLocation(false);
        
        console.log('📍 Ubicación del usuario obtenida:', { latitude, longitude });

        // Agregar marcador de usuario
        if (mapInstanceRef.current) {
          const userIcon = L.divIcon({
            className: 'user-location-icon',
            html: `
              <div style="
                background-color: #3b82f6;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
            `,
            iconSize: [15, 15],
            iconAnchor: [7, 7],
          });

          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup('Tu ubicación 📍')
            .openPopup();
        }
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación:', error);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Actualizar marcadores cuando cambian los reportes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Agregar nuevos marcadores
    reportes.forEach(reporte => {
      if (!reporte.latitud || !reporte.longitud) return;

      const icon = createCustomIcon(reporte.estado);
      
      const marker = L.marker([reporte.latitud, reporte.longitud], { icon })
        .addTo(mapInstanceRef.current);

      // Crear popup con información del reporte
      const popupContent = `
        <div style="max-width: 250px;">
          <div style="margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">
              Reporte #${reporte.id}
            </h3>
            <span style="
              background-color: ${getMarkerColor(reporte.estado)}20;
              color: ${getMarkerColor(reporte.estado)};
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">
              ${reporte.estado}
            </span>
          </div>
          
          <p style="margin: 8px 0; font-size: 13px; color: #4b5563;">
            ${reporte.descripcion.length > 100 
              ? reporte.descripcion.substring(0, 100) + '...' 
              : reporte.descripcion}
          </p>
          
          ${reporte.tipo_estimado ? `
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Tipo:</strong> ${reporte.tipo_estimado}
            </p>
          ` : ''}
          
          ${reporte.direccion ? `
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Dirección:</strong> ${reporte.direccion}
            </p>
          ` : ''}
          
          <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            <strong>Reportado:</strong> ${new Date(reporte.created_at).toLocaleDateString('es-ES')}
          </p>
          
          ${reporte.usuario_nombre ? `
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Por:</strong> ${reporte.usuario_nombre}
            </p>
          ` : ''}
          
          ${reporte.imagen_thumbnail_url ? `
            <div style="margin-top: 8px;">
              <img 
                src="${reporte.imagen_thumbnail_url}" 
                alt="Imagen del reporte"
                style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 6px;"
                loading="lazy"
              />
            </div>
          ` : ''}
          
          ${onReporteClick ? `
            <button 
              onclick="window.handleReporteClick && window.handleReporteClick(${reporte.id})"
              style="
                margin-top: 8px;
                width: 100%;
                background-color: #10b981;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
              "
            >
              Ver detalles
            </button>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);

      // Manejar click en marcador
      marker.on('click', () => {
        if (onReporteClick) {
          onReporteClick(reporte);
        }
      });
    });

    console.log(`🗺️ ${reportes.length} marcadores agregados al mapa`);

    // Ajustar vista para mostrar todos los marcadores
    if (reportes.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [reportes, onReporteClick]);

  // Función global para manejar clicks desde popup
  useEffect(() => {
    window.handleReporteClick = (reporteId) => {
      const reporte = reportes.find(r => r.id === reporteId);
      if (reporte && onReporteClick) {
        onReporteClick(reporte);
      }
    };

    return () => {
      delete window.handleReporteClick;
    };
  }, [reportes, onReporteClick]);

  return (
    <div className={`relative ${className}`}>
      {/* Mapa */}
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-xl border border-gray-200 shadow-sm"
      />
      
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {/* Botón de ubicación */}
        {showUserLocation && (
          <button
            onClick={obtenerUbicacionUsuario}
            disabled={isLoadingLocation}
            className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
            title="Mi ubicación"
          >
            {isLoadingLocation ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
            ) : (
              <span className="text-lg">📍</span>
            )}
          </button>
        )}
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Estados</h4>
        <div className="space-y-1">
          {[
            { estado: 'Reportado', color: '#f59e0b' },
            { estado: 'En proceso', color: '#3b82f6' },
            { estado: 'Limpio', color: '#10b981' },
            { estado: 'Rechazado', color: '#ef4444' },
          ].map(({ estado, color }) => (
            <div key={estado} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-gray-600">{estado}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contador de reportes */}
      {reportes.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {reportes.length} reporte{reportes.length !== 1 ? 's' : ''}
            </span>
            <span className="text-lg">🗺️</span>
          </div>
        </div>
      )}

      {/* CSS adicional para animaciones */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;