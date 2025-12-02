const CACHE_NAME = 'estzone-cache-v1';
const STATIC_CACHE = 'estzone-static-v1';
const DYNAMIC_CACHE = 'estzone-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/images/pwa-icon-72.png',
  '/images/pwa-icon-96.png',
  '/images/pwa-icon-128.png',
  '/images/pwa-icon-144.png',
  '/images/pwa-icon-152.png',
  '/images/pwa-icon-192.png',
  '/images/pwa-icon-384.png',
  '/images/pwa-icon-512.png',
];

const CACHE_STRATEGIES = {
  networkFirst: ['api'],
  cacheFirst: ['images', 'fonts', 'assets'],
  staleWhileRevalidate: ['products', 'categories'],
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isImageRequest = (url) => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname);
const isStaticAsset = (url) => /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET') {
    return;
  }
  
  if (url.origin !== location.origin) {
    return;
  }
  
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(event.request));
  } else if (isImageRequest(url) || isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    if (cached) {
      return cached;
    }
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  });
  
  return cached || networkPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from EstZone',
      icon: '/images/pwa-icon-192.png',
      badge: '/images/pwa-icon-72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
      },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'EstZone', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
