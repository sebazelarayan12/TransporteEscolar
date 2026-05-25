// Service Worker para Web Push Notifications
// Este archivo se sirve desde la raiz del dominio

let apiSubscribeUrl = null;

self.addEventListener('message', function (event) {
  if (event.data?.type === 'SET_API_SUBSCRIBE_URL') {
    apiSubscribeUrl = event.data.url;
  }
});

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Transporte Escolar',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
    tag: data.tag || `notif-${Date.now()}`,
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Transporte Escolar', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Si ya hay una ventana abierta de la app, enfocarla y navegar
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', function (event) {
  if (!apiSubscribeUrl) {
    // URL no disponible (SW recien iniciado sin pagina activa); la suscripcion
    // se renovara la proxima vez que el usuario abra la app.
    return;
  }

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then(function (subscription) {
        return fetch(apiSubscribeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64Url(subscription.getKey('auth')),
          }),
        });
      })
  );
});
