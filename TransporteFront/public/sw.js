// Service Worker para Web Push Notifications
// Este archivo se sirve desde la raiz del dominio

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
    icon: data.icon || '/transporteicon.svg',
    badge: data.badge || '/transporteicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
    tag: 'transporte-notification',
    renotify: true,
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
  // Cuando la suscripcion cambia (renueva), re-suscribir automaticamente
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then(function (subscription) {
        // Enviar la nueva suscripcion al backend
        return fetch('/api/push-subscriptions/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
          }),
        });
      })
  );
});
