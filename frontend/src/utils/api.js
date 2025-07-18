import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecoreports_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para desarrollo
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Log para desarrollo
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Si es 401, limpiar token y redirigir a login
    if (error.response?.status === 401) {
      localStorage.removeItem('ecoreports_token');
      localStorage.removeItem('ecoreports_user');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Funciones de autenticación
export const authAPI = {
  // Registro de usuario
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Login de usuario
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
};

// Funciones de reportes
export const reportesAPI = {
  // Crear nuevo reporte
  create: async (reporteData) => {
    // Si hay imagen, usar FormData
    const isFormData = reporteData instanceof FormData;
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};

    const response = await api.post('/api/reportes', reporteData, config);
    return response.data;
  },

  // Obtener todos los reportes
  getAll: async (params = {}) => {
    const response = await api.get('/api/reportes', { params });
    return response.data;
  },

  // Obtener reporte por ID
  getById: async (id) => {
    const response = await api.get(`/api/reportes/${id}`);
    return response.data;
  },

  // Actualizar estado del reporte (solo autoridades)
  updateStatus: async (id, updateData) => {
    const response = await api.patch(`/api/reportes/${id}`, updateData);
    return response.data;
  },
};

// Funciones utilitarias
export const utils = {
  // Health check del servidor
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Función para subir archivo individual
  uploadFile: async (file, endpoint = '/api/upload') => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Funciones de almacenamiento local
export const storage = {
  // Guardar token
  setToken: (token) => {
    localStorage.setItem('ecoreports_token', token);
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem('ecoreports_token');
  },

  // Eliminar token
  removeToken: () => {
    localStorage.removeItem('ecoreports_token');
  },

  // Guardar usuario
  setUser: (user) => {
    localStorage.setItem('ecoreports_user', JSON.stringify(user));
  },

  // Obtener usuario
  getUser: () => {
    const user = localStorage.getItem('ecoreports_user');
    return user ? JSON.parse(user) : null;
  },

  // Eliminar usuario
  removeUser: () => {
    localStorage.removeItem('ecoreports_user');
  },

  // Limpiar todo
  clear: () => {
    localStorage.removeItem('ecoreports_token');
    localStorage.removeItem('ecoreports_user');
  },
};

// Exportar instancia de axios por defecto
export default api;