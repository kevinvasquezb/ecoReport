import React from 'react';
import { Loader2, MapPin, Upload, Wifi, WifiOff } from 'lucide-react';

// Loading principal para pantalla completa
export const FullScreenLoading = ({ text = "Cargando..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🌱</span>
          </div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">EcoReports</h2>
        <p className="text-gray-600 animate-pulse">{text}</p>
        
        <div className="flex items-center justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

// Loading para botones
export const ButtonLoading = ({ text = "Cargando...", size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      <span>{text}</span>
    </div>
  );
};

// Loading para subida de archivos
export const UploadLoading = ({ progress = 0, text = "Subiendo imagen..." }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border max-w-sm mx-auto">
      <div className="text-center">
        <div className="relative mb-4">
          <Upload className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">{text}</h3>
        
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          {progress > 0 ? `${progress}% completado` : "Procesando..."}
        </p>
      </div>
    </div>
  );
};

// Loading para mapa
export const MapLoading = () => {
  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4">
          <MapPin className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  );
};

// Loading para listas
export const ListLoading = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading para estadísticas
export const StatsLoading = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading para cards
export const CardLoading = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Indicador de conexión
export const ConnectionIndicator = ({ isOnline = true }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Sin conexión a internet</span>
      </div>
    </div>
  );
};

// Loading con mensaje personalizable
export const CustomLoading = ({ 
  icon: Icon = Loader2, 
  title = "Cargando...", 
  subtitle = "", 
  color = "emerald" 
}) => {
  const colorClasses = {
    emerald: "text-emerald-500 border-t-emerald-500",
    blue: "text-blue-500 border-t-blue-500",
    purple: "text-purple-500 border-t-purple-500",
    red: "text-red-500 border-t-red-500"
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-4">
        <Icon className={`w-12 h-12 ${colorClasses[color]} animate-pulse`} />
        <div className={`absolute inset-0 w-12 h-12 border-4 border-transparent ${colorClasses[color].split(' ')[1]} rounded-full animate-spin`}></div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
};

// Loading inline para texto
export const InlineLoading = ({ text = "Cargando..." }) => {
  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
      <span className="text-sm">{text}</span>
    </div>
  );
};

// Skeleton para perfil
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse pb-20">
      <div className="bg-gray-200 rounded-2xl h-48"></div>
      <div className="bg-gray-200 rounded-xl h-16"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-200 rounded-xl h-24"></div>
        <div className="bg-gray-200 rounded-xl h-24"></div>
      </div>
      <div className="bg-gray-200 rounded-xl h-64"></div>
    </div>
  );
};