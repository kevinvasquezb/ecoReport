// Service Worker para EcoReports PWA
const CACHE_NAME = 'ecoreports-v1.0.0';
const API_CACHE = 'ecoreports-api-v1';
const IMAGE_CACHE = 'ecoreports-images-v1';

// Archivos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Iconos de Leaflet
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  // Tiles de OpenStreetMap más comunes
  'https://tile.openstreetmap.org/13/2046/3068.png', // La Paz centro
  'https://tile.openstreetmap.org/13/2047/3068.png'
];

// URLs de API para cachear
const API_URLS = [
  '/api/auth/profile',
  '/api/reportes',
  '/api/stats/user'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando EcoReports PWA...');
  
  event.waitUntil(
    Promise.all([
      // Cache de archivos estáticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('tile.openstreetmap.org')));
      }),
      // Cache separado para imágenes
      caches.open(IMAGE_CACHE).then((cache) => {
        console.log('🖼️ Service Worker: Preparando cache de imágenes');
        return Promise.resolve();
      }),
      // Cache de API
      caches.open(API_CACHE).then((cache) => {
        console.log('🌐 Service Worker: Preparando cache de API');
        return Promise.resolve();
      })
    ]).catch((error) => {
      console.error('❌ Error durante instalación:', error);
    })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activando EcoReports PWA...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🎉 Service Worker: EcoReports PWA activado y listo');
    })
  );
  
  // Tomar control inmediatamente
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Solo manejar requests GET
  if (method !== 'GET') return;

  // Estrategia 1: Archivos estáticos - Cache First
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAssets(request));
    return;
  }

  // Estrategia 2: API calls - Network First con fallback a cache
  if (url.includes('/api/')) {
    event.respondWith(handleApiRequests(request));
    return;
  }

  // Estrategia 3: Imágenes - Cache First con Network Fallback
  if (isImageRequest(request, url)) {
    event.respondWith(handleImageRequests(request));
    return;
  }

  // Estrategia 4: Mapas de OpenStreetMap - Cache First
  if (url.includes('tile.openstreetmap.org')) {
    event.respondWith(handleMapTiles(request));
    return;
  }

  // Estrategia 5: Para todo lo demás - Network First
  event.respondWith(handleGenericRequests(request));
});

// Función para identificar archivos estáticos
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) || 
         url.includes('/static/') || 
         url.includes('.css') || 
         url.includes('.js') ||
         url.includes('.ico') ||
         url.includes('cdnjs.cloudflare.com');
}

// Función para identificar requests de imágenes
function isImageRequest(request, url) {
  return request.destination === 'image' || 
         url.includes('res.cloudinary.com') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.webp');
}

// Manejar archivos estáticos
async function handleStaticAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Error con archivo estático:', error);
    
    // Fallback para archivos críticos
    if (request.url.includes('bundle.js')) {
      return new Response('console.log("EcoReports offline mode");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    throw error;
  }
}

// Manejar requests de API
async function handleApiRequests(request) {
  try {
    // Intentar network primero
    const response = await fetch(request);
    
    // Cachear respuestas exitosas
    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🔄 API offline, usando cache:', request.url);
    
    // Fallback a cache si no hay conexión
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Agregar header para indicar que viene del cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Respuesta offline para APIs críticas
    if (request.url.includes('/api/auth/profile')) {
      return new Response(JSON.stringify({
        error: 'Sin conexión - Perfil no disponible offline',
        offline: true,
        usuario: null
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.url.includes('/api/reportes')) {
      return new Response(JSON.stringify({
        error: 'Sin conexión - Reportes no disponibles offline',
        offline: true,
        reportes: []
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Manejar requests de imágenes
async function handleImageRequests(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🖼️ Imagen offline, usando placeholder');
    
    // Imagen placeholder SVG para cuando no hay conexión
    const placeholderSVG = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2"/>
        <circle cx="100" cy="80" r="20" fill="#10b981"/>
        <text x="100" y="88" text-anchor="middle" fill="white" font-size="16">🌱</text>
        <text x="100" y="130" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">
          EcoReports
        </text>
        <text x="100" y="150" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="10">
          Sin conexión
        </text>
      </svg>
    `;
    
    return new Response(placeholderSVG, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// Manejar tiles de mapa
async function handleMapTiles(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Tile placeholder para mapas offline
    const tilePlaceholder = `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
        <text x="128" y="128" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="12">
          Mapa offline
        </text>
      </svg>
    `;
    
    return new Response(tilePlaceholder, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// Manejar requests genéricos
async function handleGenericRequests(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('📬 Push notification recibida en EcoReports');
  
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Tienes una nueva notificación de EcoReports',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    tag: 'ecoreports-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver reporte',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'EcoReports - Nueva notificación',
      options
    )
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Click en notificación:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Sync en background para reportes offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-reportes-offline') {
    event.waitUntil(syncReportesOffline());
  }
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Función para sincronizar reportes offline
async function syncReportesOffline() {
  try {
    console.log('🔄 Sincronizando reportes offline...');
    
    // Aquí implementarías la lógica para:
    // 1. Obtener reportes pendientes de IndexedDB
    // 2. Enviarlos al servidor cuando haya conexión
    // 3. Limpiar la cola offline
    
    // Simulación por ahora
    const offlineReports = await getOfflineReports();
    
    for (const report of offlineReports) {
      try {
        const response = await fetch('/api/reportes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${report.token}`
          },
          body: JSON.stringify(report.data)
        });
        
        if (response.ok) {
          await removeOfflineReport(report.id);
          console.log('✅ Reporte offline sincronizado:', report.id);
        }
      } catch (error) {
        console.error('❌ Error sincronizando reporte:', error);
      }
    }
    
    console.log('✅ Sync de reportes completado');
  } catch (error) {
    console.error('❌ Error en background sync de reportes:', error);
  }
}

// Función para sincronizar datos de usuario
async function syncUserData() {
  try {
    console.log('🔄 Sincronizando datos de usuario...');
    
    // Actualizar cache de perfil y estadísticas
    const profileResponse = await fetch('/api/auth/profile');
    if (profileResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/auth/profile', profileResponse.clone());
    }
    
    console.log('✅ Datos de usuario sincronizados');
  } catch (error) {
    console.error('❌ Error sincronizando datos de usuario:', error);
  }
}

// Funciones auxiliares para manejo offline (simuladas)
async function getOfflineReports() {
  // En una implementación real, esto obtendría datos de IndexedDB
  return [];
}

async function removeOfflineReport(reportId) {
  // En una implementación real, esto eliminaría el reporte de IndexedDB
  console.log('🗑️ Eliminando reporte offline:', reportId);
}

// Limpiar cache periódicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 Limpiando cache...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Eliminando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('✅ Cache limpiado completamente');
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar errores del Service Worker
self.addEventListener('error', (event) => {
  console.error('❌ Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rechazada en Service Worker:', event.reason);
});

console.log('🌱 EcoReports Service Worker cargado y listo');