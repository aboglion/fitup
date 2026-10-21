const CACHE_NAME = 'fitup-v229-progression-perfection';
const MEDIA_CACHE = 'fitup-media-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './about.html',
  './privacy.html',
  './terms.html',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/anatomy-front.webp',
  './images/anatomy-back.webp',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/config.js',
  './js/crypto.js',
  './js/data.js',
  './js/program-guide-content.js',
  './js/combat-scheduler.js',
  './js/db.js',
  './js/progression.js',
  './js/effects3d.js',
  './js/set-logger.js',
  './js/rest-timer.js',
  './js/workout-summary.js',
  './js/preloader.js',
  './js/injury-engine.js',
  './js/i18n.js',
  './js/muscle-map.js',
  './js/ui.js',
  './js/gemini.js',
  './js/today.js',
  './js/calendar.js',
  './js/exercises.js',
  './js/stats.js',
  './js/league.js',
  './js/anatomy.js',
  './js/export-guide.js',
  './js/cloud-sync.js',
  './js/google-fit.js',
  './js/notifications.js',
  './js/app.js',
  './PROGRAM_GUIDE.md'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(ASSETS);
      } catch (err) {
        console.warn('[SW] Pre-caching batch failed, attempting individual asset cache:', err);
        await Promise.allSettled(
          ASSETS.map((asset) =>
            cache.add(asset).catch((e) => {
              console.warn('[SW] Could not precache asset:', asset, e);
            })
          )
        );
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const mediaCache = await caches.open(MEDIA_CACHE);
      // Evict previously cached versions with white backgrounds
      try {
        const staleUrls = [
          'images/exercises/DB GLUTE BRIDGE.png',
          'images/exercises/DB%20GLUTE%20BRIDGE.png',
          'images/exercises/DB HIP THRUST.png',
          'images/exercises/DB%20HIP%20THRUST.png',
          'images/exercises/WRIST ROCKS.png',
          'images/exercises/WRIST%20ROCKS.png'
        ];
        const mediaRequests = await mediaCache.keys();
        for (const req of mediaRequests) {
          if (staleUrls.some(u => req.url && req.url.includes(u))) {
            await mediaCache.delete(req);
          }
        }
      } catch (_) { }

      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName !== CACHE_NAME && cacheName !== MEDIA_CACHE) {
          // Migrate any existing media assets to persistent MEDIA_CACHE before deleting old app-shell cache
          try {
            const oldCache = await caches.open(cacheName);
            const requests = await oldCache.keys();
            for (const req of requests) {
              if (req.url && (req.url.includes('/images/') || req.url.includes('.gif') || req.url.includes('.png') || req.url.includes('.webp'))) {
                // Do not migrate stale white-background assets
                if (req.url.includes('GLUTE') || req.url.includes('ROCKS') || req.url.includes('THRUST')) {
                  continue;
                }
                const res = await oldCache.match(req);
                if (res) {
                  await mediaCache.put(req, res);
                }
              }
            }
          } catch (e) {
            console.warn('[SW] Migration from old cache failed:', cacheName, e);
          }
          await caches.delete(cacheName);
        }
      }
      await self.clients.claim();
    })()
  );
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

  // Cache-First with Network Fallback for media assets (images, gifs, webp)
  if (url.includes('/images/')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback check in MEDIA_CACHE for decoded URI matching
        try {
          const mediaCache = await caches.open(MEDIA_CACHE);
          const decoded = decodeURI(event.request.url);
          if (decoded !== event.request.url) {
            const decMatch = await mediaCache.match(decoded, { ignoreSearch: true });
            if (decMatch) return decMatch;
          }
        } catch (_) { }

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(MEDIA_CACHE).then((cache) => {
                cache.put(event.request, responseToCache).catch(() => { });
                try {
                  const dec = decodeURI(event.request.url);
                  if (dec !== event.request.url) {
                    cache.put(dec, responseToCache.clone()).catch(() => { });
                  }
                } catch (_) { }
              }).catch(() => { });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
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
          }).catch(() => { });
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


