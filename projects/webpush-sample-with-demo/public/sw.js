// Service Worker - 通知モードとサイレントモードを切り替え可能

let notificationMode = 'silent'; // 'silent' or 'notify'

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_NOTIFICATION_MODE') {
    notificationMode = event.data.mode;
    console.log('Notification mode set to:', notificationMode);
  }
});

self.addEventListener('push', (event) => {
  console.log('Push event received');

  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Received push data:', payload);

    // クライアントにデータを送信
    const sendToClients = self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_DATA',
            payload: payload,
          });
        });
      });

    if (notificationMode === 'notify') {
      // 通知を表示する
      const title = payload.message || '新しいメッセージ';
      const options = {
        body: JSON.stringify(payload.data, null, 2),
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'push-notification',
        data: payload,
        requireInteraction: false,
      };

      event.waitUntil(
        Promise.all([sendToClients, self.registration.showNotification(title, options)])
      );
    } else {
      // サイレントモード: 通知を表示せずデータのみ配信
      event.waitUntil(sendToClients);
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 既に開いているウィンドウがあればフォーカス
      for (let client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});
