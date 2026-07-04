'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'me' | 'peer';
  text: string;
  timestamp: Date;
}

export default function DataChannel() {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [offer, setOffer] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [remoteOffer, setRemoteOffer] = useState<string>('');
  const [remoteAnswer, setRemoteAnswer] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [channelState, setChannelState] = useState<string>('closed');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC設定（STUNサーバーのみ使用、TURNなし）
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // データチャネルのセットアップ
  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log('データチャネルが開きました');
      setChannelState('open');
      setIsConnected(true);
    };

    channel.onclose = () => {
      console.log('データチャネルが閉じました');
      setChannelState('closed');
      setIsConnected(false);
    };

    channel.onerror = (error) => {
      console.error('データチャネルエラー:', error);
    };

    channel.onmessage = (event) => {
      console.log('メッセージ受信:', event.data);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'peer',
          text: event.data,
          timestamp: new Date(),
        },
      ]);
    };

    setDataChannel(channel);
  };

  // Offer側の処理（データチャネルを作成する側）
  const createOffer = async () => {
    const pc = new RTCPeerConnection(rtcConfig);
    setPeerConnection(pc);

    // データチャネルの作成
    const channel = pc.createDataChannel('chat', {
      ordered: true, // 順序保証
    });
    setupDataChannel(channel);

    // ICE候補の収集
    const candidates: RTCIceCandidate[] = [];
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate);
      }
    };

    // 接続状態の監視
    pc.onconnectionstatechange = () => {
      console.log('接続状態:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    // Offerの作成
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    // ICE候補の収集完了を待つ
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });

    // ICE候補を含むOfferを生成
    const offerWithCandidates = {
      type: offerDescription.type,
      sdp: offerDescription.sdp,
      candidates: candidates.map((c) => c.toJSON()),
    };

    setOffer(JSON.stringify(offerWithCandidates, null, 2));
  };

  // Answer側の処理（Offerを受け取って応答する側）
  const createAnswer = async () => {
    if (!remoteOffer) {
      alert('相手のOfferを入力してください');
      return;
    }

    try {
      const offerData = JSON.parse(remoteOffer);
      const pc = new RTCPeerConnection(rtcConfig);
      setPeerConnection(pc);

      // データチャネルの受信
      pc.ondatachannel = (event) => {
        console.log('データチャネルを受信しました');
        setupDataChannel(event.channel);
      };

      // 接続状態の監視
      pc.onconnectionstatechange = () => {
        console.log('接続状態:', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
        }
      };

      // リモートDescriptionを設定
      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: offerData.type,
          sdp: offerData.sdp,
        })
      );

      // ICE候補を追加
      if (offerData.candidates) {
        for (const candidate of offerData.candidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      // ICE候補の収集
      const candidates: RTCIceCandidate[] = [];
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        }
      };

      // Answerの作成
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      // ICE候補の収集完了を待つ
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
        }
      });

      // ICE候補を含むAnswerを生成
      const answerWithCandidates = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
        candidates: candidates.map((c) => c.toJSON()),
      };

      setAnswer(JSON.stringify(answerWithCandidates, null, 2));
    } catch (error) {
      console.error('Answer作成エラー:', error);
      alert('Answerの作成に失敗しました');
    }
  };

  // Answerを受け取って接続を完了（Offer側の最終処理）
  const setRemoteAnswerData = async () => {
    if (!peerConnection) {
      alert('先にOfferを作成してください');
      return;
    }

    if (!remoteAnswer) {
      alert('相手のAnswerを入力してください');
      return;
    }

    try {
      const answerData = JSON.parse(remoteAnswer);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: answerData.type,
          sdp: answerData.sdp,
        })
      );

      // ICE候補を追加
      if (answerData.candidates) {
        for (const candidate of answerData.candidates) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (error) {
      console.error('Answer設定エラー:', error);
      alert('Answerの設定に失敗しました');
    }
  };

  // メッセージ送信
  const sendMessage = () => {
    if (!dataChannel || channelState !== 'open') {
      alert('データチャネルが開いていません');
      return;
    }

    if (!inputMessage.trim()) {
      return;
    }

    try {
      dataChannel.send(inputMessage);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'me',
          text: inputMessage,
          timestamp: new Date(),
        },
      ]);
      setInputMessage('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
    }
  };

  // ファイル送信のサンプル
  const sendFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!dataChannel || channelState !== 'open') {
      alert('データチャネルが開いていません');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // ファイルを読み込んで送信
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // ファイル情報を先に送信
      const fileInfo = JSON.stringify({
        type: 'file-info',
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      dataChannel.send(fileInfo);

      // ファイルデータを送信（チャンクに分割して送信）
      const chunkSize = 16384; // 16KB
      for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
        const chunk = uint8Array.slice(offset, offset + chunkSize);
        dataChannel.send(chunk);
      }

      // 送信完了を通知
      dataChannel.send(JSON.stringify({ type: 'file-complete' }));

      setMessages((prev) => [
        ...prev,
        {
          sender: 'me',
          text: `📎 ファイル送信: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('ファイル送信エラー:', error);
      alert('ファイルの送信に失敗しました');
    }

    // inputをリセット
    event.target.value = '';
  };

  // メッセージリストの自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (dataChannel) {
        dataChannel.close();
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [dataChannel, peerConnection]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        WebRTC データチャネル通信 (TURNサーバーなし)
      </h1>

      <div
        style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffc107',
        }}
      >
        <strong>注意:</strong> TURNサーバーを使用していないため、同じネットワーク内か、
        NATトラバーサルが可能な環境でのみ動作します。
      </div>

      {isConnected && (
        <div
          style={{
            backgroundColor: '#d4edda',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #28a745',
          }}
        >
          ✓ データチャネル接続完了（状態: {channelState}）
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Offer側 */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            接続を開始する側（Offer）
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              1. Offerを作成
            </h3>
            <button
              onClick={createOffer}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              Offerを作成
            </button>
            {offer && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  このOfferを相手に送信:
                </label>
                <textarea
                  value={offer}
                  readOnly
                  style={{
                    width: '100%',
                    height: '150px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(offer);
                    alert('クリップボードにコピーしました');
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '5px 15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  コピー
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              3. 相手のAnswerを受信
            </h3>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              相手のAnswerを貼り付け:
            </label>
            <textarea
              value={remoteAnswer}
              onChange={(e) => setRemoteAnswer(e.target.value)}
              placeholder="相手から受け取ったAnswerをここに貼り付けてください"
              style={{
                width: '100%',
                height: '150px',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '10px',
              }}
            />
            <button
              onClick={setRemoteAnswerData}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Answerを設定して接続
            </button>
          </div>
        </div>

        {/* Answer側 */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            接続を受ける側（Answer）
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              1. 相手のOfferを受信
            </h3>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              相手のOfferを貼り付け:
            </label>
            <textarea
              value={remoteOffer}
              onChange={(e) => setRemoteOffer(e.target.value)}
              placeholder="相手から受け取ったOfferをここに貼り付けてください"
              style={{
                width: '100%',
                height: '150px',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
              }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              2. Answerを作成
            </h3>
            <button
              onClick={createAnswer}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              Answerを作成
            </button>
            {answer && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  このAnswerを相手に送信:
                </label>
                <textarea
                  value={answer}
                  readOnly
                  style={{
                    width: '100%',
                    height: '150px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(answer);
                    alert('クリップボードにコピーしました');
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '5px 15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  コピー
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* チャットエリア */}
      <div style={{ border: '1px solid #ddd', borderRadius: '5px', marginTop: '20px' }}>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>チャット</h2>
        </div>

        <div
          style={{
            height: '400px',
            overflowY: 'auto',
            padding: '15px',
            backgroundColor: '#ffffff',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '50px' }}>
              メッセージはまだありません
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    backgroundColor: msg.sender === 'me' ? '#007bff' : '#e9ecef',
                    color: msg.sender === 'me' ? 'white' : 'black',
                  }}
                >
                  <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '5px',
                      opacity: 0.7,
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            padding: '15px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="メッセージを入力..."
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected}
              style={{
                padding: '10px 30px',
                backgroundColor: isConnected ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
              }}
            >
              送信
            </button>
          </div>

          <div>
            <label
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                backgroundColor: isConnected ? '#28a745' : '#6c757d',
                color: 'white',
                borderRadius: '5px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
              }}
            >
              📎 ファイルを送信
              <input
                type="file"
                onChange={sendFile}
                disabled={!isConnected}
                style={{ display: 'none' }}
              />
            </label>
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
              ※ ファイル送信機能はサンプル実装です
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>使い方</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>接続を開始する側が「Offerを作成」ボタンをクリック</li>
          <li>生成されたOfferをコピーして、相手に送信（チャット、メールなど）</li>
          <li>受け取った側がOfferを貼り付けて「Answerを作成」ボタンをクリック</li>
          <li>生成されたAnswerをコピーして、Offer側に送信</li>
          <li>Offer側がAnswerを貼り付けて「Answerを設定して接続」ボタンをクリック</li>
          <li>接続完了後、メッセージやファイルを送受信できます</li>
        </ol>

        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>
          データチャネルの特徴
        </h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>テキストメッセージの送受信が可能</li>
          <li>バイナリデータ（ファイルなど）の送受信が可能</li>
          <li>低遅延でリアルタイム通信が可能</li>
          <li>順序保証や信頼性の設定が可能</li>
          <li>ビデオやオーディオなしでP2P通信が可能</li>
        </ul>
      </div>
    </div>
  );
}
