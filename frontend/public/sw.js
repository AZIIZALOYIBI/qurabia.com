const STATIC_CACHE = 'qurabia-static-v9';
const RUNTIME_CACHE = 'qurabia-runtime-v9';
const OFFLINE_FALLBACK = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
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

    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_ACTIVATED' });
    });
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
  if (url.origin !== self.location.origin) return;

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

// ── Background Sync for Offline Simulation Queue ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-simulation-queue') {
    event.waitUntil(processSimulationQueue());
  }
  if (event.tag === 'sync-error-reports') {
    event.waitUntil(processErrorReports());
  }
});

async function processSimulationQueue() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('simulation-queue', 'readonly');
    const store = tx.objectStore('simulation-queue');
    const requests = await store.getAll();

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        if (response.ok) {
          const deleteTx = db.transaction('simulation-queue', 'readwrite');
          deleteTx.objectStore('simulation-queue').delete(req.id);
        }
      } catch {}
    }
  } catch {}
}

async function processErrorReports() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('error-reports', 'readonly');
    const store = tx.objectStore('error-reports');
    const reports = await store.getAll();

    for (const report of reports) {
      try {
        const response = await fetch('/api/learning/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report.payload),
        });
        if (response.ok) {
          const deleteTx = db.transaction('error-reports', 'readwrite');
          deleteTx.objectStore('error-reports').delete(report.id);
        }
      } catch {}
    }
  } catch {}
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('qurabia-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target).result;
      if (!db.objectStoreNames.contains('simulation-queue')) {
        db.createObjectStore('simulation-queue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('error-reports')) {
        db.createObjectStore('error-reports', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Push Notification Handler ──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'عرب qu';
    const options = {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      dir: 'rtl' as const,
      lang: 'ar',
      tag: data.tag || 'qurabia-notification',
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// ── Periodic Background Sync for Data Refresh ─────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-quantum-data') {
    event.waitUntil(refreshQuantumData());
  }
});

async function refreshQuantumData() {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch('/api/genesis/status');
    if (response.ok) {
      cache.put('/api/genesis/status', response.clone()).catch(() => {});
    }
  } catch {}
}
