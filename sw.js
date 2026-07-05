const CACHE_NAME = 'fitup-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './training_data.json',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/db.js',
  './js/ui.js',
  './js/today.js',
  './js/calendar.js',
  './js/exercises.js',
  './js/stats.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, else fetch from network
      return cachedResponse || fetch(event.request).then(response => {
        // Optional: Cache new requests dynamically here
        return response;
      });
    })
  );
});
