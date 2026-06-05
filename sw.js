// Service Worker — RealRise KPI Dashboard
// Strategie: Cache First für statische Assets, Network First für Daten

const CACHE_NAME = 'kpi-dashboard-v1';
const STATIC_ASSETS = [
  '/kpi-dashboard.html',
  '/kpi-logic.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
];

// ─── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isStaticAsset =
    url.pathname === '/kpi-dashboard.html' ||
    url.pathname === '/kpi-logic.js';

  if (isStaticAsset) {
    // Cache First: statische Assets aus dem Cache laden
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          })
        )
    );
  } else {
    // Network First: alles andere frisch vom Netz, Cache als Fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
