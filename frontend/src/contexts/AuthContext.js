import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, storage } from '../utils/api';

// Estados del contexto de autenticación
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Tipos de acciones
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer para manejar el estado de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Función para registrar usuario
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      clearError();

      console.log('📝 Registrando usuario:', userData);

      const response = await authAPI.register(userData);
      
      if (response.token && response.usuario) {
        // Guardar en localStorage
        storage.setToken(response.token);
        storage.setUser(response.usuario);

        // Actualizar estado
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: {
            user: response.usuario,
            token: response.token,
          },
        });

        console.log('✅ Usuario registrado exitosamente:', response.usuario);
        return { success: true, user: response.usuario };
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error en el registro';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  };

  // Función para hacer login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      clearError();

      console.log('🔐 Iniciando sesión:', { email: credentials.email });

      const response = await authAPI.login(credentials);
      
      if (response.token && response.usuario) {
        // Guardar en localStorage
        storage.setToken(response.token);
        storage.setUser(response.usuario);

        // Actualizar estado
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: {
            user: response.usuario,
            token: response.token,
          },
        });

        console.log('✅ Login exitoso:', response.usuario);
        return { success: true, user: response.usuario };
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error en el login';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  };

  // Función para hacer logout
  const logout = () => {
    console.log('🚪 Cerrando sesión');
    
    // Limpiar localStorage
    storage.clear();
    
    // Actualizar estado
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Función para verificar autenticación al cargar la app
  const checkAuth = async () => {
    try {
      const token = storage.getToken();
      const savedUser = storage.getUser();

      if (!token || !savedUser) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      console.log('🔍 Verificando autenticación existente...');

      // Verificar que el token siga siendo válido
      const response = await authAPI.getProfile();
      
      if (response.usuario) {
        // Token válido, restaurar sesión
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: {
            user: response.usuario,
            token: token,
          },
        });

        console.log('✅ Sesión restaurada:', response.usuario);
      } else {
        // Token inválido, limpiar
        storage.clear();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.log('⚠️ Token inválido, limpiando sesión');
      
      // Token inválido o error de red
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Función para actualizar perfil del usuario
  const updateProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      
      if (response.usuario) {
        storage.setUser(response.usuario);
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: {
            user: response.usuario,
            token: state.token,
          },
        });
      }
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
    }
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, []);

  // Funciones utilitarias
  const isRole = (role) => {
    return state.user?.role === role;
  };

  const isCitizen = () => isRole('citizen');
  const isAuthority = () => isRole('authority');
  const isAdmin = () => isRole('admin');

  // Valor del contexto
  const value = {
    // Estado
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Funciones
    register,
    login,
    logout,
    clearError,
    updateProfile,
    checkAuth,

    // Utilidades
    isRole,
    isCitizen,
    isAuthority,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;