const CACHE_NAME = 'mi-evolucion-v7';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/store.js',
  './js/rules.js',
  './js/workout.js',
  './js/nutrition.js',
  './js/ai_coach.js',
  './js/app.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // No interceptar peticiones POST ni llamadas externas (como Gemini API)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first: carga siempre la versión más reciente y usa caché solo sin conexión
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
  );
});
