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
  Home
} from 'lucide-react';

// Componente de navegación mejorado
const Navigation = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleNavigation = (view) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-white">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoReports</h1>
              <p className="text-xs text-gray-500">Ciudades más limpias</p>
            </div>
          </div>

          {/* Navegación Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Inicio</span>
            </button>
            
            <button
              onClick={() => handleNavigation('create')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'create' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Reportar</span>
            </button>
            
            <button
              onClick={() => handleNavigation('map')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="text-sm font-medium">Mapa</span>
            </button>
            
            <button
              onClick={() => handleNavigation('reports')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'reports' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Mis Reportes</span>
            </button>
          </div>

          {/* Información del usuario - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                {user?.puntos || 0} puntos
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigation('profile')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'profile' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
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

        {/* Menú móvil mejorado */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <div className="flex items-center space-x-3 px-4 py-3 border-b">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.nombre}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Award className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-gray-600">{user?.puntos || 0} puntos</span>
                </div>
              </div>
            </div>
            
            {/* Navegación móvil */}
            <div className="space-y-1 px-4 py-2">
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Inicio</span>
              </button>
              
              <button
                onClick={() => handleNavigation('create')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'create' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Crear Reporte</span>
              </button>
              
              <button
                onClick={() => handleNavigation('map')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Ver Mapa</span>
              </button>
              
              <button
                onClick={() => handleNavigation('reports')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'reports' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-5 h-5" />
                <span>Mis Reportes</span>
              </button>
              
              <button
                onClick={() => handleNavigation('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'profile' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Mi Perfil</span>
              </button>
            </div>
            
            <div className="border-t pt-2 px-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Componente de navegación inferior
const BottomNavigation = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  
  const navItems = [
    { 
      id: 'reports', 
      icon: List, 
      label: 'Reportes', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'create', 
      icon: Plus, 
      label: 'Reportar', 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      id: 'map', 
      icon: Map, 
      label: 'Mapa', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Perfil', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 md:hidden">
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
                    ? `${item.color} ${item.bgColor} shadow-sm` 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Dashboard principal mejorado
const AuthenticatedDashboard = ({ user, onNavigate }) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">¡Bienvenido, {user?.nombre?.split(' ')[0]}!</h2>
            <p className="text-emerald-100 mt-1">
              Juntos construimos ciudades más limpias
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 justify-end">
              <Award className="w-5 h-5 text-yellow-300" />
              <span className="text-xl font-bold">{user?.puntos || 0}</span>
            </div>
            <p className="text-emerald-100 text-sm">Puntos EcoReports</p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Reportes creados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
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
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Crear Reporte</p>
                <p className="text-emerald-100 text-sm">Reporta residuos en tu zona</p>
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

      {/* Tips para ganar puntos */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <h4 className="font-semibold text-emerald-800 mb-2">💡 Tips para ganar puntos</h4>
        <div className="space-y-2 text-sm text-emerald-700">
          <p>• +10 puntos por cada reporte con foto</p>
          <p>• +25 puntos cuando tu reporte sea resuelto</p>
          <p>• +5 puntos por descripción detallada</p>
          <p>• +50 puntos por logros especiales</p>
        </div>
      </div>
    </div>
  );
};

// Componente principal
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