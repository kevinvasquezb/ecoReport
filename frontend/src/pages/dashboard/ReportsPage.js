import React, { useState, useEffect } from 'react';
import { reportesAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Filter, 
  MapPin, 
  Calendar, 
  Image, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReportes();
  }, []);

  useEffect(() => {
    filterReportes();
  }, [reportes, filter, searchTerm]);

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

  const filterReportes = () => {
    let filtered = [...reportes];

    // Filtro por estado
    if (filter !== 'todos') {
      filtered = filtered.filter(reporte => {
        switch (filter) {
          case 'pendientes':
            return reporte.estado === 'Reportado';
          case 'proceso':
            return reporte.estado === 'En proceso';
          case 'resueltos':
            return reporte.estado === 'Limpio';
          case 'rechazados':
            return reporte.estado === 'Rechazado';
          default:
            return true;
        }
      });
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(reporte =>
        reporte.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reporte.direccion && reporte.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredReportes(filtered);
  };

  // ✅ FUNCIÓN CORREGIDA para formatear coordenadas
  const formatCoordinate = (coord) => {
    if (!coord) return 'N/A';
    const num = parseFloat(coord);
    return isNaN(num) ? coord : num.toFixed(4);
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Limpio':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'En proceso':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rechazado':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (estado) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <div className="bg-gray-200 rounded-xl h-12 animate-pulse"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
        ))}
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
            {filteredReportes.length} de {reportes.length} reportes
          </p>
        </div>
        <button
          onClick={loadReportes}
          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar en descripción o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('todos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            filter === 'todos'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Todos ({reportes.length})</span>
        </button>

        <button
          onClick={() => setFilter('pendientes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            filter === 'pendientes'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pendientes ({reportes.filter(r => r.estado === 'Reportado').length})</span>
        </button>

        <button
          onClick={() => setFilter('proceso')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            filter === 'proceso'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>En Proceso ({reportes.filter(r => r.estado === 'En proceso').length})</span>
        </button>

        <button
          onClick={() => setFilter('resueltos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            filter === 'resueltos'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Resueltos ({reportes.filter(r => r.estado === 'Limpio').length})</span>
        </button>
      </div>

      {/* Lista de reportes */}
      {filteredReportes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {reportes.length === 0 ? 'Sin reportes aún' : 'No hay reportes que coincidan'}
          </h3>
          <p className="text-gray-600 mb-6">
            {reportes.length === 0 
              ? 'Crea tu primer reporte para ayudar a mantener la ciudad limpia'
              : 'Intenta cambiar los filtros o el término de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReportes.map((reporte) => (
            <div key={reporte.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                {/* Header del reporte */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(reporte.estado)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">#{reporte.id}</span>
                </div>

                {/* Descripción */}
                <p className="text-gray-900 font-medium mb-3 line-clamp-2">
                  {reporte.descripcion}
                </p>

                {/* Imagen si existe */}
                {reporte.imagen_thumbnail_url && (
                  <div className="mb-3">
                    <img
                      src={reporte.imagen_thumbnail_url}
                      alt="Reporte"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Información adicional */}
                <div className="space-y-2">
                  {reporte.direccion && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{reporte.direccion}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(reporte.created_at)}</span>
                  </div>

                  {reporte.imagen_url && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Image className="w-4 h-4" />
                      <span className="text-sm">Con imagen adjunta</span>
                    </div>
                  )}
                </div>

                {/* Coordenadas - ✅ CORREGIDO */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Ubicación: {formatCoordinate(reporte.latitud)}, {formatCoordinate(reporte.longitud)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;