import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  Building, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  TrendingUp,
  Filter,
  Eye,
  CheckSquare,
  XCircle,
  RefreshCw
} from 'lucide-react';

const AuthorityDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [stats, setStats] = useState({
    totalReportes: 0,
    reportesPendientes: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
    reportesHoy: 0,
    reportesUrgentes: 0
  });
  const [filter, setFilter] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      const response = await reportesAPI.getAll();
      const reportesData = response.reportes || [];
      
      setReportes(reportesData);
      calculateStats(reportesData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reportesData) => {
    const today = new Date().toDateString();
    
    setStats({
      totalReportes: reportesData.length,
      reportesPendientes: reportesData.filter(r => r.estado === 'Reportado').length,
      reportesEnProceso: reportesData.filter(r => r.estado === 'En proceso').length,
      reportesResueltos: reportesData.filter(r => r.estado === 'Limpio').length,
      reportesHoy: reportesData.filter(r => 
        new Date(r.created_at).toDateString() === today
      ).length,
      reportesUrgentes: reportesData.filter(r => 
        r.estado === 'Reportado' && r.ai_urgencia === 'Alta'
      ).length
    });
  };

  const handleUpdateReporte = async (reporteId, nuevoEstado) => {
    try {
      // Aquí implementarías la actualización del reporte
      console.log(`Autoridad actualizando reporte ${reporteId} a: ${nuevoEstado}`);
      
      // Simular actualización local
      setReportes(prev => prev.map(r => 
        r.id === reporteId ? { ...r, estado: nuevoEstado } : r
      ));
      
      // Recalcular estadísticas
      const updatedReportes = reportes.map(r => 
        r.id === reporteId ? { ...r, estado: nuevoEstado } : r
      );
      calculateStats(updatedReportes);
      
    } catch (error) {
      console.error('Error actualizando reporte:', error);
    }
  };

  const getFilteredReportes = () => {
    if (filter === 'todos') return reportes;
    return reportes.filter(r => r.estado === filter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        return 'text-red-600';
      case 'Media':
        return 'text-yellow-600';
      case 'Baja':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredReportes = getFilteredReportes();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="bg-gray-200 rounded-2xl h-48"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 rounded-xl h-32"></div>
          <div className="bg-gray-200 rounded-xl h-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Autoridades */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-6 h-6 text-blue-200" />
              <h2 className="text-2xl font-bold">Panel de Autoridades</h2>
            </div>
            <p className="text-blue-100">
              Bienvenido, {user?.nombre}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 justify-end">
              <CheckSquare className="w-5 h-5 text-blue-200" />
              <span className="text-lg font-bold">AUTORIDAD</span>
            </div>
            <p className="text-blue-100 text-sm">Gestión de reportes urbanos</p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReportes}</p>
              <p className="text-sm text-gray-600">Reportes Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.reportesPendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.reportesResueltos}</p>
              <p className="text-sm text-gray-600">Resueltos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.reportesUrgentes}</p>
              <p className="text-sm text-gray-600">Urgentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de hoy */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Actividad de Hoy</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Reportes Nuevos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.reportesHoy}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800">En Proceso</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-2">{stats.reportesEnProceso}</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        
        <div className="grid gap-3">
          <button
            onClick={() => onNavigate('map')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Ver Mapa de Reportes</p>
                <p className="text-blue-100 text-sm">Ubicación geográfica de todos los reportes</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('authority-manage')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Gestionar Reportes</p>
                <p className="text-emerald-100 text-sm">Actualizar estados y asignar equipos</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Lista de reportes recientes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reportes Recientes</h3>
          <button
            onClick={loadReportes}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'todos' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({reportes.length})
          </button>
          <button
            onClick={() => setFilter('Reportado')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'Reportado' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes ({stats.reportesPendientes})
          </button>
          <button
            onClick={() => setFilter('En proceso')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'En proceso' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Proceso ({stats.reportesEnProceso})
          </button>
        </div>

        {/* Lista de reportes */}
        {filteredReportes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay reportes para mostrar</p>
        ) : (
          <div className="space-y-3">
            {filteredReportes.slice(0, 10).map((reporte) => (
              <div key={reporte.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                    <span className="text-xs text-gray-500">#{reporte.id}</span>
                    {reporte.ai_urgencia && (
                      <span className={`text-xs font-medium ${getUrgencyColor(reporte.ai_urgencia)}`}>
                        {reporte.ai_urgencia} urgencia
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'En proceso')}
                      className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                      title="Marcar en proceso"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'Limpio')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Marcar como resuelto"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'Rechazado')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Rechazar reporte"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                  {reporte.descripcion}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{reporte.usuario_nombre}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{reporte.latitud?.toFixed(4)}, {reporte.longitud?.toFixed(4)}</span>
                    </div>
                  </div>
                  <span>{formatDate(reporte.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;