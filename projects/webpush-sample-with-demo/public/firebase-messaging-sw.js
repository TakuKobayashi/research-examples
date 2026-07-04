// Firebase Messaging Service Worker
// このファイルはpublic/firebase-messaging-sw.jsとして配置

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase設定（実際の設定に置き換えてください）
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// バックグラウンドメッセージ受信
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // クライアントにデータを送信
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'FCM_PUSH_DATA',
        payload: {
          message: payload.data?.message || payload.notification?.title || '',
          data: payload.data?.data ? JSON.parse(payload.data.data) : {},
          timestamp: parseInt(payload.data?.timestamp || Date.now().toString()),
        },
      });
    });
  });

  // 通知を表示（オプション）
  if (payload.notification) {
    const notificationTitle = payload.notification.title || 'New Message';
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/icon-192.png',
      data: payload.data,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
