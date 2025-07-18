import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  List, 
  Filter, 
  Calendar,
  MapPin, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    estado: 'all',
    search: '',
    fechaDesde: '',
    fechaHasta: '',
    tipo: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

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
      setReportes(response.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('Error cargando los reportes. Intenta nuevamente.');
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

    // Filtrar por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(reporte =>
        reporte.descripcion?.toLowerCase().includes(searchLower) ||
        reporte.direccion?.toLowerCase().includes(searchLower) ||
        reporte.tipo_estimado?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por fecha
    if (filters.fechaDesde) {
      filtered = filtered.filter(reporte => 
        new Date(reporte.created_at) >= new Date(filters.fechaDesde)
      );
    }

    if (filters.fechaHasta) {
      filtered = filtered.filter(reporte => 
        new Date(reporte.created_at) <= new Date(filters.fechaHasta)
      );
    }

    setFilteredReportes(filtered);
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Limpio':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'En proceso':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rechazado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Limpio':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En proceso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilters({
      estado: 'all',
      search: '',
      fechaDesde: '',
      fechaHasta: '',
      tipo: 'all'
    });
  };

  const getStatsForFiltered = () => {
    return {
      total: filteredReportes.length,
      reportado: filteredReportes.filter(r => r.estado === 'Reportado').length,
      proceso: filteredReportes.filter(r => r.estado === 'En proceso').length,
      limpio: filteredReportes.filter(r => r.estado === 'Limpio').length,
      rechazado: filteredReportes.filter(r => r.estado === 'Rechazado').length
    };
  };

  const stats = getStatsForFiltered();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
          ))}
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
          <p className="text-gray-600">
            {reportes.length} reporte{reportes.length !== 1 ? 's' : ''} total
            {filteredReportes.length !== reportes.length && 
              ` (${filteredReportes.length} mostrado${filteredReportes.length !== 1 ? 's' : ''})`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </button>
          <button
            onClick={loadReportes}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>
      </div>

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

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Descripción, dirección..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
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

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de residuo
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

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
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

      {/* Lista de reportes */}
      {filteredReportes.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {reportes.length === 0 ? 'No tienes reportes aún' : 'No se encontraron reportes'}
          </h3>
          <p className="text-gray-600 mb-4">
            {reportes.length === 0 
              ? 'Crea tu primer reporte para ayudar a mantener tu ciudad limpia.'
              : 'Prueba ajustando los filtros de búsqueda.'
            }
          </p>
          {reportes.length === 0 && (
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Crear mi primer reporte
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReportes.map((reporte) => (
            <div
              key={reporte.id}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* Imagen del reporte */}
                <div className="flex-shrink-0">
                  {reporte.imagen_thumbnail_url ? (
                    <img
                      src={reporte.imagen_thumbnail_url}
                      alt="Reporte"
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedReport(reporte)}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenido del reporte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getEstadoIcon(reporte.estado)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(reporte.estado)}`}>
                        {reporte.estado}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatFecha(reporte.created_at)}
                    </span>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-1">
                    {reporte.tipo_estimado || 'Reporte de residuos'}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {reporte.descripcion}
                  </p>

                  {reporte.direccion && (
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{reporte.direccion}</span>
                    </div>
                  )}

                  {/* Información adicional para autoridades */}
                  {reporte.comentario_autoridad && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Comentario autoridad:</strong> {reporte.comentario_autoridad}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón de acciones */}
                <div className="flex-shrink-0">
                  <button 
                    onClick={() => setSelectedReport(reporte)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles del reporte */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Reporte #{selectedReport.id}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Imagen grande */}
              {selectedReport.imagen_url && (
                <div className="mb-4">
                  <img
                    src={selectedReport.imagen_url}
                    alt="Imagen del reporte"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Estado y fecha */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getEstadoIcon(selectedReport.estado)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(selectedReport.estado)}`}>
                    {selectedReport.estado}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatFecha(selectedReport.created_at)}
                </span>
              </div>

              {/* Información del reporte */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Tipo de residuo</h4>
                  <p className="text-gray-600">{selectedReport.tipo_estimado || 'No especificado'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Descripción</h4>
                  <p className="text-gray-600">{selectedReport.descripcion}</p>
                </div>

                {selectedReport.direccion && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Ubicación</h4>
                    <p className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedReport.direccion}
                    </p>
                  </div>
                )}

                {selectedReport.comentario_autoridad && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Comentario de la autoridad</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800">{selectedReport.comentario_autoridad}</p>
                    </div>
                  </div>
                )}

                {selectedReport.fecha_resolucion && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Fecha de resolución</h4>
                    <p className="text-gray-600">{formatFecha(selectedReport.fecha_resolucion)}</p>
                  </div>
                )}
              </div>

              {/* Coordenadas */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Coordenadas:</strong> {selectedReport.latitud}, {selectedReport.longitud}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;