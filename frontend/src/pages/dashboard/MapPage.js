import React, { useState, useEffect } from 'react';
import { reportesAPI } from '../../utils/api';
import MapView from '../../components/maps/MapView';
import { 
  Map, 
  Filter, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';

const MapPage = () => {
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    estado: 'all',
    tipo: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReportes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportes, filters]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reportesAPI.getAll();
      
      // Filtrar reportes con coordenadas válidas
      const reportesValidos = (response.reportes || []).filter(reporte => 
        reporte.latitud && 
        reporte.longitud && 
        !isNaN(parseFloat(reporte.latitud)) && 
        !isNaN(parseFloat(reporte.longitud))
      );
      
      setReportes(reportesValidos);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('Error cargando los reportes del mapa. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reportes];

    // Filtrar por estado
    if (filters.estado !== 'all') {
      filtered = filtered.filter(reporte => reporte.estado === filters.estado);
    }

    // Filtrar por tipo
    if (filters.tipo !== 'all') {
      filtered = filtered.filter(reporte => 
        reporte.tipo_estimado && reporte.tipo_estimado.toLowerCase().includes(filters.tipo.toLowerCase())
      );
    }

    setFilteredReportes(filtered);
  };

  const getEstadoStats = () => {
    const stats = {
      total: filteredReportes.length,
      reportado: filteredReportes.filter(r => r.estado === 'Reportado').length,
      proceso: filteredReportes.filter(r => r.estado === 'En proceso').length,
      limpio: filteredReportes.filter(r => r.estado === 'Limpio').length,
      rechazado: filteredReportes.filter(r => r.estado === 'Rechazado').length
    };
    return stats;
  };

  const clearFilters = () => {
    setFilters({ estado: 'all', tipo: 'all' });
  };

  const stats = getEstadoStats();

  if (error) {
    return (
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-bold text-gray-900">Mapa de Reportes</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={loadReportes}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Reportes</h1>
          <p className="text-gray-600">
            {stats.total} reporte{stats.total !== 1 ? 's' : ''} en el mapa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </button>
          <button
            onClick={loadReportes}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </span>
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Reporte
              </label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({...filters, estado: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los estados</option>
                <option value="Reportado">Reportado</option>
                <option value="En proceso">En proceso</option>
                <option value="Limpio">Limpio</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Residuo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({...filters, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="basura">Basura doméstica</option>
                <option value="construcción">Escombros</option>
                <option value="orgánico">Residuos orgánicos</option>
                <option value="reciclable">Materiales reciclables</option>
                <option value="peligroso">Residuos peligrosos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.reportado}</span>
          </div>
          <p className="text-xs text-gray-600">Reportados</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-lg font-bold text-yellow-600">{stats.proceso}</span>
          </div>
          <p className="text-xs text-gray-600">En proceso</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">{stats.limpio}</span>
          </div>
          <p className="text-xs text-gray-600">Resueltos</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-lg font-bold text-red-600">{stats.rechazado}</span>
          </div>
          <p className="text-xs text-gray-600">Rechazados</p>
        </div>
      </div>

      {/* Mapa - Z-INDEX CORREGIDO */}
      <div className="relative">
        {isLoading ? (
          <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        ) : filteredReportes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes para mostrar</h3>
              <p className="text-gray-600">
                {reportes.length === 0 
                  ? 'Aún no hay reportes en el sistema.'
                  : 'Prueba ajustando los filtros de búsqueda.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* CRÍTICO: z-index más bajo que el header (z-50) */}
            <div className="relative z-10 h-96">
              <MapView 
                reportes={filteredReportes}
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Leyenda del mapa */}
      {filteredReportes.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Leyenda del Mapa</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Reportado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">En proceso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Resuelto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Rechazado</span>
            </div>
          </div>
        </div>
      )}

      {/* Información útil */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Cómo usar el mapa</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Haz clic en los marcadores para ver detalles del reporte</li>
              <li>• Usa los filtros para encontrar tipos específicos de problemas</li>
              <li>• Los colores indican el estado actual de cada reporte</li>
              <li>• Tu ubicación aparece marcada en azul con animación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;