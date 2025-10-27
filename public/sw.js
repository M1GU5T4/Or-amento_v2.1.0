// Service Worker para cache de recursos estáticos
const CACHE_NAME = 'sistema-gestao-v2.1.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Recursos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Cache first para recursos estáticos
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
            .then((fetchResponse) => {
              return caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
    );
  }
  
  // Network first para API calls
  else if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
  
  // Stale while revalidate para HTML
  else if (event.request.destination === 'document') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          const fetchPromise = fetch(event.request)
            .then((fetchResponse) => {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, fetchResponse.clone());
                });
              return fetchResponse;
            });
          
          return response || fetchPromise;
        })
    );
  }
});