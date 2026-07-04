import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
        WebRTC サンプルアプリケーション
      </h1>

      <p style={{ marginBottom: '30px', lineHeight: '1.6' }}>
        TURNサーバーを使用しないWebRTCのサンプル実装です。
        STUNサーバーのみを使用しているため、同じネットワーク内または
        NATトラバーサルが可能な環境で動作します。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link
          href="/video-chat"
          style={{
            display: 'block',
            padding: '30px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            transition: 'background-color 0.2s',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            📹 ビデオチャット
          </h2>
          <p style={{ opacity: 0.9 }}>
            WebRTCを使用したビデオ・音声通話のサンプルです。
            カメラとマイクを使ってリアルタイムで通信できます。
          </p>
        </Link>

        <Link
          href="/data-channel"
          style={{
            display: 'block',
            padding: '30px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            transition: 'background-color 0.2s',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            💬 データチャネル通信
          </h2>
          <p style={{ opacity: 0.9 }}>
            WebRTCのデータチャネルを使用したテキストメッセージや
            ファイル送受信のサンプルです。
          </p>
        </Link>
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          技術仕様
        </h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Next.js 14 (App Router)</li>
          <li>TypeScript</li>
          <li>WebRTC API (RTCPeerConnection, RTCDataChannel)</li>
          <li>STUNサーバー: Google Public STUN</li>
          <li>TURNサーバー: 使用なし</li>
        </ul>

        <h3
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginTop: '20px',
            marginBottom: '15px',
          }}
        >
          接続方法
        </h3>
        <p style={{ lineHeight: '1.8' }}>
          両方のユーザーがそれぞれのブラウザでアプリを開き、
          Offer/Answerを手動でコピー＆ペーストして交換することで接続します。
          実際のアプリケーションでは、シグナリングサーバー（WebSocketなど）を
          使用して自動的にOffer/Answerを交換します。
        </p>
      </div>
    </div>
  );
}
