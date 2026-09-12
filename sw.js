// Service Worker للتطبيق
const CACHE_NAME = 'tawasol-book-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ تم فتح الـ cache بنجاح');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('⚠️ خطأ في تخزين الملفات:', err);
      })
  );
  self.skipWaiting();
});

// تنشيط Service Worker
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

// الرد على الطلبات
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجدنا الملف في الـ cache، أرجعه
        if (response) {
          return response;
        }

        // وإلا، حاول الحصول عليه من الإنترنت
        return fetch(event.request)
          .then(response => {
            // تحقق من صحة الرد
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // انسخ الرد وأضفه للـ cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // في حالة عدم وجود إنترنت، أرجع صفحة المحادثة المحفوظة
            return caches.match('/index.html');
          });
      })
  );
});

// معالجة الرسائل من التطبيق
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعارات Push (خيار مستقبلي)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231e3c72" width="192" height="192"/><text x="96" y="120" font-size="100" fill="white" text-anchor="middle">💬</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232a5298" width="192" height="192"/><text x="96" y="120" font-size="100" fill="white" text-anchor="middle">💬</text></svg>',
    tag: 'tawasol-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('تواصل بوك', options)
  );
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // ابحث عن نافذة مفتوحة بالفعل
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // وإلا، افتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});