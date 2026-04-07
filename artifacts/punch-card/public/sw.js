const CACHE_NAME = 'punch-card-v3';

function withBasePath(path) {
  return new URL(path, self.registration.scope).pathname;
}

self.addEventListener('install', (event) => {
  const assetsToCache = [
    withBasePath('./'),
    withBasePath('./index.html'),
    withBasePath('./manifest.json'),
    withBasePath('./favicon.svg')
  ];

  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => self.clients.claim())
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const appShell = withBasePath('./index.html');

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match(appShell));
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Punch Card', body: 'You have a new message!' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || data.message || 'New notification',
    icon: withBasePath('./favicon.svg'),
    badge: withBasePath('./favicon.svg'),
    vibrate: [100, 50, 100],
    tag: data.tag || 'punch-card-alert',
    renotify: true,
    data: { url: data.url || withBasePath('./notifications') },
    actions: [{ action: 'view', title: 'View' }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Punch Card', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || withBasePath('./notifications');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
