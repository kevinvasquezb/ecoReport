import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo y encabezado */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl font-bold text-white">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EcoReports</h1>
          <p className="text-gray-600">
            Plataforma inteligente para el monitoreo de residuos urbanos
          </p>
        </div>

        {/* Contenedor del formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Botones de navegación */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formularios */}
          <div className="transition-all duration-300">
            {isLogin ? (
              <Login onToggleForm={() => setIsLogin(false)} />
            ) : (
              <Register onToggleForm={() => setIsLogin(true)} />
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h3 className="font-semibold text-gray-900 mb-2">
              ¿Cómo funciona EcoReports?
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-600">📸</span>
                <span>Reporta residuos con fotos y GPS</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🏛️</span>
                <span>Las autoridades reciben notificaciones</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">🏆</span>
                <span>Gana puntos por contribuir</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">🌱</span>
                <span>Ayuda a crear ciudades más limpias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Al usar EcoReports, contribuyes al desarrollo sostenible</p>
          <p className="mt-1">
            <span className="font-medium">ODS 11:</span> Ciudades y Comunidades Sostenibles
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;