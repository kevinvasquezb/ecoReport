import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ExternalLink, Calendar, User } from 'lucide-react';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView = ({ reportes = [], className = "w-full h-96" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [userLocation, setUserLocation] = useState(null);

  // Colores para diferentes estados
  const getMarkerColor = (estado) => {
    switch (estado) {
      case 'Limpio':
        return '#10b981'; // Verde
      case 'En proceso':
        return '#f59e0b'; // Amarillo
      case 'Rechazado':
        return '#ef4444'; // Rojo
      default:
        return '#3b82f6'; // Azul (Reportado)
    }
  };

  // Crear icono personalizado
  const createCustomIcon = (estado) => {
    const color = getMarkerColor(estado);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Coordenadas por defecto (La Paz, Bolivia)
    const defaultCenter = [-16.5000, -68.1500];
    const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

    const map = L.map(mapRef.current, {
      // CRÍTICO: Z-index más bajo que el header
      zoomControl: false,
      attributionControl: false
    }).setView(center, 13);

    // Agregar controles de zoom en posición personalizada
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Configurar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Agregar marcador de ubicación del usuario
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="
            background-color: #3b82f6;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
              }
            }
          </style>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Tu ubicación</b>')
        .openPopup();
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  // Actualizar marcadores cuando cambien los reportes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Agregar nuevos marcadores
    if (reportes && reportes.length > 0) {
      const bounds = [];

      reportes.forEach(reporte => {
        const lat = parseFloat(reporte.latitud);
        const lng = parseFloat(reporte.longitud);

        if (isNaN(lat) || isNaN(lng)) return;

        bounds.push([lat, lng]);

        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(reporte.estado)
        });

        // Crear popup personalizado
        const popupContent = `
          <div style="min-width: 280px; font-family: Inter, sans-serif;">
            <div style="margin-bottom: 12px;">
              ${reporte.imagen_thumbnail_url ? 
                `<img src="${reporte.imagen_thumbnail_url}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" 
                     alt="Imagen del reporte" />` : 
                `<div style="width: 100%; height: 120px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                   <span style="color: #9ca3af;">Sin imagen</span>
                 </div>`
              }
            </div>
            
            <div style="margin-bottom: 8px;">
              <span style="
                background-color: ${reporte.estado === 'Limpio' ? '#dcfce7' : 
                                   reporte.estado === 'En proceso' ? '#fef3c7' : 
                                   reporte.estado === 'Rechazado' ? '#fee2e2' : '#dbeafe'};
                color: ${reporte.estado === 'Limpio' ? '#166534' : 
                         reporte.estado === 'En proceso' ? '#92400e' : 
                         reporte.estado === 'Rechazado' ? '#991b1b' : '#1e40af'};
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
              ">${reporte.estado}</span>
            </div>
            
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
              ${reporte.tipo_estimado || 'Reporte de residuos'}
            </h3>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
              ${reporte.descripcion.length > 100 ? reporte.descripcion.substring(0, 100) + '...' : reporte.descripcion}
            </p>
            
            ${reporte.direccion ? 
              `<div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                 <span style="margin-right: 4px;">📍</span>
                 ${reporte.direccion.length > 50 ? reporte.direccion.substring(0, 50) + '...' : reporte.direccion}
               </div>` : ''
            }
            
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 4px;">👤</span>
                ${reporte.usuario_nombre || 'Usuario'}
              </div>
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 4px;">📅</span>
                ${new Date(reporte.created_at).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      });

      // Ajustar vista del mapa para mostrar todos los marcadores
      if (bounds.length > 0) {
        if (bounds.length === 1) {
          mapInstanceRef.current.setView(bounds[0], 15);
        } else {
          mapInstanceRef.current.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 16 
          });
        }
      }
    }
  }, [reportes]);

  return (
    <div className={`relative ${className}`}>
      {/* CRÍTICO: z-index bajo para que no tape el header */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-xl"
        style={{ zIndex: 1 }}
      />
      
      {/* Estilos CSS para popups personalizados */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 16px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .user-location-marker {
          background: transparent;
          border: none;
        }
        
        /* Asegurar que los controles del mapa no interfieran */
        .leaflet-control-container {
          position: relative;
          z-index: 2;
        }
        
        /* Popup z-index seguro */
        .leaflet-popup {
          z-index: 3 !important;
        }
        
        /* Animación para ubicación del usuario */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
      
      {/* Indicador de carga cuando no hay reportes */}
      {(!reportes || reportes.length === 0) && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl z-2">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">No hay reportes para mostrar</p>
            <p className="text-gray-500 text-sm">Los reportes aparecerán aquí cuando estén disponibles</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;