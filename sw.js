// NeXus ZonE Radio - Service Worker v1.2.53
const CACHE_NAME = 'nexuszone-cache-v1.2.53';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './djs.json',
  './staff.js'
];

// Lista CERRADA de recursos que se guardan en caché (sin query string).
// Así la caché nunca crece: antes se guardaba cada respuesta, incluidas las
// URLs únicas con ?nocache=... que se piden cada pocos segundos.
const CACHEABLE = new Set(
  ['./', './index.html', './manifest.json', './icon.svg', './djs.json', './poema.js']
    .map((p) => new URL(p, self.registration.scope).href)
);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET del propio sitio. El stream, npoint, iTunes, flagcdn, fuentes,
  // el chat, /djs/ y staff.js los gestiona el navegador directamente.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const key = url.origin + url.pathname; // sin query
  if (!CACHEABLE.has(key)) return;

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(key, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(key))
  );
});
