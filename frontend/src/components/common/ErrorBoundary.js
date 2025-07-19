import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Captura los detalles del error
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log del error para debugging
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    // Aquí podrías enviar el error a un servicio de logging
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Simulación de envío a servicio de logging
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // En producción, enviarías esto a tu servicio de logging
    console.log('Error logged:', errorData);
  };

  handleRetry = () => {
    this.setState({ isRetrying: true });
    
    // Simular un pequeño delay para la UI
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false 
      });
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // UI de error personalizada
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Icono de error */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              {/* Título */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Oops! Algo salió mal
              </h1>

              {/* Descripción */}
              <p className="text-gray-600 mb-6">
                Ha ocurrido un error inesperado en la aplicación. 
                Nuestro equipo ha sido notificado y está trabajando en solucionarlo.
              </p>

              {/* Detalles del error (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                    <Bug className="w-4 h-4" />
                    <span>Detalles técnicos (desarrollo)</span>
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {this.state.isRetrying ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Reintentando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Intentar de nuevo</span>
                    </>
                  )}
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Ir al inicio</span>
                </button>
              </div>

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Si el problema persiste, contáctanos en{' '}
                  <a 
                    href="mailto:soporte@ecoreports.com" 
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    soporte@ecoreports.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente funcional para errores específicos
export const ErrorFallback = ({ 
  error, 
  resetError, 
  title = "Algo salió mal",
  message = "Ha ocurrido un error inesperado" 
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-sm text-gray-500">
            Ver detalles del error
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      
      <button
        onClick={resetError}
        className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
};

// Hook para capturar errores en componentes funcionales
export const useErrorHandler = () => {
  return (error, errorInfo = {}) => {
    console.error('Error capturado:', error, errorInfo);
    
    // Aquí podrías enviar el error a tu servicio de logging
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...errorInfo
    };
    
    console.log('Error logged:', errorData);
  };
};

// Componente de error para rutas no encontradas
export const NotFoundError = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;