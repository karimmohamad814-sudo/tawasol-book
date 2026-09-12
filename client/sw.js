// Service Worker - تواصل بوك
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `tawasol-book-${CACHE_VERSION}`;

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/auth.css',
  './css/chat.css',
  './css/calls.css',
  './css/groups.css',
  './js/config.js',
  './js/utils.js',
  './js/api.js',
  './js/auth.js',
  './js/chat.js',
  './js/calls.js',
  './js/groups.js',
  './js/socket.js',
  './js/app.js',
  'https://cdn.socket.io/4.5.4/socket.io.min.js',
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ تم فتح الـ cache بنجاح');
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('⚠️ بعض الملفات لم تُخزن في الـ cache:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الـ cache القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First Strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (handle separately)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache First Strategy for assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        });
    })
  );
});

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'رسالة جديدة من تواصل بوك',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%237c3aed" width="192" height="192" rx="40"/><text x="96" y="135" font-size="100" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">TS</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%237c3aed" width="192" height="192" rx="40"/><text x="96" y="135" font-size="100" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">TS</text></svg>',
    tag: data.tag || 'tawasol-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification('تواصل بوك', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      fetch('/api/sync-messages', {
        method: 'POST',
        credentials: 'include'
      })
    );
  }
});
