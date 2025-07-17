import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  Shield, 
  Users, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Award,
  BarChart3,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Ban
} from 'lucide-react';

const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalReportes: 0,
    reportesPendientes: 0,
    reportesResueltos: 0,
    reportesHoy: 0,
    usuariosActivos: 0
  });
  const [recentReportes, setRecentReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
    loadRecentReportes();
  }, []);

  const loadAdminStats = async () => {
    try {
      // Simulamos las estadísticas admin - en producción estos serían endpoints específicos
      const reportesResponse = await reportesAPI.getAll();
      const reportes = reportesResponse.reportes || [];
      
      const today = new Date().toDateString();
      const reportesHoy = reportes.filter(r => 
        new Date(r.created_at).toDateString() === today
      ).length;

      setStats({
        totalUsuarios: 3, // Simulado
        totalReportes: reportes.length,
        reportesPendientes: reportes.filter(r => r.estado === 'Reportado').length,
        reportesResueltos: reportes.filter(r => r.estado === 'Limpio').length,
        reportesHoy: reportesHoy,
        usuariosActivos: 2 // Simulado
      });

    } catch (error) {
      console.error('Error cargando estadísticas admin:', error);
    }
  };

  const loadRecentReportes = async () => {
    try {
      const response = await reportesAPI.getAll();
      setRecentReportes((response.reportes || []).slice(0, 5));
    } catch (error) {
      console.error('Error cargando reportes recientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReporte = async (reporteId, nuevoEstado) => {
    try {
      // Aquí implementarías la actualización del reporte
      console.log(`Actualizando reporte ${reporteId} a estado: ${nuevoEstado}`);
      // Recargar datos
      await loadRecentReportes();
      await loadAdminStats();
    } catch (error) {
      console.error('Error actualizando reporte:', error);
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
      {/* Header Admin */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-6 h-6 text-purple-200" />
              <h2 className="text-2xl font-bold">Panel de Administración</h2>
            </div>
            <p className="text-purple-100">
              Bienvenido, {user?.nombre}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 justify-end">
              <Settings className="w-5 h-5 text-purple-200" />
              <span className="text-lg font-bold">ADMIN</span>
            </div>
            <p className="text-purple-100 text-sm">Control total del sistema</p>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
              <p className="text-sm text-gray-600">Usuarios Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReportes}</p>
              <p className="text-sm text-gray-600">Reportes Totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.reportesPendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>
        
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
      </div>

      {/* Métricas de hoy */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span>Actividad de Hoy</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">Reportes Hoy</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-2">{stats.reportesHoy}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Usuarios Activos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.usuariosActivos}</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas de administrador */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Acciones de Administrador</h3>
        
        <div className="grid gap-3">
          <button
            onClick={() => onNavigate('admin-users')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Gestionar Usuarios</p>
                <p className="text-blue-100 text-sm">Ver, editar y administrar usuarios</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('admin-reports')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Gestionar Reportes</p>
                <p className="text-emerald-100 text-sm">Revisar y actualizar estados</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('admin-points')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Sistema de Puntos</p>
                <p className="text-purple-100 text-sm">Configurar puntos y logros</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('admin-analytics')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Análisis y Reportes</p>
                <p className="text-orange-100 text-sm">Estadísticas y métricas avanzadas</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Reportes recientes para revisión */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span>Reportes Recientes</span>
          </h3>
          <button
            onClick={() => onNavigate('admin-reports')}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Ver todos
          </button>
        </div>
        
        {recentReportes.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No hay reportes recientes</p>
        ) : (
          <div className="space-y-3">
            {recentReportes.map((reporte) => (
              <div key={reporte.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                    <span className="text-xs text-gray-500">#{reporte.id}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'En proceso')}
                      className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Marcar en proceso"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'Limpio')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Marcar como resuelto"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateReporte(reporte.id, 'Rechazado')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Rechazar reporte"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                  {reporte.descripcion}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Por: {reporte.usuario_nombre}</span>
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

      {/* Información del sistema */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span>Información del Sistema</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Versión:</span>
            <span className="font-medium">EcoReports v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ambiente:</span>
            <span className="font-medium">Desarrollo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Base de datos:</span>
            <span className="font-medium">PostgreSQL 16</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Última actualización:</span>
            <span className="font-medium">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;