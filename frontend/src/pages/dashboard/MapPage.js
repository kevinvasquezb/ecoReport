import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { reportesAPI } from '../../utils/api';
import { 
  Filter, 
  MapPin, 
  RefreshCw, 
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Iconos personalizados por estado
const createCustomIcon = (color) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const icons = {
  'Reportado': createCustomIcon('#3B82F6'), // Azul
  'En proceso': createCustomIcon('#F59E0B'), // Amarillo
  'Limpio': createCustomIcon('#10B981'), // Verde
  'Rechazado': createCustomIcon('#EF4444') // Rojo
};

const MapPage = () => {
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [showControls, setShowControls] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Coordenadas de Santa Cruz, Bolivia por defecto
  const defaultCenter = [-17.7839, -63.1847];
  const defaultZoom = 12;

  useEffect(() => {
    loadReportes();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterReportes();
  }, [reportes, filter]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      const response = await reportesAPI.getAll();
      setReportes(response.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  const filterReportes = () => {
    if (filter === 'todos') {
      setFilteredReportes(reportes);
    } else {
      setFilteredReportes(reportes.filter(reporte => reporte.estado === filter));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReporteCounts = () => {
    return {
      todos: reportes.length,
      'Reportado': reportes.filter(r => r.estado === 'Reportado').length,
      'En proceso': reportes.filter(r => r.estado === 'En proceso').length,
      'Limpio': reportes.filter(r => r.estado === 'Limpio').length,
      'Rechazado': reportes.filter(r => r.estado === 'Rechazado').length
    };
  };

  const counts = getReporteCounts();

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Reportes</h1>
          <p className="text-gray-600">{filteredReportes.length} reportes visibles</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadReportes}
            disabled={isLoading}
            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showControls ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Controles de filtros */}
      {showControls && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          {/* Filtros */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilter('todos')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                filter === 'todos'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>Todos ({counts.todos})</span>
            </button>

            <button
              onClick={() => setFilter('Reportado')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                filter === 'Reportado'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <span>Pendientes ({counts['Reportado']})</span>
            </button>

            <button
              onClick={() => setFilter('En proceso')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                filter === 'En proceso'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              <span>En Proceso ({counts['En proceso']})</span>
            </button>

            <button
              onClick={() => setFilter('Limpio')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                filter === 'Limpio'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <span>Resueltos ({counts['Limpio']})</span>
            </button>
          </div>

          {/* Leyenda */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Reportado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">En proceso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Resuelto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Rechazado</span>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor del mapa con altura fija */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-96 relative z-10">
          <MapContainer
            center={userLocation || defaultCenter}
            zoom={defaultZoom}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marcadores de reportes */}
            {filteredReportes.map((reporte) => (
              <Marker
                key={reporte.id}
                position={[parseFloat(reporte.latitud), parseFloat(reporte.longitud)]}
                icon={icons[reporte.estado] || icons['Reportado']}
              >
                <Popup maxWidth={280} className="custom-popup">
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reporte.estado === 'Limpio' ? 'bg-green-100 text-green-800' :
                        reporte.estado === 'En proceso' ? 'bg-yellow-100 text-yellow-800' :
                        reporte.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {reporte.estado}
                      </span>
                      <span className="text-xs text-gray-500">#{reporte.id}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {reporte.descripcion}
                    </h3>

                    {reporte.imagen_thumbnail_url && (
                      <img
                        src={reporte.imagen_thumbnail_url}
                        alt="Reporte"
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}

                    {reporte.direccion && (
                      <div className="flex items-center space-x-1 text-gray-600 text-sm mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{reporte.direccion}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <p>Reportado por: {reporte.usuario_nombre}</p>
                      <p>Fecha: {formatDate(reporte.created_at)}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-gray-700">Cargando reportes...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;