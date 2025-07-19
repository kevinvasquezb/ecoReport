import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import api from '../../utils/api';
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
  Trophy,
  Edit,
  Mail,
  Phone,
  Shield
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
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Intentar usar el nuevo endpoint de stats primero
      try {
        const response = await api.get(`/api/stats/user/${user.id}`);
        const apiStats = response.data.stats;
        
        setStats({
          totalReportes: apiStats.total_reportes || 0,
          reportesResueltos: apiStats.reportes_resueltos || 0,
          reportesPendientes: apiStats.reportes_pendientes || 0,
          reportesRechazados: apiStats.reportes_rechazados || 0
        });
      } catch (apiError) {
        console.log('Usando método de estadísticas original');
        const response = await reportesAPI.getAll();
        const reportes = response.reportes || [];
        
        setStats({
          totalReportes: reportes.length,
          reportesResueltos: reportes.filter(r => r.estado === 'Limpio').length,
          reportesPendientes: reportes.filter(r => r.estado === 'Reportado' || r.estado === 'En proceso').length,
          reportesRechazados: reportes.filter(r => r.estado === 'Rechazado').length
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  // COLORES POR ROLE - FUNCIÓN PRINCIPAL
  const getThemeByRole = (role) => {
    console.log('🎨 Aplicando tema para role:', role); // DEBUG
    
    switch (role) {
      case 'citizen':
        return {
          // CIUDADANO: VERDE/EMERALD
          headerGradient: 'from-emerald-500 to-emerald-600',
          primaryColor: 'emerald',
          bgLight: 'bg-emerald-50',
          bgMedium: 'bg-emerald-100', 
          bgDark: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          textDark: 'text-emerald-800',
          border: 'border-emerald-200',
          buttonHover: 'hover:bg-emerald-600'
        };
      case 'authority':
        return {
          // AUTORIDAD: AZUL/BLUE  
          headerGradient: 'from-blue-500 to-blue-600',
          primaryColor: 'blue',
          bgLight: 'bg-blue-50',
          bgMedium: 'bg-blue-100',
          bgDark: 'bg-blue-500', 
          textColor: 'text-blue-600',
          textDark: 'text-blue-800',
          border: 'border-blue-200',
          buttonHover: 'hover:bg-blue-600'
        };
      case 'admin':
        return {
          // ADMIN: MORADO/PURPLE
          headerGradient: 'from-purple-500 to-purple-600',
          primaryColor: 'purple',
          bgLight: 'bg-purple-50',
          bgMedium: 'bg-purple-100',
          bgDark: 'bg-purple-500',
          textColor: 'text-purple-600', 
          textDark: 'text-purple-800',
          border: 'border-purple-200',
          buttonHover: 'hover:bg-purple-600'
        };
      default:
        // DEFAULT: VERDE (CIUDADANO)
        return {
          headerGradient: 'from-emerald-500 to-emerald-600',
          primaryColor: 'emerald',
          bgLight: 'bg-emerald-50',
          bgMedium: 'bg-emerald-100',
          bgDark: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          textDark: 'text-emerald-800', 
          border: 'border-emerald-200',
          buttonHover: 'hover:bg-emerald-600'
        };
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

  const getLevelColor = (level) => {
    const colors = {
      1: 'from-gray-400 to-gray-500',
      2: 'from-green-400 to-green-500',
      3: 'from-blue-400 to-blue-500',
      4: 'from-purple-400 to-purple-500',
      5: 'from-yellow-400 to-yellow-500'
    };
    return colors[level] || 'from-gray-400 to-gray-500';
  };

  const currentLevel = calculateLevel(user?.puntos || 0);
  const nextLevelPoints = getNextLevelPoints(currentLevel);
  const currentPoints = user?.puntos || 0;
  const progressToNext = currentLevel < 5 ? (currentPoints / nextLevelPoints) * 100 : 100;
  
  // APLICAR TEMA SEGÚN ROLE
  const theme = getThemeByRole(user?.role);

  const tabs = [
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
    { id: 'achievements', label: 'Logros', icon: Trophy },
    { id: 'account', label: 'Cuenta', icon: Settings }
  ];
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-20">
        <div className="bg-gray-200 rounded-2xl h-48"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 rounded-xl h-24"></div>
          <div className="bg-gray-200 rounded-xl h-24"></div>
        </div>
        <div className="bg-gray-200 rounded-xl h-64"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 pb-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar perfil</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadUserStats}
          className={`${theme.bgDark} text-white px-4 py-2 rounded-lg ${theme.buttonHover} transition-colors`}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${theme.bgMedium} rounded-lg flex items-center justify-center`}>
              <Award className={`w-6 h-6 ${theme.textColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
              <p className="text-sm text-gray-600">Puntos Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${theme.bgMedium} rounded-lg flex items-center justify-center`}>
              <TrendingUp className={`w-6 h-6 ${theme.textColor}`} />
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
          <Target className={`w-5 h-5 ${theme.textColor}`} />
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

      {/* Progreso y nivel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso de Nivel</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${getLevelColor(currentLevel)} rounded-lg flex items-center justify-center`}>
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{getLevelTitle(currentLevel)}</p>
                <p className="text-sm text-gray-600">Nivel {currentLevel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{currentPoints}</p>
              <p className="text-sm text-gray-600">puntos</p>
            </div>
          </div>

          {/* Barra de progreso */}
          {currentLevel < 5 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Nivel {currentLevel}</span>
                <span>Nivel {currentLevel + 1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`bg-gradient-to-r ${getLevelColor(currentLevel + 1)} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${progressToNext}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {nextLevelPoints - currentPoints} puntos para el siguiente nivel
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* Sistema de logros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span>Logros Desbloqueados</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Primer reporte */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.totalReportes > 0 ? `${theme.bgLight} ${theme.border}` : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalReportes > 0 ? theme.bgMedium : 'bg-gray-200'}`}>
              <MapPin className={`w-5 h-5 ${stats.totalReportes > 0 ? theme.textColor : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stats.totalReportes > 0 ? theme.textDark : 'text-gray-600'}`}>
                Primer Reporte
              </p>
              <p className="text-sm text-gray-500">Crear tu primer reporte ambiental</p>
            </div>
            {stats.totalReportes > 0 && (
              <CheckCircle className={`w-5 h-5 ${theme.textColor}`} />
            )}
          </div>

          {/* EcoReporter Activo */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.totalReportes >= 5 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
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
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.reportesResueltos > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
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

          {/* EcoReporter Comprometido */}
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${stats.totalReportes >= 10 ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalReportes >= 10 ? 'bg-indigo-100' : 'bg-gray-200'}`}>
              <Award className={`w-5 h-5 ${stats.totalReportes >= 10 ? 'text-indigo-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stats.totalReportes >= 10 ? 'text-indigo-800' : 'text-gray-600'}`}>
                EcoReporter Comprometido
              </p>
              <p className="text-sm text-gray-500">Crear 10 reportes ({stats.totalReportes}/10)</p>
            </div>
            {stats.totalReportes >= 10 && (
              <CheckCircle className="w-5 h-5 text-indigo-600" />
            )}
          </div>
        </div>
      </div>

      {/* Próximos logros con colores del tema */}
      <div className={`${theme.bgLight} rounded-xl p-6 border ${theme.border}`}>
        <h4 className="font-semibold text-gray-900 mb-3">🎯 Próximos Logros</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {stats.totalReportes < 5 && (
            <p>• Crear {5 - stats.totalReportes} reportes más para ser "EcoReporter Activo"</p>
          )}
          {stats.reportesResueltos === 0 && (
            <p>• Esperar a que resuelvan uno de tus reportes</p>
          )}
          {stats.totalReportes < 10 && stats.totalReportes >= 5 && (
            <p>• Crear {10 - stats.totalReportes} reportes más para ser "EcoReporter Comprometido"</p>
          )}
          {currentPoints < 500 && (
            <p>• Alcanzar 500 puntos para desbloquear el nivel "EcoReporter Comprometido"</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Información de la cuenta */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <span>Información Personal</span>
          </h3>
          <button className={`flex items-center space-x-1 ${theme.textColor} hover:opacity-80 transition-opacity`}>
            <Edit className="w-4 h-4" />
            <span className="text-sm">Editar</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Nombre completo</p>
              <p className="font-medium text-gray-900">{user?.nombre}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Correo electrónico</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
          
          {user?.telefono && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{user.telefono}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Tipo de cuenta</p>
              <p className={`font-medium capitalize ${theme.textColor}`}>{user?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Miembro desde</p>
              <p className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuraciones */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span>Configuraciones</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Notificaciones por email</span>
            <div className={`w-10 h-6 ${theme.bgDark} rounded-full relative`}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Ubicación automática</span>
            <div className={`w-10 h-6 ${theme.bgDark} rounded-full relative`}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Reportes públicos</span>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-6 pb-20">
      {/* DEBUG: Mostrar información del tema - REMOVER EN PRODUCCIÓN */}
      <div className="text-xs bg-gray-100 p-2 rounded">
        <strong>DEBUG:</strong> Role: {user?.role} | Theme: {theme.primaryColor} | Header: {theme.headerGradient}
      </div>

      {/* Header del perfil con colores CORRECTOS por role */}
      <div className={`bg-gradient-to-r ${theme.headerGradient} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.nombre}</h1>
            <p className="text-white text-opacity-80 capitalize mb-2">{user?.role}</p>
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-lg font-semibold">{getLevelTitle(currentLevel)}</span>
            </div>
            
            {/* Barra de progreso de nivel */}
            {currentLevel < 5 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white text-opacity-80">
                  <span>Nivel {currentLevel}</span>
                  <span>Nivel {currentLevel + 1}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
                <p className="text-xs text-white text-opacity-70">
                  {nextLevelPoints - currentPoints} puntos para el siguiente nivel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegación por tabs con colores CORRECTOS por role */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? `${theme.bgLight} ${theme.textColor} border-b-2 ${theme.border.replace('border-', 'border-b-')}`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'achievements' && renderAchievementsTab()}
      {activeTab === 'account' && renderAccountTab()}

      {/* Consejos para ganar puntos con colores CORRECTOS por role */}
      <div className={`bg-gradient-to-r ${theme.bgLight} to-blue-50 rounded-xl p-6 border ${theme.border}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Target className={`w-5 h-5 ${theme.textColor}`} />
          <span>¿Cómo ganar más puntos?</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${theme.bgMedium} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`text-xs font-bold ${theme.textColor}`}>+10</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Crear un reporte</p>
                <p className="text-sm text-gray-600">Por cada reporte con foto y ubicación</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">+25</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Reporte resuelto</p>
                <p className="text-sm text-gray-600">Cuando tu reporte sea marcado como limpio</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">+5</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Reporte verificado</p>
                <p className="text-sm text-gray-600">Por descripción detallada y ubicación precisa</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-yellow-600">+50</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Logro especial</p>
                <p className="text-sm text-gray-600">Por alcanzar metas y comportamiento ejemplar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;