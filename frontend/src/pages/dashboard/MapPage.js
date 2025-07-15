import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportesAPI } from '../../utils/api';
import MapView from '../../components/maps/MapView';
import Loading from '../../components/common/Loading';

const MapPage = () => {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    tipo: '',
  });

  // Cargar reportes al montar el componente
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🗺️ Cargando reportes para el mapa...');
      
      const response = await reportesAPI.getAll();
      
      setReportes(response.reportes || []);
      console.log(`✅ ${response.reportes?.length || 0} reportes cargados para el mapa`);
      
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setError('Error cargando los reportes. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReporteClick = (reporte) => {
    setSelectedReporte(reporte);
    console.log('🎯 Reporte seleccionado:', reporte);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filtrar reportes según los filtros aplicados
  const reportesFiltrados = reportes.filter(reporte => {
    if (filters.estado && reporte.estado !== filters.estado) {
      return false;
    }
    if (filters.tipo && reporte.tipo_estimado !== filters.tipo) {
      return false;
    }
    return true;
  });

  // Obtener tipos únicos para el filtro
  const tiposUnicos = [...new Set(reportes.map(r => r.tipo_estimado).filter(Boolean))];

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="large" text="Cargando mapa..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-authority-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🗺️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Reportes</h1>
            <p className="text-gray-600">
              {reportesFiltrados.length} de {reportes.length} reportes mostrados
            </p>
          </div>
        </div>
        
        <button
          onClick={cargarReportes}
          disabled={isLoading}
          className="btn-secondary flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">❌</span>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los estados</option>
              <option value="Reportado">Reportado</option>
              <option value="En proceso">En proceso</option>
              <option value="Limpio">Limpio</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de residuo
            </label>
            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los tipos</option>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ estado: '', tipo: '' })}
              className="btn-secondary w-full"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body p-0">
              <MapView
                reportes={reportesFiltrados}
                height="600px"
                onReporteClick={handleReporteClick}
                showUserLocation={true}
                className="rounded-2xl overflow-hidden"
              />
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <span>📊</span>
                <span>Estadísticas</span>
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Reportado', value: reportes.filter(r => r.estado === 'Reportado').length, color: 'bg-yellow-100 text-yellow-800' },
                  { label: 'En proceso', value: reportes.filter(r => r.estado === 'En proceso').length, color: 'bg-blue-100 text-blue-800' },
                  { label: 'Limpio', value: reportes.filter(r => r.estado === 'Limpio').length, color: 'bg-green-100 text-green-800' },
                  { label: 'Rechazado', value: reportes.filter(r => r.estado === 'Rechazado').length, color: 'bg-red-100 text-red-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reporte seleccionado */}
          {selectedReporte ? (
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>📋</span>
                    <span>Reporte #{selectedReporte.id}</span>
                  </h3>
                  <button
                    onClick={() => setSelectedReporte(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Estado */}
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      selectedReporte.estado === 'Reportado' ? 'bg-yellow-100 text-yellow-800' :
                      selectedReporte.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                      selectedReporte.estado === 'Limpio' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedReporte.estado}
                    </span>
                  </div>

                  {/* Descripción */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Descripción</h4>
                    <p className="text-sm text-gray-600">{selectedReporte.descripcion}</p>
                  </div>

                  {/* Tipo */}
                  {selectedReporte.tipo_estimado && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Tipo</h4>
                      <p className="text-sm text-gray-600">{selectedReporte.tipo_estimado}</p>
                    </div>
                  )}

                  {/* Dirección */}
                  {selectedReporte.direccion && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Dirección</h4>
                      <p className="text-sm text-gray-600">{selectedReporte.direccion}</p>
                    </div>
                  )}

                  {/* Coordenadas */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Ubicación</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {selectedReporte.latitud?.toFixed(6)}, {selectedReporte.longitud?.toFixed(6)}
                    </p>
                  </div>

                  {/* Fecha */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Reportado</h4>
                    <p className="text-sm text-gray-600">{formatearFecha(selectedReporte.created_at)}</p>
                  </div>

                  {/* Usuario */}
                  {selectedReporte.usuario_nombre && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Reportado por</h4>
                      <p className="text-sm text-gray-600">{selectedReporte.usuario_nombre}</p>
                    </div>
                  )}

                  {/* Imagen */}
                  {selectedReporte.imagen_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Imagen</h4>
                      <img
                        src={selectedReporte.imagen_thumbnail_url || selectedReporte.imagen_url}
                        alt="Imagen del reporte"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Acciones para autoridades */}
                  {user?.role === 'authority' && selectedReporte.estado !== 'Limpio' && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Acciones</h4>
                      <div className="space-y-2">
                        <button className="w-full btn-secondary text-sm py-2">
                          Cambiar a "En proceso"
                        </button>
                        <button className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-lg">
                          Marcar como "Limpio"
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Selecciona un reporte</h3>
                <p className="text-gray-500 text-sm">
                  Haz clic en cualquier marcador del mapa para ver sus detalles
                </p>
              </div>
            </div>
          )}

          {/* Información del usuario */}
          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <span>👤</span>
                <span>Tu información</span>
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rol:</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{user?.nombre}</span>
                </div>
                {user?.role === 'citizen' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntos:</span>
                    <span className="font-medium">{user?.puntos || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state si no hay reportes */}
      {reportes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay reportes</h3>
          <p className="text-gray-600 mb-6">
            Aún no se han creado reportes. ¡Sé el primero en reportar un problema!
          </p>
          <button className="btn-primary">
            Crear primer reporte
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPage;