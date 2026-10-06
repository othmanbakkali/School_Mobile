// Custom Service Worker logic for Web Push and Phone System Notifications
// Safe Mode / School Mobile

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push event received:', event);

  let data = {
    title: 'School Mobile',
    body: 'Nouvelle notification scolaire.',
    icon: '/icons/icon-192.webp',
    badge: '/icons/icon-192.webp',
    url: '/tabs/dashboard',
    tag: 'school-push-' + Date.now()
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = Object.assign({}, data, payload);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.webp',
    badge: data.badge || '/icons/icon-192.webp',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'school-alert',
    renotify: true,
    data: {
      url: data.url || '/tabs/dashboard',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Voir le détail' },
      { action: 'dismiss', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification click received:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const rawPath = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/tabs/dashboard';

  // Construct absolute URL safely
  let targetUrl;
  try {
    targetUrl = new URL(rawPath, self.location.origin).href;
  } catch (e) {
    targetUrl = self.location.origin + (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
  }

  // Broadcast notification click to all active clients via BroadcastChannel for maximum reliability
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('school-notifications');
      bc.postMessage({
        type: 'NOTIFICATION_CLICK',
        url: rawPath,
        fullUrl: targetUrl,
        data: event.notification.data
      });
      bc.close();
    }
  } catch (bcErr) {}

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an app window/tab is already open, focus it and tell the app to navigate smoothly via Vue Router
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: rawPath,
            fullUrl: targetUrl,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // 2. If no window is open, open a new window pointing directly to the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Support manual SKIP_WAITING from update prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW Push] SKIP_WAITING received, activating new service worker...');
    self.skipWaiting();
  }
});
