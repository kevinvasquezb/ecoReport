import React, { useState, useEffect } from 'react';
import { reportesAPI } from '../../utils/api';
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  CheckCircle,
  AlertCircle,
  FileImage,
  Loader2,
  Navigation,
  Send
} from 'lucide-react';

const CreateReport = ({ onReportCreated }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    direccion: '',
    tipo_estimado: '',
    latitud: null,
    longitud: null
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const tiposResiduos = [
    'Basura doméstica',
    'Escombros de construcción',
    'Residuos orgánicos',
    'Plásticos y envases',
    'Residuos electrónicos',
    'Vidrios y cristales',
    'Metales',
    'Residuos peligrosos',
    'Otros'
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitud: position.coords.latitude,
          longitud: position.coords.longitude
        }));
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        let errorMessage = 'No se pudo obtener tu ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Acceso a ubicación denegado. Habilita GPS en configuración.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Intenta nuevamente.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validaciones
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. Máximo 10MB permitido.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP).');
      return;
    }

    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Limpiar input file
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    if (!formData.descripcion.trim() || formData.descripcion.length < 10) {
      setSubmitError('La descripción debe tener al menos 10 caracteres');
      return false;
    }

    if (!formData.latitud || !formData.longitud) {
      setSubmitError('Se requiere la ubicación GPS para crear el reporte');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitError('');
    setSubmitSuccess(false);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('latitud', formData.latitud);
      formDataToSend.append('longitud', formData.longitud);
      
      if (formData.direccion.trim()) {
        formDataToSend.append('direccion', formData.direccion.trim());
      }
      
      if (formData.tipo_estimado) {
        formDataToSend.append('tipo_estimado', formData.tipo_estimado);
      }
      
      if (selectedFile) {
        formDataToSend.append('imagen', selectedFile);
      }

      const response = await reportesAPI.create(formDataToSend);
      
      setSubmitSuccess(true);
      
      // Limpiar formulario
      setFormData({
        descripcion: '',
        direccion: '',
        tipo_estimado: '',
        latitud: null,
        longitud: null
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Obtener nueva ubicación
      setTimeout(getCurrentLocation, 1000);
      
      if (onReportCreated) {
        setTimeout(() => onReportCreated(response.reporte), 2000);
      }

    } catch (error) {
      console.error('Error creando reporte:', error);
      setSubmitError(
        error.response?.data?.error || 
        'Error creando el reporte. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mensaje de éxito
  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 pb-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Enviado!</h2>
          <p className="text-gray-600 mb-4">
            Tu reporte ha sido creado exitosamente y está siendo procesado.
          </p>
          <p className="text-sm text-gray-500">
            Las autoridades serán notificadas y podrás ver el estado en tus reportes.
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-emerald-800 font-medium">¡Gracias por contribuir!</p>
          <p className="text-emerald-600 text-sm mt-1">
            Cada reporte nos ayuda a mantener nuestra ciudad más limpia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear Reporte</h1>
        <p className="text-gray-600">
          Reporta acumulación de residuos para ayudar a mantener la ciudad limpia
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descripción */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del problema *
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Describe detalladamente el problema de residuos que observas..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 10 caracteres ({formData.descripcion.length}/10)
          </p>
        </div>

        {/* Tipo de residuo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de residuo
          </label>
          <select
            name="tipo_estimado"
            value={formData.tipo_estimado}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Selecciona el tipo de residuo</option>
            {tiposResiduos.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Imagen */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fotografía del problema
          </label>
          
          {!previewUrl ? (
            <div>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Toma una foto del problema</p>
                <p className="text-sm text-gray-500 mb-4">
                  Máximo 10MB • Formatos: JPEG, PNG, WebP
                </p>
                <div className="space-y-2">
                  <label
                    htmlFor="imageInput"
                    className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Cámara</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    También puedes seleccionar desde galería
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                <FileImage className="w-4 h-4" />
                <span>{selectedFile?.name}</span>
                <span>({(selectedFile?.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Ubicación GPS *
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 text-sm"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>Actualizar</span>
            </button>
          </div>

          {isLoadingLocation ? (
            <div className="flex items-center space-x-2 text-gray-600 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Obteniendo ubicación...</span>
            </div>
          ) : formData.latitud && formData.longitud ? (
            <div className="flex items-center space-x-2 text-green-600 py-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">
                Ubicación detectada: {formData.latitud.toFixed(6)}, {formData.longitud.toFixed(6)}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 py-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {locationError || 'No se pudo obtener la ubicación'}
              </span>
            </div>
          )}

          {/* Dirección de referencia */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección de referencia (opcional)
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Ej: Cerca del parque central, Av. 6 de Agosto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Error message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoadingLocation || (!formData.latitud || !formData.longitud)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando reporte...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Enviar Reporte</span>
            </>
          )}
        </button>

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Información importante</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• La ubicación GPS es requerida para procesar tu reporte</li>
            <li>• Las fotografías ayudan a evaluar mejor el problema</li>
            <li>• Recibirás 10 puntos por cada reporte válido</li>
            <li>• Las autoridades serán notificadas automáticamente</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CreateReport;