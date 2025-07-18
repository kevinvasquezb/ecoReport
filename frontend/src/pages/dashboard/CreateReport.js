import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Navigation,
  Info,
  Send
} from 'lucide-react';

const CreateReport = ({ onReportCreated }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    tipo_estimado: '',
    direccion: '',
    latitud: '',
    longitud: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [locationError, setLocationError] = useState('');

  // Obtener ubicación automáticamente al cargar
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en este navegador');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitud: latitude.toString(),
          longitud: longitude.toString()
        }));
        
        // Obtener dirección aproximada usando reverse geocoding
        reverseGeocode(latitude, longitude);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        let errorMessage = 'No se pudo obtener la ubicación.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados. Habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo agotado obteniendo ubicación. Intenta nuevamente.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Usando OpenStreetMap Nominatim API (gratuita)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Crear una dirección más legible
        const address = data.address;
        let formattedAddress = '';
        
        if (address.road) formattedAddress += address.road;
        if (address.house_number) formattedAddress += ` ${address.house_number}`;
        if (address.neighbourhood) formattedAddress += `, ${address.neighbourhood}`;
        if (address.city || address.town || address.village) {
          formattedAddress += `, ${address.city || address.town || address.village}`;
        }
        
        setFormData(prev => ({
          ...prev,
          direccion: formattedAddress || data.display_name
        }));
      }
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      // No mostramos error ya que es opcional
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar mensajes cuando el usuario edita
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleImageSelect = (e, isCamera = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Solo se permiten imágenes JPEG, PNG o WebP'
      });
      return;
    }

    // Validar tamaño (10MB máx)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'La imagen no puede superar los 10MB'
      });
      return;
    }

    setSelectedImage(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setMessage({ type: '', text: '' });
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!formData.descripcion.trim() || formData.descripcion.trim().length < 10) {
      setMessage({
        type: 'error',
        text: 'La descripción debe tener al menos 10 caracteres'
      });
      return false;
    }

    if (formData.descripcion.trim().length > 500) {
      setMessage({
        type: 'error',
        text: 'La descripción no puede superar los 500 caracteres'
      });
      return false;
    }

    if (!formData.latitud || !formData.longitud) {
      setMessage({
        type: 'error',
        text: 'Se requiere ubicación GPS. Presiona "Obtener Ubicación" nuevamente.'
      });
      return false;
    }

    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setMessage({
        type: 'error',
        text: 'Latitud inválida. Obtén la ubicación nuevamente.'
      });
      return false;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setMessage({
        type: 'error',
        text: 'Longitud inválida. Obtén la ubicación nuevamente.'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const submitData = new FormData();
      
      // Agregar datos del formulario
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Agregar imagen si existe
      if (selectedImage) {
        submitData.append('imagen', selectedImage);
      }

      const response = await reportesAPI.create(submitData);

      setMessage({
        type: 'success',
        text: '¡Reporte creado exitosamente! Gracias por contribuir a una ciudad más limpia.'
      });

      // Limpiar formulario
      setFormData({
        descripcion: '',
        tipo_estimado: '',
        direccion: '',
        latitud: '',
        longitud: ''
      });
      removeImage();

      // Obtener nueva ubicación para el próximo reporte
      setTimeout(() => {
        getCurrentLocation();
      }, 1000);

      // Callback para navegar
      if (onReportCreated) {
        setTimeout(() => {
          onReportCreated(response.reporte);
        }, 2000);
      }

    } catch (error) {
      console.error('Error creando reporte:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al crear el reporte. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Crear Reporte</h1>
        <p className="text-gray-600 mt-2">
          Reporta acumulación de residuos en tu zona
        </p>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div className={`rounded-xl p-4 flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subida de imagen */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Fotografía del problema <span className="text-gray-500">(opcional pero recomendado)</span>
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                {(selectedImage.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  {/* Botón de cámara */}
                  <label className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>Cámara</span>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageSelect(e, true)}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Botón de galería */}
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Galería</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm">
                    Una foto ayuda a las autoridades a entender mejor el problema
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Máximo 10MB • JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del problema *
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Describe detalladamente el problema de residuos (ej: acumulación de basura doméstica en la esquina, escombros de construcción bloqueando la vereda, etc.)"
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              Mínimo 10 caracteres
            </p>
            <p className={`text-sm ${formData.descripcion.length > 450 ? 'text-red-600' : 'text-gray-500'}`}>
              {formData.descripcion.length}/500
            </p>
          </div>
        </div>

        {/* Tipo de residuo */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <label htmlFor="tipo_estimado" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de residuo
          </label>
          <select
            id="tipo_estimado"
            name="tipo_estimado"
            value={formData.tipo_estimado}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Selecciona el tipo de residuo</option>
            <option value="Basura doméstica">Basura doméstica</option>
            <option value="Escombros de construcción">Escombros de construcción</option>
            <option value="Residuos orgánicos">Residuos orgánicos</option>
            <option value="Materiales reciclables">Materiales reciclables</option>
            <option value="Residuos peligrosos">Residuos peligrosos</option>
            <option value="Chatarra metálica">Chatarra metálica</option>
            <option value="Neumáticos">Neumáticos</option>
            <option value="Muebles y electrodomésticos">Muebles y electrodomésticos</option>
            <option value="Otros">Otros</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Ayúdanos a clasificar el tipo de residuo para una mejor gestión
          </p>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Ubicación GPS *
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span className="text-sm">
                {isGettingLocation ? 'Obteniendo...' : 'Obtener Ubicación'}
              </span>
            </button>
          </div>

          {locationError && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 text-sm font-medium">Problema con la ubicación</p>
                <p className="text-yellow-700 text-sm">{locationError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitud</label>
              <input
                type="text"
                name="latitud"
                value={formData.latitud}
                onChange={handleInputChange}
                placeholder="-16.5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitud</label>
              <input
                type="text"
                name="longitud"
                value={formData.longitud}
                onChange={handleInputChange}
                placeholder="-68.1500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                readOnly
              />
            </div>
          </div>

          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección de referencia
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Calle, avenida, punto de referencia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se detecta automáticamente, pero puedes editarla para mayor precisión
            </p>
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={isLoading || isGettingLocation}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creando reporte...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Crear Reporte</span>
            </>
          )}
        </button>
      </form>

      {/* Información adicional */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-emerald-800 mb-2">💡 Consejos para un buen reporte</h3>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Incluye una foto clara del problema</li>
              <li>• Describe específicamente qué tipo de residuos hay</li>
              <li>• Indica si es un problema recurrente o puntual</li>
              <li>• Proporciona puntos de referencia claros</li>
              <li>• Sé preciso en la descripción para facilitar la limpieza</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sistema de puntos */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-2">🏆 Gana puntos por reportar</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• +10 puntos por crear este reporte</p>
              <p>• +5 puntos extra si incluyes foto</p>
              <p>• +25 puntos cuando sea resuelto</p>
              <p>• ¡Ayuda a tu ciudad y sube de nivel!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;