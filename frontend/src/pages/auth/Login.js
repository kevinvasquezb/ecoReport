import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

const Login = ({ onToggleForm }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '', // ✅ VACÍO para producción
    password: '' // ✅ VACÍO para producción
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔑 Login - Iniciando proceso...', { email: formData.email });
    setLocalError('');
    
    if (!formData.email || !formData.password) {
      setLocalError('Email y contraseña son requeridos');
      return;
    }

    try {
      const result = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (result.success) {
        console.log('✅ Login exitoso, usuario autenticado');
      } else {
        setLocalError(result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setLocalError('Error de conexión. Verifica que el backend esté corriendo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {localError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{localError}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="tu@email.com"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Tu contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Iniciar Sesión</span>
            </>
          )}
        </button>
      </form>

      {/* Toggle to register */}
      <div className="text-center">
        <button
          type="button"
          onClick={onToggleForm}
          className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          disabled={isLoading}
        >
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </div>


    </div>
  );
};

export default Login;