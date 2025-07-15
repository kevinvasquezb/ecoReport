import React from 'react';

const Loading = ({ size = 'medium', text = 'Cargando...', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        <div 
          className={`
            ${sizeClasses[size]} 
            border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin
          `}
        />
        {/* Glow effect */}
        <div 
          className={`
            absolute inset-0 ${sizeClasses[size]} 
            border-4 border-transparent border-t-primary-300 rounded-full animate-spin opacity-50
          `}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>
      
      {/* Texto de carga */}
      {text && (
        <p className={`text-gray-600 font-medium ${textSizes[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Componente de pantalla completa de carga
export const FullScreenLoading = ({ text = 'Cargando EcoReports...' }) => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo o icono */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-bold text-white">🌱</span>
          </div>
        </div>
        
        {/* Loading spinner */}
        <Loading size="large" text={text} />
        
        {/* Mensaje adicional */}
        <p className="text-gray-400 text-sm mt-4 max-w-xs mx-auto">
          Conectando con los servicios de EcoReports
        </p>
      </div>
    </div>
  );
};

// Componente de loading en línea
export const InlineLoading = ({ text = 'Procesando...' }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

// Componente de loading para botones
export const ButtonLoading = ({ className = '' }) => {
  return (
    <div className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ${className}`} />
  );
};

export default Loading;