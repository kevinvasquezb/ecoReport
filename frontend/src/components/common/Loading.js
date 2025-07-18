import React from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';

// Loading completo de pantalla
export const FullScreenLoading = ({ text = 'Cargando...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">EcoReports</h2>
        <p className="text-gray-600">{text}</p>
        <div className="mt-4">
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading inline para componentes
export const InlineLoading = ({ text = 'Cargando...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Loader2 className={`${sizeClasses[size]} text-emerald-600 animate-spin`} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

// Loading para botones
export const ButtonLoading = ({ text = 'Cargando...', disabled = true, className = '' }) => {
  return (
    <button
      disabled={disabled}
      className={`flex items-center space-x-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed ${className}`}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}</span>
    </button>
  );
};

// Skeleton loading para tarjetas
export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

// Skeleton loading para lista
export const SkeletonList = ({ items = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

// Loading para mapas
export const MapLoading = () => {
  return (
    <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3 mx-auto">
          <RefreshCw className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Cargando mapa...</p>
        <p className="text-gray-500 text-sm">Obteniendo ubicaciones de reportes</p>
      </div>
    </div>
  );
};

// Loading con progreso
export const ProgressLoading = ({ progress = 0, text = 'Cargando...' }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center space-x-3 mb-2">
        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        <span className="text-gray-700 font-medium">{text}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 mt-1">{Math.round(progress)}% completado</p>
    </div>
  );
};

// Loading estado vacío
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionText = 'Intentar de nuevo'
}) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// Loading para formularios
export const FormLoading = ({ text = 'Procesando...' }) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-8">
      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-white animate-spin" />
      </div>
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
};

// Loading para contenido de página
export const PageLoading = ({ title = 'Cargando página...' }) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center space-x-3">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
};

// Loading para estadísticas
export const StatsLoading = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
  onRetry,
  retryText = 'Reintentar'
}) => {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{retryText}</span>
        </button>
      )}
    </div>
  );
};

// Loading para upload de archivos
export const UploadLoading = ({ progress = 0, fileName = 'archivo' }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-2">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-blue-800 font-medium">Subiendo {fileName}...</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      <p className="text-sm text-blue-600 mt-1">{Math.round(progress)}% completado</p>
    </div>
  );
};

export default {
  FullScreenLoading,
  InlineLoading,
  ButtonLoading,
  SkeletonCard,
  SkeletonList,
  MapLoading,
  ProgressLoading,
  EmptyState,
  FormLoading,
  PageLoading,
  StatsLoading,
  ErrorState,
  UploadLoading
};