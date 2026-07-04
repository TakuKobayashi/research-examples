'use client';

import { useState, useRef, useEffect } from 'react';

export default function VideoChat() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [remoteOffer, setRemoteOffer] = useState<string>('');
  const [remoteAnswer, setRemoteAnswer] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ICE候補を収集するためのバッファ
  const iceCandidatesBuffer = useRef<RTCIceCandidate[]>([]);

  // WebRTC設定（STUNサーバーのみ使用、TURNなし）
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // カメラとマイクの起動
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('メディアデバイスへのアクセスエラー:', error);
      alert('カメラ・マイクへのアクセスに失敗しました');
    }
  };

  // Offer側の処理（通話を開始する側）
  const createOffer = async () => {
    if (!localStream) {
      alert('先にカメラを起動してください');
      return;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    setPeerConnection(pc);

    // ローカルストリームをPeerConnectionに追加
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // リモートストリームの受信
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

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
      setIsConnected(pc.connectionState === 'connected');
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
    if (!localStream) {
      alert('先にカメラを起動してください');
      return;
    }

    if (!remoteOffer) {
      alert('相手のOfferを入力してください');
      return;
    }

    try {
      const offerData = JSON.parse(remoteOffer);
      const pc = new RTCPeerConnection(rtcConfig);
      setPeerConnection(pc);

      // ローカルストリームをPeerConnectionに追加
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // リモートストリームの受信
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // 接続状態の監視
      pc.onconnectionstatechange = () => {
        console.log('接続状態:', pc.connectionState);
        setIsConnected(pc.connectionState === 'connected');
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

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [localStream, peerConnection]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        WebRTC ビデオチャット (TURNサーバーなし)
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
          ✓ 接続完了
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
          1. カメラ・マイクの起動
        </h2>
        <button
          onClick={startLocalStream}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          カメラを起動
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            自分の映像
          </h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              backgroundColor: '#000',
              borderRadius: '5px',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            相手の映像
          </h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              backgroundColor: '#000',
              borderRadius: '5px',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Offer側 */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            通話を開始する側（Offer）
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              2. Offerを作成
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
              4. 相手のAnswerを受信
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
            通話を受ける側（Answer）
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              2. 相手のOfferを受信
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
              3. Answerを作成
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

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>使い方</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>両方のユーザーが「カメラを起動」ボタンをクリック</li>
          <li>通話を開始する側が「Offerを作成」ボタンをクリック</li>
          <li>生成されたOfferをコピーして、相手に送信（チャット、メールなど）</li>
          <li>受け取った側がOfferを貼り付けて「Answerを作成」ボタンをクリック</li>
          <li>生成されたAnswerをコピーして、Offer側に送信</li>
          <li>Offer側がAnswerを貼り付けて「Answerを設定して接続」ボタンをクリック</li>
          <li>接続完了！</li>
        </ol>
      </div>
    </div>
  );
}
