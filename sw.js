self.addEventListener('push', function (event) {
  let data = { title: 'World Cup', body: 'New result available.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // fall back to default text above
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://flagcdn.com/w80/us.png', // placeholder; harmless if it fails to load
      badge: 'https://flagcdn.com/w80/us.png',
      tag: 'world-cup-result',
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
