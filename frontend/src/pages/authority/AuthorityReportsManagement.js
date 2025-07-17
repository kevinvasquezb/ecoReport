import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/common/BackButton';
import api from '../../utils/api';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  XCircle,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  Eye,
  UserCheck,
  Edit,
  MessageSquare
} from 'lucide-react';

const AuthorityReportsManagement = ({ onBack }) => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [urgenciaFilter, setUrgenciaFilter] = useState('todas');
  const [asignadosFilter, setAsignadosFilter] = useState('false');
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [editingReporte, setEditingReporte] = useState(null);
  const [comentario, setComentario] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadReportes();
  }, []);

  useEffect(() => {
    filterReportes();
  }, [reportes, searchTerm, estadoFilter, urgenciaFilter, asignadosFilter]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/authority/reports', {
        params: {
          asignados_a_mi: asignadosFilter,
          estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
          urgencia: urgenciaFilter !== 'todas' ? urgenciaFilter : undefined,
          search: searchTerm
        }
      });
      setReportes(response.data.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReportes = () => {
    let filtered = [...reportes];

    // Filtro por estado
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(reporte => reporte.estado === estadoFilter);
    }

    // Filtro por urgencia
    if (urgenciaFilter !== 'todas') {
      filtered = filtered.filter(reporte => reporte.ai_urgencia === urgenciaFilter);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(reporte =>
        reporte.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reporte.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reporte.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReportes(filtered);
  };

  const handleUpdateReporte = async (reporteId, nuevoEstado, asignarAMi = false, comentarioTexto = '') => {
    try {
      setIsUpdating(true);
      await api.put(`/api/authority/reports/${reporteId}`, {
        estado: nuevoEstado,
        asignar_a_mi: asignarAMi,
        comentario_autoridad: comentarioTexto
      });

      await loadReportes();
    } catch (error) {
      console.error('Error actualizando reporte:', error);
      alert('Error actualizando reporte: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewReporte = (reporte) => {
    setSelectedReporte(reporte);
    setShowDetailModal(true);
  };

  const handleOpenCommentModal = (reporte, estado) => {
    setEditingReporte({ ...reporte, nuevoEstado: estado });
    setComentario(reporte.comentario_autoridad || '');
    setShowCommentModal(true);
  };

  const handleSaveWithComment = async () => {
    try {
      await handleUpdateReporte(
        editingReporte.id, 
        editingReporte.nuevoEstado, 
        true, 
        comentario
      );
      setShowCommentModal(false);
      setEditingReporte(null);
      setComentario('');
    } catch (error) {
      console.error('Error guardando con comentario:', error);
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Limpio':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'En proceso':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rechazado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CheckSquare className="w-5 h-5 text-blue-600" />;
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

  const getUrgencyColor = (urgencia) => {
    switch (urgencia) {
      case 'Alta':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Media':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Baja':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCounts = () => {
    return {
      todos: reportes.length,
      Reportado: reportes.filter(r => r.estado === 'Reportado').length,
      'En proceso': reportes.filter(r => r.estado === 'En proceso').length,
      Limpio: reportes.filter(r => r.estado === 'Limpio').length,
      urgentes: reportes.filter(r => r.ai_urgencia === 'Alta' && r.estado !== 'Limpio').length,
      mis_asignados: reportes.filter(r => r.autoridad_nombre === user?.nombre).length
    };
  };

  const counts = getCounts();

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <BackButton onBack={onBack} />
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-xl h-12"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <BackButton onBack={onBack} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <span>Gestión de Reportes</span>
          </h1>
          <p className="text-gray-600">
            {filteredReportes.length} de {reportes.length} reportes
          </p>
        </div>
        <button
          onClick={loadReportes}
          disabled={isLoading}
          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar en descripción, dirección o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        {/* Filtros rápidos */}
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setAsignadosFilter('false')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              asignadosFilter === 'false'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos los reportes
          </button>
          <button
            onClick={() => setAsignadosFilter('true')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              asignadosFilter === 'true'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mis asignados ({counts.mis_asignados})</span>
          </button>
        </div>

        {/* Filtros por estado */}
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setEstadoFilter('todos')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              estadoFilter === 'todos'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({counts.todos})
          </button>
          <button
            onClick={() => setEstadoFilter('Reportado')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              estadoFilter === 'Reportado'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes ({counts.Reportado})
          </button>
          <button
            onClick={() => setEstadoFilter('En proceso')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              estadoFilter === 'En proceso'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Proceso ({counts['En proceso']})
          </button>
          <button
            onClick={() => setEstadoFilter('Limpio')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              estadoFilter === 'Limpio'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resueltos ({counts.Limpio})
          </button>
        </div>

        {/* Filtros por urgencia */}
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setUrgenciaFilter('todas')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              urgenciaFilter === 'todas'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas las urgencias
          </button>
          <button
            onClick={() => setUrgenciaFilter('Alta')}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              urgenciaFilter === 'Alta'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>🔴 Urgentes ({counts.urgentes})</span>
          </button>
          <button
            onClick={() => setUrgenciaFilter('Media')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              urgenciaFilter === 'Media'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟡 Media
          </button>
          <button
            onClick={() => setUrgenciaFilter('Baja')}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              urgenciaFilter === 'Baja'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟢 Baja
          </button>
        </div>
      </div>

      {/* Lista de reportes */}
      {filteredReportes.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes</h3>
          <p className="text-gray-600">
            {reportes.length === 0 
              ? 'No hay reportes para gestionar'
              : 'No hay reportes que coincidan con los filtros aplicados'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReportes.map((reporte) => (
            <div key={reporte.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header del reporte */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(reporte.estado)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                    <span className="text-xs text-gray-500">#{reporte.id}</span>
                    {reporte.ai_urgencia && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(reporte.ai_urgencia)}`}>
                        {reporte.ai_urgencia} urgencia
                      </span>
                    )}
                    {reporte.autoridad_nombre === user?.nombre && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Asignado a mí
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {reporte.descripcion}
                  </h3>

                  {/* Información adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{reporte.usuario_nombre}</span>
                    </div>
                    {reporte.direccion && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{reporte.direccion}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(reporte.created_at)}</span>
                    </div>
                    {reporte.tipo_estimado && (
                      <div className="flex items-center space-x-2">
                        <span>Tipo:</span>
                        <span className="font-medium">{reporte.tipo_estimado}</span>
                      </div>
                    )}
                  </div>

                  {/* Comentario de autoridad */}
                  {reporte.comentario_autoridad && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Comentario:</strong> {reporte.comentario_autoridad}
                      </p>
                    </div>
                  )}

                  {/* Acciones rápidas */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'En proceso', true)}
                      disabled={isUpdating || reporte.estado === 'En proceso'}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Tomar y Procesar</span>
                    </button>
                    <button
                      onClick={() => handleOpenCommentModal(reporte, 'Limpio')}
                      disabled={isUpdating || reporte.estado === 'Limpio'}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Marcar Resuelto</span>
                    </button>
                    <button
                      onClick={() => handleOpenCommentModal(reporte, 'Rechazado')}
                      disabled={isUpdating || reporte.estado === 'Rechazado'}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      onClick={() => handleViewReporte(reporte)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Detalles</span>
                    </button>
                  </div>
                </div>

                {/* Imagen si existe */}
                {reporte.imagen_thumbnail_url && (
                  <div className="ml-4">
                    <img
                      src={reporte.imagen_thumbnail_url}
                      alt="Reporte"
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewReporte(reporte)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {showDetailModal && selectedReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Reporte #{selectedReporte.id}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Estado y urgencia */}
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedReporte.estado)}`}>
                    {selectedReporte.estado}
                  </span>
                  {selectedReporte.ai_urgencia && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(selectedReporte.ai_urgencia)}`}>
                      Urgencia {selectedReporte.ai_urgencia}
                    </span>
                  )}
                </div>

                {/* Imagen */}
                {selectedReporte.imagen_url && (
                  <div>
                    <img
                      src={selectedReporte.imagen_url}
                      alt="Reporte"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Descripción */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descripción:</h4>
                  <p className="text-gray-700">{selectedReporte.descripcion}</p>
                </div>

                {/* Información del usuario */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reportado por:</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p><strong>Nombre:</strong> {selectedReporte.usuario_nombre}</p>
                    <p><strong>Email:</strong> {selectedReporte.usuario_email}</p>
                    {selectedReporte.usuario_telefono && (
                      <p><strong>Teléfono:</strong> {selectedReporte.usuario_telefono}</p>
                    )}
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ubicación:</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p><strong>Coordenadas:</strong> {selectedReporte.latitud}, {selectedReporte.longitud}</p>
                    {selectedReporte.direccion && (
                      <p><strong>Dirección:</strong> {selectedReporte.direccion}</p>
                    )}
                  </div>
                </div>

                {/* Información de autoridad asignada */}
                {selectedReporte.autoridad_nombre && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Autoridad Asignada:</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p><strong>Nombre:</strong> {selectedReporte.autoridad_nombre}</p>
                    </div>
                  </div>
                )}

                {/* Análisis de IA si existe */}
                {selectedReporte.ai_resumen && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Análisis de IA:</h4>
                    <div className="bg-purple-50 rounded-lg p-3">
                      {selectedReporte.ai_tipo_residuo && (
                        <p><strong>Tipo de residuo:</strong> {selectedReporte.ai_tipo_residuo}</p>
                      )}
                      <p><strong>Resumen:</strong> {selectedReporte.ai_resumen}</p>
                    </div>
                  </div>
                )}

                {/* Fechas */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fechas:</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p><strong>Creado:</strong> {formatDate(selectedReporte.created_at)}</p>
                    <p><strong>Actualizado:</strong> {formatDate(selectedReporte.updated_at)}</p>
                    {selectedReporte.fecha_resolucion && (
                      <p><strong>Resuelto:</strong> {formatDate(selectedReporte.fecha_resolucion)}</p>
                    )}
                  </div>
                </div>

                {/* Acciones desde el modal */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Acciones:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        handleUpdateReporte(selectedReporte.id, 'En proceso', true);
                        setShowDetailModal(false);
                      }}
                      disabled={isUpdating || selectedReporte.estado === 'En proceso'}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tomar y Procesar
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenCommentModal(selectedReporte, 'Limpio');
                      }}
                      disabled={isUpdating || selectedReporte.estado === 'Limpio'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Marcar como Resuelto
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenCommentModal(selectedReporte, 'Rechazado');
                      }}
                      disabled={isUpdating || selectedReporte.estado === 'Rechazado'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rechazar Reporte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de comentario */}
      {showCommentModal && editingReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingReporte.nuevoEstado === 'Limpio' ? 'Marcar como Resuelto' : 
               editingReporte.nuevoEstado === 'Rechazado' ? 'Rechazar Reporte' : 'Actualizar Estado'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Reporte: <strong>#{editingReporte.id}</strong>
                </p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{editingReporte.descripcion}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario {editingReporte.nuevoEstado === 'Rechazado' ? '(requerido)' : '(opcional)'}
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={
                    editingReporte.nuevoEstado === 'Limpio' 
                      ? "Describe las acciones tomadas para resolver el problema..."
                      : editingReporte.nuevoEstado === 'Rechazado'
                      ? "Explica por qué se rechaza este reporte..."
                      : "Agrega un comentario sobre este reporte..."
                  }
                />
              </div>

              {editingReporte.nuevoEstado === 'Rechazado' && comentario.trim().length < 10 && (
                <p className="text-xs text-red-600">
                  Se requiere un comentario de al menos 10 caracteres para rechazar un reporte
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setEditingReporte(null);
                  setComentario('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveWithComment}
                disabled={
                  isUpdating || 
                  (editingReporte.nuevoEstado === 'Rechazado' && comentario.trim().length < 10)
                }
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  editingReporte.nuevoEstado === 'Limpio' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : editingReporte.nuevoEstado === 'Rechazado'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  <>
                    {editingReporte.nuevoEstado === 'Limpio' ? 'Marcar como Resuelto' : 
                     editingReporte.nuevoEstado === 'Rechazado' ? 'Rechazar Reporte' : 'Actualizar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityReportsManagement;