import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  List,
  Search,
  Filter,
  Calendar,
  MapPin,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Image,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados disponibles
  const estados = [
    { value: 'todos', label: 'Todos los reportes', color: 'gray' },
    { value: 'Reportado', label: 'Reportados', color: 'red' },
    { value: 'En proceso', label: 'En Proceso', color: 'yellow' },
    { value: 'Limpio', label: 'Resueltos', color: 'green' },
    { value: 'Rechazado', label: 'Rechazados', color: 'gray' }
  ];

  // Cargar reportes al montar el componente
  useEffect(() => {
    loadReportes();
  }, []);

  // Filtrar reportes cuando cambien los filtros
  useEffect(() => {
    applyFilters();
  }, [reportes, searchTerm, selectedEstado]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await reportesAPI.getAll();
      setReportes(response.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('No se pudieron cargar los reportes');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reportes];

    // Filtrar por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(reporte => reporte.estado === selectedEstado);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reporte => 
        reporte.descripcion?.toLowerCase().includes(term) ||
        reporte.direccion?.toLowerCase().includes(term) ||
        reporte.tipo_estimado?.toLowerCase().includes(term) ||
        reporte.usuario_nombre?.toLowerCase().includes(term)
      );
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredReportes(filtered);
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    const colors = {
      'Reportado': 'bg-red-100 text-red-800 border-red-200',
      'En proceso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Limpio': 'bg-green-100 text-green-800 border-green-200',
      'Rechazado': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Función para obtener el icono del estado
  const getEstadoIcon = (estado) => {
    const icons = {
      'Reportado': <AlertCircle className="w-4 h-4" />,
      'En proceso': <Clock className="w-4 h-4" />,
      'Limpio': <CheckCircle className="w-4 h-4" />,
      'Rechazado': <XCircle className="w-4 h-4" />
    };
    return icons[estado] || <AlertCircle className="w-4 h-4" />;
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener colores por role
  const getRoleColors = (role) => {
    switch (role) {
      case 'citizen':
        return {
          primary: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          button: 'bg-emerald-500 hover:bg-emerald-600'
        };
      case 'authority':
        return {
          primary: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'admin':
        return {
          primary: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          button: 'bg-purple-500 hover:bg-purple-600'
        };
      default:
        return {
          primary: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          button: 'bg-emerald-500 hover:bg-emerald-600'
        };
    }
  };

  const roleColors = getRoleColors(user?.role);
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-xl h-16 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 pb-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar reportes</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadReportes}
          className={`${roleColors.button} text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getRoleColors(user?.role).bg} rounded-xl p-6 border ${getRoleColors(user?.role).border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <List className={`w-6 h-6 ${roleColors.primary}`} />
              <span>Mis Reportes</span>
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredReportes.length} de {reportes.length} reportes
            </p>
          </div>
          <button
            onClick={loadReportes}
            className={`${roleColors.button} text-white p-2 rounded-lg transition-colors`}
            title="Actualizar reportes"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por descripción, dirección o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Toggle filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del reporte
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {estados.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contador de resultados */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>{filteredReportes.length}</strong> reportes encontrados
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de reportes */}
      {filteredReportes.length === 0 ? (
        <div className="text-center py-12">
          <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || selectedEstado !== 'todos' ? 'No se encontraron reportes' : 'No tienes reportes aún'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedEstado !== 'todos' 
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Crea tu primer reporte para comenzar a contribuir'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReportes.map((reporte) => (
            <div
              key={reporte.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* Imagen del reporte */}
                <div className="flex-shrink-0">
                  {reporte.imagen_thumbnail_url ? (
                    <img
                      src={reporte.imagen_thumbnail_url}
                      alt="Reporte"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenido del reporte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {reporte.descripcion?.substring(0, 80)}
                      {reporte.descripcion?.length > 80 && '...'}
                    </h3>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(reporte.estado)}`}>
                      {getEstadoIcon(reporte.estado)}
                      <span>{reporte.estado}</span>
                    </span>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-1 text-sm text-gray-600">
                    {reporte.direccion && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{reporte.direccion}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{formatFecha(reporte.created_at)}</span>
                    </div>

                    {reporte.tipo_estimado && (
                      <div className="inline-block bg-gray-100 px-2 py-1 rounded-md text-xs">
                        {reporte.tipo_estimado}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-500">
                      ID: #{reporte.id}
                    </div>
                    <button
                      onClick={() => setSelectedReporte(reporte)}
                      className={`flex items-center space-x-1 ${roleColors.primary} hover:opacity-80 transition-opacity text-sm`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver detalles</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles del reporte */}
      {selectedReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header del modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Reporte #{selectedReporte.id}
                </h3>
                <button
                  onClick={() => setSelectedReporte(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="space-y-4">
                {/* Estado */}
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg font-medium ${getEstadoColor(selectedReporte.estado)}`}>
                    {getEstadoIcon(selectedReporte.estado)}
                    <span>{selectedReporte.estado}</span>
                  </span>
                </div>

                {/* Imagen */}
                {selectedReporte.imagen_url && (
                  <div>
                    <img
                      src={selectedReporte.imagen_url}
                      alt="Reporte completo"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Descripción */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReporte.descripcion}</p>
                </div>

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Fecha:</span>
                        <span className="ml-2">{formatFecha(selectedReporte.created_at)}</span>
                      </div>
                      {selectedReporte.tipo_estimado && (
                        <div>
                          <span className="text-gray-600">Tipo:</span>
                          <span className="ml-2">{selectedReporte.tipo_estimado}</span>
                        </div>
                      )}
                      {selectedReporte.direccion && (
                        <div>
                          <span className="text-gray-600">Dirección:</span>
                          <span className="ml-2">{selectedReporte.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Ubicación</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Latitud:</span>
                        <span className="ml-2">{selectedReporte.latitud}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Longitud:</span>
                        <span className="ml-2">{selectedReporte.longitud}</span>
                      </div>
                      <button
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedReporte.latitud},${selectedReporte.longitud}`, '_blank')}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver en Google Maps</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedReporte(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;