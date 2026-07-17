const CACHE_NAME = 'fitup-v56';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './training_data.json',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/data.js',
  './js/db.js',
  './js/ui.js',
  './js/today.js',
  './js/calendar.js',
  './js/exercises.js',
  './js/stats.js',
  './js/anatomy.js',
  './js/export-guide.js',
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
          if (cacheName !== CACHE_NAME) {
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
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
