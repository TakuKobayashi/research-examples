// apps/gather-frontend/src/app/services/livekit.service.ts
import { Injectable } from '@angular/core';
import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  DisconnectReason,
  type RemoteTrack,
  type RemoteParticipant,
} from 'livekit-client';

// ============================================================
// イベントの型定義
// ============================================================
export interface TrackSubscribedEvent {
  track:       RemoteTrack;
  participant: RemoteParticipant;
}

type EventHandler<T> = (event: T) => void;
export type RemoveLiveKitListener = () => void;

// ============================================================
// LiveKitService
//
// @Injectable({ providedIn: 'root' }) により、
// アプリ全体でシングルトンとして使用可能。
// pages/ 以下の任意の component から constructor DI で受け取れる。
//
// 使い方:
//   constructor(private liveKit: LiveKitService) {}
//
//   // 接続
//   await this.liveKit.connect(serverUrl, token);
//
//   // イベント購読
//   const remove = this.liveKit.onParticipantConnected(p => { ... });
//   remove(); // component 破棄時など、受け取りを止めたいタイミングで呼ぶ
// ============================================================
@Injectable({ providedIn: 'root' })
export class LiveKitService {

  private room: Room | null = null;

  // RxJS を使わず、通常の callback を Set で管理する。
  // Set にしておくと同じ関数の二重登録を避けられ、解除も delete() だけで済む。
  private readonly participantConnectedListeners = new Set<EventHandler<RemoteParticipant>>();
  private readonly participantDisconnectedListeners = new Set<EventHandler<RemoteParticipant>>();
  private readonly trackSubscribedListeners = new Set<EventHandler<TrackSubscribedEvent>>();
  private readonly trackUnsubscribedListeners = new Set<EventHandler<RemoteTrack>>();
  private readonly disconnectedListeners = new Set<EventHandler<DisconnectReason | undefined>>();

  onParticipantConnected(handler: EventHandler<RemoteParticipant>): RemoveLiveKitListener {
    return this.addListener(this.participantConnectedListeners, handler);
  }

  onParticipantDisconnected(handler: EventHandler<RemoteParticipant>): RemoveLiveKitListener {
    return this.addListener(this.participantDisconnectedListeners, handler);
  }

  onTrackSubscribed(handler: EventHandler<TrackSubscribedEvent>): RemoveLiveKitListener {
    return this.addListener(this.trackSubscribedListeners, handler);
  }

  onTrackUnsubscribed(handler: EventHandler<RemoteTrack>): RemoveLiveKitListener {
    return this.addListener(this.trackUnsubscribedListeners, handler);
  }

  onDisconnected(handler: EventHandler<DisconnectReason | undefined>): RemoveLiveKitListener {
    return this.addListener(this.disconnectedListeners, handler);
  }

  // ------------------------------------------------------------------
  // connect
  // serverUrl を切り替えるだけで Cloud / セルフホスト を変更できる:
  //   Cloud:      wss://your-app.livekit.cloud
  //   Oracle:     wss://your.oracle.ip:7880
  //   ローカル:   ws://localhost:7880
  // ------------------------------------------------------------------
  async connect(serverUrl: string, token: string): Promise<Room> {
    // 既存の接続が残っているとカメラ・マイクやイベントが二重に動くため、
    // 新しい Room を作る前に必ず切断する。
    await this.disconnect();

    // Room は LiveKit の通話ルームを表す中心オブジェクト。
    // adaptiveStream は表示中の映像だけを適切な品質で受け取り、
    // dynacast は相手側の受信状況に応じて送信する映像品質を調整する。
    this.room = new Room({
      adaptiveStream: true,
      dynacast:       true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h360.resolution,
      },
    });

    // LiveKit SDK のイベントを、このサービス独自の callback イベントへ変換する。
    // component 側は LiveKit SDK の RoomEvent を直接知らなくてよい。
    this.room
      .on(RoomEvent.ParticipantConnected,    (p)           => this.emit(this.participantConnectedListeners, p))
      .on(RoomEvent.ParticipantDisconnected, (p)           => this.emit(this.participantDisconnectedListeners, p))
      .on(RoomEvent.TrackSubscribed,         (track, _, p) => this.emit(this.trackSubscribedListeners, { track, participant: p }))
      .on(RoomEvent.TrackUnsubscribed,       (track)       => this.emit(this.trackUnsubscribedListeners, track))
      .on(RoomEvent.Disconnected,            (reason)      => {
        this.room = null;
        this.emit(this.disconnectedListeners, reason);
      });

    // Workers 側で発行された token を使って LiveKit Server に参加する。
    await this.room.connect(serverUrl, token);

    // 参加後にローカル参加者のカメラとマイクを有効化する。
    // ブラウザの権限ダイアログもこのタイミングで表示される。
    await this.room.localParticipant.enableCameraAndMicrophone();
    return this.room;
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      // disconnect() は RoomEvent.Disconnected を発火する。
      // そこで UI 側に切断イベントが通知され、参加者一覧などがクリアされる。
      try { await this.room.disconnect(); } catch { /* ignore */ }
      this.room = null;
    }
  }

  getRoom(): Room | null {
    return this.room;
  }

  getLocalVideoTrack() {
    if (!this.room) return null;
    // ローカル参加者が公開しているカメラ映像 Track を取得する。
    // component 側で video 要素に attach() して画面へ表示する。
    const pub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
    return pub?.track ?? null;
  }

  async setMicEnabled(enabled: boolean): Promise<void> {
    // LiveKit SDK がマイク Track の publish / mute 状態を切り替える。
    await this.room?.localParticipant.setMicrophoneEnabled(enabled);
  }

  async setCamEnabled(enabled: boolean): Promise<void> {
    // カメラを OFF にすると、相手には映像 Track が停止または mute として伝わる。
    await this.room?.localParticipant.setCameraEnabled(enabled);
  }

  private addListener<T>(listeners: Set<EventHandler<T>>, handler: EventHandler<T>): RemoveLiveKitListener {
    listeners.add(handler);
    return () => listeners.delete(handler);
  }

  private emit<T>(listeners: Set<EventHandler<T>>, event: T): void {
    for (const handler of listeners) {
      try {
        handler(event);
      } catch (err) {
        console.error('LiveKit event handler failed', err);
      }
    }
  }
}
