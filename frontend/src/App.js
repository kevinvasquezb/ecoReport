import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FullScreenLoading } from './components/common/Loading';
import AuthWrapper from './pages/auth/AuthWrapper';
import CreateReport from './pages/dashboard/CreateReport';
import MapPage from './pages/dashboard/MapPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import ReportsPage from './pages/dashboard/ReportsPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AuthorityDashboard from './pages/dashboard/AuthorityDashboard';
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
  Shield,
  Building,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';

// Componente de navegación mejorado
const Navigation = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'from-purple-500 to-purple-600';
      case 'authority':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-emerald-500 to-emerald-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'authority':
        return <Building className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'authority':
        return 'Autoridad';
      default:
        return 'Ciudadano';
    }
  };

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-xl flex items-center justify-center shadow-md`}>
              <span className="text-xl font-bold text-white">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoReports</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Panel de Administración' : 
                 user?.role === 'authority' ? 'Panel de Autoridades' : 
                 'Ciudades más limpias'}
              </p>
            </div>
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
              <div className={`w-8 h-8 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-bold text-white">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(user?.role)}
                  <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                </div>
              </div>
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

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <div className="flex items-center space-x-3 px-4 py-3 border-b">
              <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center`}>
                <span className="text-lg font-bold text-white">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.nombre}</p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(user?.role)}
                  <p className="text-sm text-gray-500">{getRoleLabel(user?.role)}</p>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Award className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-gray-600">{user?.puntos || 0} puntos</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
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

// Componente de navegación inferior (solo para ciudadanos)
const BottomNavigation = ({ currentView, onNavigate, userRole }) => {
  // Solo mostrar navegación inferior para ciudadanos
  if (userRole !== 'citizen') return null;
  
  const navItems = [
    { 
      id: 'dashboard', 
      icon: TrendingUp, 
      label: 'Inicio', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
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

// Dashboard para ciudadanos
const CitizenDashboard = ({ user, onNavigate }) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
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
    // Vistas para administradores
    if (user?.role === 'admin') {
      switch (currentView) {
        case 'profile':
          return <ProfilePage />;
        case 'map':
          return <MapPage />;
        case 'admin-users':
          return <div className="text-center py-20 text-gray-500">Panel de usuarios (próximamente)</div>;
        case 'admin-reports':
          return <div className="text-center py-20 text-gray-500">Gestión de reportes (próximamente)</div>;
        case 'admin-points':
          return <div className="text-center py-20 text-gray-500">Configuración de puntos (próximamente)</div>;
        case 'admin-analytics':
          return <div className="text-center py-20 text-gray-500">Análisis y reportes (próximamente)</div>;
        default:
          return <AdminDashboard onNavigate={setCurrentView} />;
      }
    }

    // Vistas para autoridades
    if (user?.role === 'authority') {
      switch (currentView) {
        case 'profile':
          return <ProfilePage />;
        case 'map':
          return <MapPage />;
        case 'authority-manage':
          return <div className="text-center py-20 text-gray-500">Gestión de reportes (próximamente)</div>;
        default:
          return <AuthorityDashboard onNavigate={setCurrentView} />;
      }
    }

    // Vistas para ciudadanos
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
        return <CitizenDashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>
      <BottomNavigation 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        userRole={user?.role}
      />
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