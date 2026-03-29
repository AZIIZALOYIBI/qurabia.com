const STATIC_CACHE = 'qurabia-static-v4';
const RUNTIME_CACHE = 'qurabia-runtime-v4';
const OFFLINE_FALLBACK = '/landing.html';

const ASSETS_TO_CACHE = [
  '/',
  '/landing.html',
  '/qurabia.html',
  '/QuantumOS.html',
  '/manifest.webmanifest',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(
      ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' }))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const responseToCache = response.clone();
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, responseToCache).catch(() => {});
  return response;
}

async function networkFirstAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || caches.match(OFFLINE_FALLBACK);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  return cached || networkFetch || caches.match(OFFLINE_FALLBACK);
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_FALLBACK);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigations: Network first for freshness with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const isCriticalAsset =
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/assets/');

  if (isCriticalAsset) {
    event.respondWith(networkFirstAsset(request));
    return;
  }

  const isStaticAsset =
    request.destination === 'font' ||
    request.destination === 'manifest' ||
    request.destination === 'image';

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
