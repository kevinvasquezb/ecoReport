import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FullScreenLoading } from './components/common/Loading';
import AuthWrapper from './pages/auth/AuthWrapper';
import CreateReport from './pages/dashboard/CreateReport';
import MapPage from './pages/dashboard/MapPage';

// Componente de navegación
const Navigation = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoReports</h1>
              <p className="text-xs text-gray-500">Día 3 - React PWA</p>
            </div>
          </div>

          {/* Navegación */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('create')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'create' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📋</span>
              <span>Crear Reporte</span>
            </button>

            <button
              onClick={() => setCurrentView('map')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'map' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🗺️</span>
              <span>Mapa</span>
            </button>
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="relative group">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-bold">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                currentView === 'dashboard' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>🏠</span>
              <span>Inicio</span>
            </button>
            <button
              onClick={() => setCurrentView('create')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                currentView === 'create' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>📋</span>
              <span>Crear</span>
            </button>
            <button
              onClick={() => setCurrentView('map')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                currentView === 'map' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>🗺️</span>
              <span>Mapa</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente principal de la aplicación
const AppContent = () => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [reporteCreado, setReporteCreado] = useState(null);

  // Mostrar pantalla de carga mientras verifica autenticación
  if (isLoading) {
    return <FullScreenLoading text="Iniciando EcoReports..." />;
  }

  // Si no está autenticado, mostrar formularios de auth
  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  // Función para manejar cuando se crea un reporte
  const handleReportCreated = (nuevoReporte) => {
    setReporteCreado(nuevoReporte);
    // Cambiar automáticamente al mapa para ver el reporte
    setCurrentView('map');
    // Limpiar el reporte después de 5 segundos
    setTimeout(() => setReporteCreado(null), 5000);
  };

  // Componente de contenido principal según la vista actual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateReport onReportCreated={handleReportCreated} />;
      case 'map':
        return <MapPage />;
      default:
        return <AuthenticatedDashboard user={user} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notificación de reporte creado */}
        {reporteCreado && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up">
            <div className="flex items-center space-x-3">
              <span className="text-green-500 text-xl">🎉</span>
              <div>
                <h3 className="font-medium text-green-900">¡Reporte creado exitosamente!</h3>
                <p className="text-green-700 text-sm">
                  Reporte #{reporteCreado.id} - {reporteCreado.descripcion.substring(0, 50)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {renderCurrentView()}
      </main>
    </div>
  );
};

// Dashboard para usuarios autenticados
const AuthenticatedDashboard = ({ user, onNavigate }) => {
  const { logout } = useAuth();

  return (
    <div className="space-y-8">
      {/* Dashboard de bienvenida */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {user.nombre}! 🎉
        </h2>
        <p className="text-primary-100 mb-6">
          Tu aplicación EcoReports está funcionando correctamente. El frontend React se conectó exitosamente con el backend.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-primary-100">Role</p>
            <p className="font-semibold capitalize">{user.role}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-primary-100">Email</p>
            <p className="font-semibold">{user.email}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-primary-100">Puntos</p>
            <p className="font-semibold">{user.puntos || 0}</p>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Crear reporte */}
        <div className="card group hover:shadow-xl transition-all duration-300">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Crear Reporte</h3>
                <p className="text-sm text-gray-500">Reportar basura o residuos</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('create')}
              className="btn-primary w-full"
            >
              Nuevo Reporte 📸
            </button>
          </div>
        </div>

        {/* Ver mapa */}
        <div className="card group hover:shadow-xl transition-all duration-300">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-authority-100 rounded-xl flex items-center justify-center group-hover:bg-authority-200 transition-colors">
                <span className="text-2xl">🗺️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ver Mapa</h3>
                <p className="text-sm text-gray-500">Reportes en tiempo real</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('map')}
              className="btn-authority w-full"
            >
              Abrir Mapa 🌍
            </button>
          </div>
        </div>

        {/* Perfil */}
        <div className="card group hover:shadow-xl transition-all duration-300">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mi Perfil</h3>
                <p className="text-sm text-gray-500">Configuración y estadísticas</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-xl w-full transition-colors"
            >
              Cerrar Sesión 🚪
            </button>
          </div>
        </div>
      </div>

      {/* Estado del desarrollo */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
          <span>🚀</span>
          <span>Estado del Desarrollo - Día 3 Completado</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-3">✅ Completado:</h4>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Backend Node.js + PostgreSQL + Cloudinary</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Frontend React + TailwindCSS</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Autenticación JWT completa</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Formularios de reportes con cámara</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Geolocalización GPS automática</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>✅</span>
                <span>Mapas interactivos con Leaflet</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-3">⏳ Próximo (Día 4-7):</h4>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>PWA Service Worker</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>Notificaciones push</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>Funcionalidad offline</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>Sistema de gamificación</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>Dashboard para autoridades</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>⏳</span>
                <span>IA (Día 8) + n8n (Día 9)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
            <span>⚡</span>
            <span>Tecnologías Implementadas</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-green-800">Frontend:</span>
              <p className="text-green-700">React 18 + TailwindCSS</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-green-800">Backend:</span>
              <p className="text-green-700">Node.js + Express</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-green-800">Base de datos:</span>
              <p className="text-green-700">PostgreSQL + PostGIS</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-green-800">Mapas:</span>
              <p className="text-green-700">Leaflet + OpenStreetMap</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
            <span>🎯</span>
            <span>Próximos Objetivos</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-purple-800">Día 4-5:</span>
              <p className="text-purple-700">PWA + Notificaciones</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-purple-800">Día 6-7:</span>
              <p className="text-purple-700">Dashboard autoridades</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-purple-800">Día 8-9:</span>
              <p className="text-purple-700">IA + Automatización</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal con providers
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