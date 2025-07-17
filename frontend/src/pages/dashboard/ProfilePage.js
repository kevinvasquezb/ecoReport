import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  User, 
  Award, 
  TrendingUp, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Star,
  Target,
  Trophy
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReportes: 0,
    reportesResueltos: 0,
    reportesPendientes: 0,
    reportesRechazados: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await reportesAPI.getAll();
      const reportes = response.reportes || [];
      
      setStats({
        totalReportes: reportes.length,
        reportesResueltos: reportes.filter(r => r.estado === 'Limpio').length,
        reportesPendientes: reportes.filter(r => r.estado === 'Reportado' || r.estado === 'En proceso').length,
        reportesRechazados: reportes.filter(r => r.estado === 'Rechazado').length
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLevel = (puntos) => {
    if (puntos < 100) return 1;
    if (puntos < 250) return 2;
    if (puntos < 500) return 3;
    if (puntos < 1000) return 4;
    return 5;
  };

  const getNextLevelPoints = (level) => {
    const levels = [0, 100, 250, 500, 1000, 2000];
    return levels[level] || 2000;
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: 'EcoReporter Novato',
      2: 'EcoReporter Activo',
      3: 'EcoReporter Comprometido',
      4: 'EcoReporter Experto',
      5: 'EcoReporter Maestro'
    };
    return titles[level] || 'EcoReporter';
  };

  const currentLevel = calculateLevel(user?.puntos || 0);
  const nextLevelPoints = getNextLevelPoints(currentLevel);
  const currentPoints = user?.puntos || 0;
  const progressToNext = currentLevel < 5 ? (currentPoints / nextLevelPoints) * 100 : 100;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="bg-gray-200 rounded-2xl h-48"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 rounded-xl h-24"></div>
          <div className="bg-gray-200 rounded-xl h-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header del perfil */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.nombre}</h1>
            <p className="text-emerald-100 capitalize mb-2">{user?.role}</p>
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-lg font-semibold">{getLevelTitle(currentLevel)}</span>
            </div>
            
            {/* Barra de progreso de nivel */}
            {currentLevel < 5 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nivel {currentLevel}</span>
                  <span>Nivel {currentLevel + 1}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
                <p className="text-xs text-emerald-100">
                  {nextLevelPoints - currentPoints} puntos para el siguiente nivel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
              <p className="text-sm text-gray-600">Puntos Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReportes}</p>
              <p className="text-sm text-gray-600">Reportes Creados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-emerald-600" />
          <span>Estadísticas Detalladas</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Reportes Resueltos</span>
            </div>
            <span className="text-xl font-bold text-green-600">{stats.reportesResueltos}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Reportes Pendientes</span>
            </div>
            <span className="text-xl font-bold text-yellow-600">{stats.reportesPendientes}</span>
          </div>
          
          {stats.reportesRechazados > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Reportes Rechazados</span>
              </div>
              <span className="text-xl font-bold text-red-600">{stats.reportesRechazados}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sistema de logros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span>Logros</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Primer reporte */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.totalReportes > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalReportes > 0 ? 'bg-emerald-100' : 'bg-gray-200'}`}>
              <MapPin className={`w-5 h-5 ${stats.totalReportes > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stats.totalReportes > 0 ? 'text-emerald-800' : 'text-gray-600'}`}>
                Primer Reporte
              </p>
              <p className="text-sm text-gray-500">Crear tu primer reporte ambiental</p>
            </div>
            {stats.totalReportes > 0 && (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          {/* EcoReporter Activo */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.totalReportes >= 5 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalReportes >= 5 ? 'bg-blue-100' : 'bg-gray-200'}`}>
              <TrendingUp className={`w-5 h-5 ${stats.totalReportes >= 5 ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stats.totalReportes >= 5 ? 'text-blue-800' : 'text-gray-600'}`}>
                EcoReporter Activo
              </p>
              <p className="text-sm text-gray-500">Crear 5 reportes ({stats.totalReportes}/5)</p>
            </div>
            {stats.totalReportes >= 5 && (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {/* Problema Resuelto */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.reportesResueltos > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.reportesResueltos > 0 ? 'bg-purple-100' : 'bg-gray-200'}`}>
              <Trophy className={`w-5 h-5 ${stats.reportesResueltos > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stats.reportesResueltos > 0 ? 'text-purple-800' : 'text-gray-600'}`}>
                Problema Resuelto
              </p>
              <p className="text-sm text-gray-500">Tener un reporte marcado como resuelto</p>
            </div>
            {stats.reportesResueltos > 0 && (
              <CheckCircle className="w-5 h-5 text-purple-600" />
            )}
          </div>
        </div>
      </div>

      {/* Información de la cuenta */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span>Información de la Cuenta</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          
          {user?.telefono && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Teléfono:</span>
              <span className="font-medium text-gray-900">{user.telefono}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tipo de cuenta:</span>
            <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Miembro desde:</span>
            <span className="font-medium text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Cómo ganar más puntos */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>¿Cómo ganar más puntos?</span>
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-bold">+10</span>
            </div>
            <span className="text-gray-700">Por cada reporte creado</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">+25</span>
            </div>
            <span className="text-gray-700">Cuando tu reporte es resuelto</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">+50</span>
            </div>
            <span className="text-gray-700">Por reportes con alta prioridad</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;