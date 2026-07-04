import { Hono } from 'hono';

type Bindings = {
  ASSETS: Fetcher;
  SUBSCRIPTIONS: KVNamespace;
  FCM_SUBSCRIPTIONS: KVNamespace;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  FCM_SERVER_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// API Routes

// VAPID公開鍵を取得
app.get('/api/vapid-public-key', (c) => {
  try {
    const publicKey = c.env.VAPID_PUBLIC_KEY;
    if (!publicKey || publicKey === 'YOUR_PUBLIC_KEY_HERE') {
      return c.json(
        {
          error: 'VAPID public key not configured',
        },
        500
      );
    }
    return c.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return c.json(
      {
        error: 'Failed to get VAPID key',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// プッシュ通知の購読を保存
app.post('/api/subscribe', async (c) => {
  try {
    const subscription = await c.req.json();

    if (!subscription || !subscription.endpoint) {
      return c.json(
        {
          success: false,
          error: 'Invalid subscription data',
        },
        400
      );
    }

    const endpoint = subscription.endpoint;

    // エンドポイントをキーとして購読情報を保存
    const subscriptionId = createSubscriptionId(endpoint);
    await c.env.SUBSCRIPTIONS.put(
      subscriptionId,
      JSON.stringify(subscription),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30日間保存
    );

    console.log('Subscription saved:', subscriptionId);
    return c.json({ success: true, id: subscriptionId });
  } catch (error) {
    console.error('Subscription error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to save subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// プッシュ通知を送信
app.post('/api/send-push', async (c) => {
  try {
    const body = await c.req.json();
    const { message, data } = body;

    if (!message && !data) {
      return c.json(
        {
          success: false,
          error: 'Message or data is required',
        },
        400
      );
    }

    // すべての購読を取得
    const list = await c.env.SUBSCRIPTIONS.list();

    if (list.keys.length === 0) {
      return c.json({
        success: true,
        sent: 0,
        total: 0,
        message: 'No subscriptions found',
      });
    }

    const sendPromises: Promise<any>[] = [];

    for (const key of list.keys) {
      const subscriptionJson = await c.env.SUBSCRIPTIONS.get(key.name);
      if (subscriptionJson) {
        try {
          const subscription = JSON.parse(subscriptionJson);
          sendPromises.push(
            sendPushNotification(subscription, message, data, c.env).catch((err) => {
              console.error(`Failed to send to ${key.name}:`, err);
              return { error: err.message };
            })
          );
        } catch (parseError) {
          console.error(`Failed to parse subscription ${key.name}:`, parseError);
        }
      }
    }

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && !(r.value as any)?.error
    ).length;

    console.log(`Push sent: ${successCount}/${results.length}`);
    return c.json({
      success: true,
      sent: successCount,
      total: results.length,
    });
  } catch (error) {
    console.error('Send push error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to send push',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// FCM用エンドポイント

// FCM設定を取得
app.get('/api/fcm/config', (c) => {
  try {
    // FCM Server Keyは公開しないので、フロントエンドには空のレスポンスを返す
    // 実際のFirebase設定はフロントエンドで直接Firebaseを初期化する
    return c.json({
      success: true,
      message: 'Use Firebase SDK to initialize FCM on client side',
    });
  } catch (error) {
    console.error('Error getting FCM config:', error);
    return c.json(
      {
        error: 'Failed to get FCM config',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// FCMトークンを保存
app.post('/api/fcm/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json(
        {
          success: false,
          error: 'FCM token is required',
        },
        400
      );
    }

    // トークンをキーとして保存
    const tokenId = createSubscriptionId(token);
    await c.env.FCM_SUBSCRIPTIONS.put(
      tokenId,
      JSON.stringify({ token, createdAt: Date.now() }),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30日間保存
    );

    console.log('FCM token saved:', tokenId);
    return c.json({ success: true, id: tokenId });
  } catch (error) {
    console.error('FCM subscription error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to save FCM token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// FCM経由でプッシュ通知を送信
app.post('/api/fcm/send-push', async (c) => {
  try {
    const body = await c.req.json();
    const { message, data } = body;

    if (!message && !data) {
      return c.json(
        {
          success: false,
          error: 'Message or data is required',
        },
        400
      );
    }

    const serverKey = c.env.FCM_SERVER_KEY;
    if (!serverKey || serverKey === 'YOUR_FCM_SERVER_KEY') {
      return c.json(
        {
          success: false,
          error: 'FCM Server Key not configured',
        },
        500
      );
    }

    // すべてのFCMトークンを取得
    const list = await c.env.FCM_SUBSCRIPTIONS.list();

    if (list.keys.length === 0) {
      return c.json({
        success: true,
        sent: 0,
        total: 0,
        message: 'No FCM tokens found',
      });
    }

    const sendPromises: Promise<any>[] = [];

    for (const key of list.keys) {
      const tokenJson = await c.env.FCM_SUBSCRIPTIONS.get(key.name);
      if (tokenJson) {
        try {
          const tokenData = JSON.parse(tokenJson);
          sendPromises.push(
            sendFCMNotification(tokenData.token, message, data, serverKey).catch((err) => {
              console.error(`Failed to send FCM to ${key.name}:`, err);
              return { error: err.message };
            })
          );
        } catch (parseError) {
          console.error(`Failed to parse FCM token ${key.name}:`, parseError);
        }
      }
    }

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && !(r.value as any)?.error
    ).length;

    console.log(`FCM push sent: ${successCount}/${results.length}`);
    return c.json({
      success: true,
      sent: successCount,
      total: results.length,
    });
  } catch (error) {
    console.error('FCM send push error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to send FCM push',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Static Assets - すべての非APIリクエストはフロントエンドへ
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// Helper Functions

function createSubscriptionId(endpoint: string): string {
  const hash = endpoint.split('/').pop() || '';
  return hash.substring(0, 50);
}

async function sendPushNotification(
  subscription: any,
  message: string,
  data: any,
  env: Bindings
): Promise<Response> {
  const payload = JSON.stringify({
    message,
    data,
    timestamp: Date.now(),
  });

  const endpoint = subscription.endpoint;

  // シンプルな実装: ペイロードをそのまま送信
  // 本番環境では適切な暗号化が必要
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      TTL: '86400',
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Push service error: ${response.status} - ${errorText}`);
  }

  return response;
}

async function sendFCMNotification(
  token: string,
  message: string,
  data: any,
  serverKey: string
): Promise<Response> {
  const payload = {
    to: token,
    data: {
      message,
      data: JSON.stringify(data),
      timestamp: Date.now().toString(),
    },
    // 通知を表示する場合
    notification: {
      title: message || 'New Message',
      body: JSON.stringify(data),
      icon: '/icon-192.png',
      tag: 'fcm-notification',
    },
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${serverKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`FCM error: ${response.status} - ${errorText}`);
  }

  return response;
}

export default app;
