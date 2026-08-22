const CACHE_NAME = 'fitup-v134';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/config.js',
  './js/crypto.js',
  './js/data.js',
  './js/db.js',
  './js/progression.js',
  './js/effects3d.js',
  './js/set-logger.js',
  './js/rest-timer.js',
  './js/workout-summary.js',
  './js/preloader.js',
  './js/i18n.js',
  './js/ui.js',
  './js/gemini.js',
  './js/today.js',
  './js/calendar.js',
  './js/exercises.js',
  './js/stats.js',
  './js/anatomy.js',
  './js/export-guide.js',
  './js/cloud-sync.js',
  './js/google-fit.js',
  './js/notifications.js',
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

  const url = event.request.url;

  // Bypass external APIs and Fonts to avoid CORS and caching issues
  if (url.includes('script.google.com') || 
      url.includes('script.googleusercontent.com') ||
      url.includes('fonts.googleapis.com') || 
      url.includes('fonts.gstatic.com')) {
    return;
  }

  // Cache-First Strategy for media assets (images, gifs, webp)
  if (url.includes('/images/')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((response) => {
              // ONLY cache status 200 responses.
              // Status 304 (Not Modified) and 206 (Partial Content) throw a TypeError if passed to cache.put().
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache).catch((err) => {
                    console.warn('[SW] Cache put failed for image:', event.request.url, err);
                  });
                }).catch(() => {});
              }
              return response;
            })
            .catch(() => {
              return caches.match(event.request, { ignoreSearch: true }).then((fallback) => {
                if (fallback) return fallback;
                return new Response('', { status: 404, statusText: 'Not Found' });
              });
            });
        })
        .catch(() => {
          return new Response('', { status: 404, statusText: 'Not Found' });
        })
    );
    return;
  }

  // Default caching strategy for other assets (Network-First with Cache Fallback)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ONLY cache status 200 responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              console.warn('[SW] Cache put failed:', event.request.url, err);
            });
          }).catch(() => {});
        }
        return response;
      })
      .catch((err) => {
        console.warn('[SW] Network error, falling back to cache:', event.request.url, err);
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Network error and not found in cache.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});


