import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reportesAPI } from '../../utils/api';
import { 
  MapPin, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Navigation,
  Layers,
  Info
} from 'lucide-react';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Iconos personalizados por estado
const createCustomIcon = (color, estado) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    ">
      ${estado === 'Reportado' ? '!' : estado === 'En proceso' ? '⏳' : estado === 'Limpio' ? '✓' : '✗'}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Componente para controlar ubicación del usuario
const LocationMarker = ({ userLocation, setUserLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          map.flyTo(location, 15);
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  }, [map, setUserLocation]);

  return userLocation ? (
    <Marker 
      position={userLocation}
      icon={L.divIcon({
        html: `<div style="
          background-color: #3B82F6;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>`,
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })}
    >
      <Popup>
        <div className="text-center">
          <Navigation className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="font-medium text-blue-600">Tu ubicación</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

const MapView = ({ reportes: reportesProp, onReporteClick, height = 'h-96' }) => {
  const [reportes, setReportes] = useState(reportesProp || []);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(!reportesProp);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [error, setError] = useState(null);

  // Si no se pasan reportes como prop, cargarlos
  useEffect(() => {
    if (!reportesProp) {
      loadReportes();
    }
  }, [reportesProp]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reportesAPI.getAll();
      setReportes(response.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('Error cargando reportes del mapa');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar reportes por estado
  const reportesFiltrados = reportes.filter(reporte => 
    filtroEstado === 'todos' || reporte.estado === filtroEstado
  );

  // Colores por estado
  const getColorByEstado = (estado) => {
    switch (estado) {
      case 'Reportado': return '#EF4444'; // Rojo
      case 'En proceso': return '#F59E0B'; // Amarillo
      case 'Limpio': return '#10B981'; // Verde
      case 'Rechazado': return '#6B7280'; // Gris
      default: return '#6B7280';
    }
  };

  // Contar reportes por estado
  const conteoEstados = reportes.reduce((acc, reporte) => {
    acc[reporte.estado] = (acc[reporte.estado] || 0) + 1;
    return acc;
  }, {});

  // Estados disponibles para filtros
  const estadosDisponibles = [
    { id: 'todos', label: 'Todos', count: reportes.length, color: '#6B7280' },
    { id: 'Reportado', label: 'Reportados', count: conteoEstados['Reportado'] || 0, color: '#EF4444' },
    { id: 'En proceso', label: 'En Proceso', count: conteoEstados['En proceso'] || 0, color: '#F59E0B' },
    { id: 'Limpio', label: 'Resueltos', count: conteoEstados['Limpio'] || 0, color: '#10B981' },
    { id: 'Rechazado', label: 'Rechazados', count: conteoEstados['Rechazado'] || 0, color: '#6B7280' }
  ];

  if (isLoading) {
    return (
      <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadReportes}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Controles del mapa - CORREGIDO: z-index bajo */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border relative z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-gray-900">
            {reportesFiltrados.length} reportes en el mapa
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span className="text-sm">Leyenda</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
          </button>

          <button
            onClick={loadReportes}
            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
            title="Actualizar reportes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border relative z-10">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Filtrar por estado</span>
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {estadosDisponibles.map((estado) => (
              <button
                key={estado.id}
                onClick={() => setFiltroEstado(estado.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  filtroEstado === estado.id 
                    ? 'text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filtroEstado === estado.id ? {backgroundColor: estado.color} : {}}
              >
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: estado.color}}></span>
                <span>{estado.label}</span>
                <span className="bg-white bg-opacity-20 px-1 rounded text-xs">
                  {estado.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      {showLegend && (
        <div className="bg-white p-4 rounded-lg shadow-sm border relative z-10">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Leyenda del mapa</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                !
              </div>
              <span className="text-sm text-gray-700">Reportados</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">
                ⏳
              </div>
              <span className="text-sm text-gray-700">En proceso</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-sm text-gray-700">Resueltos</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Tu ubicación</span>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor del mapa - CORREGIDO: z-index 1 para evitar overlay */}
      <div 
        className={`${height} rounded-lg overflow-hidden relative shadow-lg border`}
        style={{ zIndex: 1 }} // FIX CRÍTICO: z-index bajo para no sobreponerse al header
      >
        <MapContainer
          center={[-17.78, -63.16]} // La Paz, Bolivia
          zoom={13}
          className="w-full h-full"
          style={{ zIndex: 1 }} // FIX CRÍTICO: z-index bajo
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Marcador de ubicación del usuario */}
          <LocationMarker 
            userLocation={userLocation} 
            setUserLocation={setUserLocation} 
          />
          
          {/* Marcadores de reportes */}
          {reportesFiltrados.map((reporte) => (
            <Marker
              key={reporte.id}
              position={[reporte.latitud, reporte.longitud]}
              icon={createCustomIcon(getColorByEstado(reporte.estado), reporte.estado)}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[250px]">
                  {/* Header del popup */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Reporte #{reporte.id}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{backgroundColor: getColorByEstado(reporte.estado)}}
                    >
                      {reporte.estado}
                    </span>
                  </div>
                  
                  {/* Imagen del reporte */}
                  {reporte.imagen_thumbnail_url && (
                    <img
                      src={reporte.imagen_thumbnail_url}
                      alt="Reporte"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  
                  {/* Descripción */}
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {reporte.descripcion}
                  </p>
                  
                  {/* Información adicional */}
                  <div className="space-y-1 text-xs text-gray-600">
                    {reporte.direccion && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{reporte.direccion}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(reporte.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {reporte.tipo_estimado && (
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs inline-block">
                        {reporte.tipo_estimado}
                      </div>
                    )}
                  </div>
                  
                  {/* Botón de acción */}
                  {onReporteClick && (
                    <button
                      onClick={() => onReporteClick(reporte)}
                      className="w-full mt-3 px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                    >
                      Ver detalles
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Información del mapa */}
      <div className="bg-gray-50 rounded-lg p-4 border relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">{conteoEstados['Reportado'] || 0}</div>
            <div className="text-sm text-gray-600">Reportados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{conteoEstados['En proceso'] || 0}</div>
            <div className="text-sm text-gray-600">En proceso</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{conteoEstados['Limpio'] || 0}</div>
            <div className="text-sm text-gray-600">Resueltos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{reportes.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* CSS adicional para el popup */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MapView;