import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FullScreenLoading } from './components/common/Loading';
import AuthWrapper from './pages/auth/AuthWrapper';
import CreateReport from './pages/dashboard/CreateReport';
import MapPage from './pages/dashboard/MapPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import ReportsPage from './pages/dashboard/ReportsPage';
import { 
  MapPin, 
  Plus, 
  Map, 
  User, 
  List, 
  LogOut, 
  Award,
  TrendingUp,
  Menu,
  X,
  Bell,
  Settings
} from 'lucide-react';

// Componente de navegación superior mejorado y funcional
const Navigation = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  // Colores por role
  const getRoleColors = (role) => {
    switch (role) {
      case 'citizen':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-500',
          text: 'text-emerald-600',
          light: 'bg-emerald-50'
        };
      case 'authority':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-500',
          text: 'text-blue-600',
          light: 'bg-blue-50'
        };
      case 'admin':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-500',
          text: 'text-purple-600',
          light: 'bg-purple-50'
        };
      default:
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-500',
          text: 'text-emerald-600',
          light: 'bg-emerald-50'
        };
    }
  };

  const roleColors = getRoleColors(user?.role);

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className={`w-10 h-10 bg-gradient-to-r ${roleColors.gradient} rounded-xl flex items-center justify-center shadow-md`}>
              <span className="text-xl font-bold text-white">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoReports</h1>
              <p className="text-xs text-gray-500">Ciudades más limpias</p>
            </div>
          </button>

          {/* Navegación desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'reports' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Mis Reportes
              </button>
              <button
                onClick={() => onNavigate('map')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'map' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Mapa
              </button>
            </nav>

            {/* Información del usuario - Desktop */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Award className={`w-4 h-4 ${roleColors.text}`} />
                <span className="text-sm font-medium text-gray-700">
                  {user?.puntos || 0} puntos
                </span>
              </div>

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 ${roleColors.bg} rounded-full`}></span>
                </button>

                {/* Dropdown de notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No tienes notificaciones nuevas</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil del usuario */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${roleColors.gradient} rounded-full flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">
                      {user?.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </button>
              </div>
              
              {/* Botón de logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Salir</span>
              </button>
            </div>
          </div>

          {/* Menú hamburguesa - Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <div className="flex items-center space-x-3 px-4 py-3 border-b">
              <div className={`w-10 h-10 bg-gradient-to-r ${roleColors.gradient} rounded-full flex items-center justify-center`}>
                <span className="text-lg font-bold text-white">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.nombre}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Award className={`w-3 h-3 ${roleColors.text}`} />
                  <span className="text-xs text-gray-600">{user?.puntos || 0} puntos</span>
                </div>
              </div>
            </div>

            {/* Navegación móvil */}
            <nav className="space-y-1 px-4 py-3">
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('reports');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'reports' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
                <span>Mis Reportes</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('map');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'map' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Mapa</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('profile');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'profile' 
                    ? `${roleColors.light} ${roleColors.text}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Perfil</span>
              </button>
            </nav>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors border-t"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
// Componente de navegación inferior funcional
const BottomNavigation = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  
  // Colores por role
  const getRoleColors = (role) => {
    switch (role) {
      case 'citizen':
        return {
          active: 'text-emerald-600 bg-emerald-50',
          inactive: 'text-gray-400'
        };
      case 'authority':
        return {
          active: 'text-blue-600 bg-blue-50',
          inactive: 'text-gray-400'
        };
      case 'admin':
        return {
          active: 'text-purple-600 bg-purple-50',
          inactive: 'text-gray-400'
        };
      default:
        return {
          active: 'text-emerald-600 bg-emerald-50',
          inactive: 'text-gray-400'
        };
    }
  };

  const roleColors = getRoleColors(user?.role);
  
  const navItems = [
    { 
      id: 'reports', 
      icon: List, 
      label: 'Reportes'
    },
    { 
      id: 'create', 
      icon: Plus, 
      label: 'Reportar'
    },
    { 
      id: 'map', 
      icon: Map, 
      label: 'Mapa'
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Perfil'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${roleColors.active} shadow-sm scale-110` 
                    : `${roleColors.inactive} hover:text-gray-600`
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Dashboard principal mejorado y funcional
const AuthenticatedDashboard = ({ user, onNavigate }) => {
  // Colores por role
  const getRoleColors = (role) => {
    switch (role) {
      case 'citizen':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          primary: 'emerald'
        };
      case 'authority':
        return {
          gradient: 'from-blue-500 to-blue-600',
          primary: 'blue'
        };
      case 'admin':
        return {
          gradient: 'from-purple-500 to-purple-600',
          primary: 'purple'
        };
      default:
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          primary: 'emerald'
        };
    }
  };

  const roleColors = getRoleColors(user?.role);

  return (
    <div className="space-y-6 pb-20">
      {/* Header de bienvenida */}
      <div className={`bg-gradient-to-r ${roleColors.gradient} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">¡Bienvenido, {user?.nombre}!</h2>
            <p className="text-white text-opacity-80 mt-1">
              Juntos construimos ciudades más limpias
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 justify-end">
              <Award className="w-5 h-5 text-yellow-300" />
              <span className="text-xl font-bold">{user?.puntos || 0}</span>
            </div>
            <p className="text-white text-opacity-70 text-sm">Puntos EcoReports</p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${roleColors.primary}-100 rounded-lg flex items-center justify-center`}>
              <TrendingUp className={`w-5 h-5 text-${roleColors.primary}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Reportes creados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${roleColors.primary}-100 rounded-lg flex items-center justify-center`}>
              <Award className={`w-5 h-5 text-${roleColors.primary}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">Nivel {user?.nivel || 1}</p>
              <p className="text-sm text-gray-600">EcoReporter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        
        <div className="grid gap-4">
          <button
            onClick={() => onNavigate('create')}
            className={`bg-gradient-to-r ${roleColors.gradient} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Crear Reporte</p>
                <p className="text-white text-opacity-80 text-sm">Reporta residuos en tu zona</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <Map className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Ver Mapa</p>
                <p className="text-blue-100 text-sm">Explora reportes cercanos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <List className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Mis Reportes</p>
                <p className="text-purple-100 text-sm">Revisa el estado de tus reportes</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Información sobre el sistema */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">¿Cómo funciona EcoReports?</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 📸 Toma fotos de acumulación de residuos</p>
          <p>• 📍 El GPS detecta automáticamente la ubicación</p>
          <p>• 🏆 Gana puntos por cada reporte verificado</p>
          <p>• 🌱 Contribuye a una ciudad más limpia</p>
        </div>
      </div>
    </div>
  );
};

// Componente principal de la aplicación
const AppContent = () => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (isLoading) {
    return <FullScreenLoading text="Cargando EcoReports..." />;
  }

  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateReport onReportCreated={() => setCurrentView('reports')} />;
      case 'map':
        return <MapPage />;
      case 'profile':
        return <ProfilePage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <AuthenticatedDashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onNavigate={setCurrentView} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>
      <BottomNavigation currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;