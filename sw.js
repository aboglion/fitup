const CACHE_NAME = 'fitup-v68';
const FONTS_CACHE = 'fitup-fonts-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/config.js',
  './js/crypto.js',
  './js/data.js',
  './js/db.js',
  './js/ui.js',
  './js/today.js',
  './js/calendar.js',
  './js/exercises.js',
  './js/stats.js',
  './js/anatomy.js',
  './js/export-guide.js',
  './js/cloud-sync.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== FONTS_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  const url = event.request.url;

  // Bypass external APIs to avoid CORS and caching issues
  if (url.includes('script.google.com') || 
      url.includes('script.googleusercontent.com')) {
    return;
  }

  // Handle Google Fonts specially (Cache-First)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(FONTS_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch((error) => {
          // If font fails to load offline, return a network error so the browser uses fallback fonts
          // Do NOT return a 503 response, as it causes console noise
          throw error;
        });
      })
    );
    return;
  }

  // Default caching strategy for other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache valid, successful responses
        if (response && (response.status === 200 || response.status === 304)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return custom 503 ONLY for local assets, not fonts or external scripts
          return new Response('Network error and not found in cache.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
