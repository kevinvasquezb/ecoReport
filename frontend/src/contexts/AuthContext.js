import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Función para guardar datos de autenticación
  const saveAuthData = (token, userData) => {
    try {
      console.log('💾 Guardando datos de autenticación:', { 
        token: token?.substring(0, 20) + '...', 
        user: userData?.nombre 
      });
      
      localStorage.setItem('ecoreports_token', token);
      localStorage.setItem('ecoreports_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Datos guardados y estado actualizado');
    } catch (error) {
      console.error('❌ Error guardando datos de auth:', error);
    }
  };

  // ✅ Función para limpiar datos de autenticación
  const clearAuthData = () => {
    console.log('🧹 Limpiando datos de autenticación');
    
    localStorage.removeItem('ecoreports_token');
    localStorage.removeItem('ecoreports_user');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // ✅ Función de login
  const login = async (credentials) => {
    try {
      console.log('🔑 Iniciando login para:', credentials.email);
      
      const response = await authAPI.login(credentials);
      console.log('📨 Respuesta del login:', response);
      
      if (response.token && response.usuario) {
        saveAuthData(response.token, response.usuario);
        return { success: true };
      } else {
        console.error('❌ Respuesta de login inválida:', response);
        return { success: false, error: 'Respuesta de login inválida' };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error de conexión';
      return { success: false, error: errorMessage };
    }
  };

  // ✅ Función de registro
  const register = async (userData) => {
    try {
      console.log('📝 Iniciando registro para:', userData.email);
      
      const response = await authAPI.register(userData);
      console.log('📨 Respuesta del registro:', response);
      
      if (response.token && response.usuario) {
        saveAuthData(response.token, response.usuario);
        return { success: true };
      } else {
        console.error('❌ Respuesta de registro inválida:', response);
        return { success: false, error: 'Respuesta de registro inválida' };
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error de conexión';
      return { success: false, error: errorMessage };
    }
  };

  // ✅ Función de logout
  const logout = () => {
    console.log('👋 Cerrando sesión');
    clearAuthData();
  };

  // ✅ Función para verificar si el token es válido
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        console.log('⚠️ Token expirado');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validando token:', error);
      return false;
    }
  };

  // ✅ Función para cargar datos desde localStorage al iniciar
  const loadAuthData = async () => {
    try {
      console.log('🔍 Verificando localStorage al iniciar...');
      
      const token = localStorage.getItem('ecoreports_token');
      const userDataString = localStorage.getItem('ecoreports_user');
      
      if (token && userDataString) {
        console.log('🔍 Datos encontrados en localStorage');
        
        // Validar token
        if (!isTokenValid(token)) {
          console.log('⚠️ Token inválido o expirado, limpiando');
          clearAuthData();
          return;
        }
        
        // Parsear datos del usuario
        const userData = JSON.parse(userDataString);
        console.log('👤 Restaurando sesión para:', userData.nombre);
        
        // ✅ IMPORTANTE: Verificar que el token sigue siendo válido en el backend
        try {
          const profileResponse = await authAPI.getProfile();
          console.log('✅ Token válido en backend, sesión restaurada');
          
          // Actualizar con datos frescos del backend
          saveAuthData(token, profileResponse.usuario || userData);
        } catch (profileError) {
          console.log('❌ Token no válido en backend, limpiando');
          clearAuthData();
        }
      } else {
        console.log('ℹ️ No hay sesión guardada');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error cargando datos de auth:', error);
      clearAuthData();
    }
  };

  // ✅ Efecto para cargar datos al inicializar (SOLO UNA VEZ)
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Inicializando AuthContext...');
      setIsLoading(true);
      await loadAuthData();
      setIsLoading(false);
      console.log('✅ AuthContext inicializado');
    };

    initAuth();
  }, []); // ✅ Array vacío = solo se ejecuta una vez

  // ✅ Debug del estado (solo cuando cambia)
  useEffect(() => {
    console.log('🔄 Estado AuthContext:', {
      isAuthenticated,
      userName: user?.nombre,
      userRole: user?.role,
      isLoading
    });
  }, [isAuthenticated, user, isLoading]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    saveAuthData,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};