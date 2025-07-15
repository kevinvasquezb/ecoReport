import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { ButtonLoading } from '../../components/common/Loading';

const CreateReport = ({ onReportCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    descripcion: '',
    tipo_estimado: '',
    direccion: '',
    latitud: null,
    longitud: null,
  });
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Tipos de residuos predefinidos
  const tiposResiduos = [
    'Basura doméstica',
    'Escombros',
    'Neumáticos',
    'Electrónicos',
    'Orgánicos',
    'Plásticos',
    'Vidrio',
    'Metales',
    'Otros'
  ];

  // Obtener geolocalización al cargar el componente
  useEffect(() => {
    obtenerUbicacion();
  }, []);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este navegador');
      return;
    }

    setLocationStatus('loading');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitud: latitude,
          longitud: longitude
        }));
        setLocationStatus('success');
        console.log('📍 Ubicación obtenida:', { latitude, longitude });
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación:', error);
        setError('No se pudo obtener la ubicación. Asegúrate de permitir el acceso.');
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      procesarImagen(file);
    }
  };

  const procesarImagen = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB.');
      return;
    }

    setImagen(file);
    setError('');

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagenPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    console.log('📸 Imagen seleccionada:', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      type: file.type
    });
  };

  const abrirCamara = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const abrirGaleria = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const eliminarImagen = () => {
    setImagen(null);
    setImagenPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!formData.latitud || !formData.longitud) {
      setError('Se requiere la ubicación para crear el reporte');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Crear FormData para enviar imagen
      const reportData = new FormData();
      reportData.append('descripcion', formData.descripcion.trim());
      reportData.append('latitud', formData.latitud);
      reportData.append('longitud', formData.longitud);
      
      if (formData.direccion.trim()) {
        reportData.append('direccion', formData.direccion.trim());
      }
      
      if (formData.tipo_estimado) {
        reportData.append('tipo_estimado', formData.tipo_estimado);
      }
      
      if (imagen) {
        reportData.append('imagen', imagen);
      }

      console.log('📤 Enviando reporte...');
      
      const response = await reportesAPI.create(reportData);
      
      console.log('✅ Reporte creado exitosamente:', response);
      
      setSuccess('¡Reporte creado exitosamente! 🎉');
      
      // Limpiar formulario
      setFormData({
        descripcion: '',
        tipo_estimado: '',
        direccion: '',
        latitud: formData.latitud, // Mantener ubicación
        longitud: formData.longitud,
      });
      setImagen(null);
      setImagenPreview(null);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
      // Notificar al componente padre
      if (onReportCreated) {
        onReportCreated(response.reporte);
      }
      
    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      setError(error.response?.data?.error || 'Error creando el reporte');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearUbicacion = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crear Reporte</h2>
              <p className="text-gray-600">Reporta basura o residuos en tu área</p>
            </div>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-green-700 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">❌</span>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ubicación */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <span>📍</span>
                  <span>Ubicación</span>
                </h3>
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={locationStatus === 'loading'}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  {locationStatus === 'loading' ? 'Obteniendo...' : 'Actualizar'}
                </button>
              </div>
              
              {locationStatus === 'loading' && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                  <span className="text-sm">Obteniendo ubicación...</span>
                </div>
              )}
              
              {locationStatus === 'success' && formData.latitud && formData.longitud && (
                <div className="text-sm text-gray-600">
                  <p>📍 {formatearUbicacion(formData.latitud, formData.longitud)}</p>
                  <p className="text-xs text-gray-500 mt-1">Ubicación obtenida automáticamente</p>
                </div>
              )}
              
              {locationStatus === 'error' && (
                <p className="text-sm text-red-600">
                  ❌ Error obteniendo ubicación. Intenta nuevamente.
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del problema *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows="4"
                required
                value={formData.descripcion}
                onChange={handleChange}
                className="input-field"
                placeholder="Describe el problema de basura o residuos que encontraste..."
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 10 caracteres. Sé específico para ayudar a las autoridades.
              </p>
            </div>

            {/* Tipo de residuo */}
            <div>
              <label htmlFor="tipo_estimado" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de residuo (opcional)
              </label>
              <select
                id="tipo_estimado"
                name="tipo_estimado"
                value={formData.tipo_estimado}
                onChange={handleChange}
                className="input-field"
                disabled={isLoading}
              >
                <option value="">Selecciona un tipo</option>
                {tiposResiduos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección o referencia (opcional)
              </label>
              <input
                id="direccion"
                name="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleChange}
                className="input-field"
                placeholder="Ej: Cerca del parque central, Calle 123"
                disabled={isLoading}
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotografía (opcional pero recomendada)
              </label>
              
              {!imagenPreview ? (
                <div className="space-y-4">
                  {/* Botones de captura */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={abrirCamara}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      disabled={isLoading}
                    >
                      <span className="text-3xl mb-2">📷</span>
                      <span className="text-sm font-medium text-gray-700">Tomar Foto</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={abrirGaleria}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      disabled={isLoading}
                    >
                      <span className="text-3xl mb-2">🖼️</span>
                      <span className="text-sm font-medium text-gray-700">Elegir de Galería</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    La foto ayuda a las autoridades a entender mejor el problema
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview de imagen */}
                  <div className="relative">
                    <img
                      src={imagenPreview}
                      alt="Preview del reporte"
                      className="w-full h-64 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={eliminarImagen}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <span>✅</span>
                    <span>Imagen lista para enviar</span>
                  </div>
                </div>
              )}

              {/* Inputs ocultos */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Información del usuario */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-500">👤</span>
                <span className="font-medium text-blue-900">Información del reporte</span>
              </div>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Reportado por:</strong> {user?.nombre}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Tipo de usuario:</strong> {user?.role === 'citizen' ? 'Ciudadano' : 'Autoridad'}</p>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading || !formData.descripcion.trim() || !formData.latitud}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <ButtonLoading />
                    <span>Creando reporte...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Reporte</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
              
              {(formData.descripcion || imagen) && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      descripcion: '',
                      tipo_estimado: '',
                      direccion: '',
                      latitud: formData.latitud,
                      longitud: formData.longitud,
                    });
                    eliminarImagen();
                    setError('');
                    setSuccess('');
                  }}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;