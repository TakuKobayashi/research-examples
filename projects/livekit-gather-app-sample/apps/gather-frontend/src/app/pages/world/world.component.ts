// apps/gather-frontend/src/app/pages/world/world.component.ts
import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '@env/environment';
import { LiveKitService, type RemoveLiveKitListener } from '../../services/livekit.service';
import { PartyKitService, type RemotePlayer } from '../../services/partykit.service';
import { PROXIMITY } from '@gather/shared';
import { type RemoteTrack, type RemoteParticipant } from 'livekit-client';

interface Config {
  displayName: string;
  roomName:    string;
  livekitUrl:  string;
  apiBaseUrl:  string;
  partyHost:   string;
}

interface ChatParticipant {
  identity: string;
}

// ============================================================
// WorldComponent
//
// standalone component として定義。
// LiveKitService / PartyKitService は inject() で取得。
// pages/ 以下に置く他のコンポーネントでも同様に
//   private liveKit = inject(LiveKitService);
// または
//   constructor(private liveKit: LiveKitService) {}
// で利用できる。
// ============================================================
@Component({
  selector: 'app-world',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './world.component.html',
  styleUrl: './world.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldComponent implements OnInit, AfterViewChecked, OnDestroy {

  // inject() API (Angular 14+) でサービスを取得
  private liveKit  = inject(LiveKitService);
  private partyKit = inject(PartyKitService);
  private cdr      = inject(ChangeDetectorRef);

  @ViewChild('worldCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // --- テンプレートバインディング ---
  started     = false;
  starting    = false;
  connecting  = false;
  chatConnected    = false;
  participants: ChatParticipant[] = [];
  nearbyName: string | null = null;
  micMuted    = false;
  camOff      = false;
  errorMsg: string | null = null;
  playerCount = 1;

  cfg: Config = {
    displayName: 'Player' + Math.floor(Math.random() * 100),
    roomName:    'world-1',
    livekitUrl:  environment.livekitUrl,
    apiBaseUrl:  environment.apiBaseUrl,
    partyHost:   environment.partyHost,
  };

  // --- 内部状態 ---
  private worldInitialized = false;  // initWorld() の二重呼び出しを防ぐフラグ
  private canvas!: HTMLCanvasElement;
  private ctx!:    CanvasRenderingContext2D;
  private raf  = 0;
  private keys: Record<string, boolean> = {};
  private myPlayer = { x: 0, y: 0, name: '' };

  private proxConnected  = false;
  private manualDisc     = false;
  private lastNearbyId: string | null = null;
  private lastSentPos    = { x: -1, y: -1 };

  private removeLiveKitListeners: RemoveLiveKitListener[] = [];

  private readonly SPEED = 3.2;
  private readonly GRID  = 48;

  // ============================================================
  // ライフサイクル
  // ============================================================
  ngOnInit(): void {
    // LiveKitService に callback を登録する。
    // 戻り値は登録解除用の関数なので、ngOnDestroy() でまとめて呼ぶ。
    this.removeLiveKitListeners = [
      this.liveKit.onParticipantConnected(p => {
        this.onParticipantConnected(p);
      }),
      this.liveKit.onParticipantDisconnected(p => {
        this.participants = this.participants.filter(x => x.identity !== p.identity);
        this.cdr.markForCheck();
      }),
      this.liveKit.onTrackSubscribed(({ track, participant }) => {
        this.onTrackSubscribed(track, participant);
      }),
      this.liveKit.onTrackUnsubscribed(track => track.detach()),
      this.liveKit.onDisconnected(() => {
        this.chatConnected = false;
        this.participants  = [];
        this.proxConnected = false;
        this.cdr.markForCheck();
      }),
    ];
  }

  ngOnDestroy(): void {
    this.removeLiveKitListeners.forEach(remove => remove());
    this.removeLiveKitListeners = [];
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup',   this.onKey);
    window.removeEventListener('resize',  this.onResize);
    this.liveKit.disconnect();
    this.partyKit.disconnect();
  }

  // ============================================================
  // セットアップ
  // ============================================================
  start(): void {
    if (!this.cfg.displayName) this.cfg.displayName = 'Player';
    this.myPlayer.name = this.cfg.displayName;
    this.started = true;
    this.cdr.markForCheck();
    // initWorld() は ngAfterViewChecked で canvas が DOM に現れてから呼ぶ
  }

  // @if (started) で canvas が DOM に追加された後に呼ばれる
  // canvasRef が使えるようになったタイミングで一度だけ initWorld() を実行する
  ngAfterViewChecked(): void {
    if (this.started && !this.worldInitialized && this.canvasRef?.nativeElement) {
      this.worldInitialized = true;
      this.initWorld();
    }
  }

  // ============================================================
  // コントロール
  // ============================================================
  manualDisconnect(): void {
    this.manualDisc    = true;
    this.proxConnected = false;
    this.doDisconnect();
  }

  toggleMic(): void {
    this.micMuted = !this.micMuted;
    this.liveKit.setMicEnabled(!this.micMuted);
    this.cdr.markForCheck();
  }

  toggleCam(): void {
    this.camOff = !this.camOff;
    this.liveKit.setCamEnabled(!this.camOff);
    this.cdr.markForCheck();
  }

  // ============================================================
  // ワールド初期化
  // ============================================================
  private initWorld(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx    = this.canvas.getContext('2d')!;
    this.onResize();

    this.myPlayer.x = this.canvas.width  / 2;
    this.myPlayer.y = this.canvas.height / 2;

    this.partyKit.connect(
      this.cfg.partyHost,
      this.cfg.roomName,
      this.cfg.displayName + '-' + Date.now(),
      this.cfg.displayName,
      this.myPlayer.x,
      this.myPlayer.y,
    );

    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup',   this.onKey);
    window.addEventListener('resize',  this.onResize);

    let prev = 0;
    const loop = (ts: number) => {
      const dt = Math.min((ts - prev) / 16.67, 3);
      prev = ts;
      this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private onKey = (e: KeyboardEvent) => {
    this.keys[e.key] = e.type === 'keydown';
  };

  private onResize = () => {
    if (!this.canvas) return;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  // ============================================================
  // ゲームループ
  // ============================================================
  private tick(dt: number): void {
    if (this.keys['ArrowLeft']  || this.keys['a'] || this.keys['A']) this.myPlayer.x -= this.SPEED * dt;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.myPlayer.x += this.SPEED * dt;
    if (this.keys['ArrowUp']    || this.keys['w'] || this.keys['W']) this.myPlayer.y -= this.SPEED * dt;
    if (this.keys['ArrowDown']  || this.keys['s'] || this.keys['S']) this.myPlayer.y += this.SPEED * dt;

    this.myPlayer.x = Math.max(24, Math.min(this.canvas.width  - 24, this.myPlayer.x));
    this.myPlayer.y = Math.max(24, Math.min(this.canvas.height - 24, this.myPlayer.y));

    const dx = this.myPlayer.x - this.lastSentPos.x;
    const dy = this.myPlayer.y - this.lastSentPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 2) {
      this.partyKit.sendPosition(this.myPlayer.x, this.myPlayer.y);
      this.lastSentPos = { ...this.myPlayer };
    }

    this.proximityCheck();
    this.draw();
  }

  // ============================================================
  // 近接チェック
  // ============================================================
  private proximityCheck(): void {
    const others = this.partyKit.getPlayers();
    const newCount = 1 + others.length;
    if (newCount !== this.playerCount) {
      this.playerCount = newCount;
      this.cdr.markForCheck();
    }

    let nearest: RemotePlayer | null = null;
    let nearestDist = Infinity;
    for (const p of others) {
      const d = this.dist2d(this.myPlayer, p);
      if (d < nearestDist) { nearestDist = d; nearest = p; }
    }

    const newNearby = (nearest && nearestDist < PROXIMITY.TOAST_DIST && !this.proxConnected)
      ? nearest.displayName : null;
    if (newNearby !== this.lastNearbyId) {
      this.lastNearbyId = newNearby;
      this.nearbyName   = newNearby;
      this.cdr.markForCheck();
    }

    if (!this.proxConnected && !this.connecting && !this.manualDisc
        && nearest && nearestDist < PROXIMITY.CONNECT_DIST) {
      this.proxConnected = true;
      this.doConnect();
      return;
    }

    if (this.proxConnected && nearestDist > PROXIMITY.DISCONNECT_DIST) {
      this.proxConnected = false;
      this.manualDisc    = false;
      this.doDisconnect();
    }
  }

  private dist2d(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // ============================================================
  // LiveKit 接続 / 切断
  // ============================================================
  private async doConnect(): Promise<void> {
    this.connecting = true;
    this.errorMsg   = null;
    this.cdr.markForCheck();

    try {
      const token = await this.fetchToken();
      await this.liveKit.connect(this.cfg.livekitUrl, token);

      this.chatConnected = true;
      this.nearbyName    = null;
      this.connecting    = false;
      this.cdr.markForCheck();

      // ローカルビデオを video 要素にアタッチ
      // テンプレートが更新されるのを 1 フレーム待つ
      requestAnimationFrame(() => {
        const track = this.liveKit.getLocalVideoTrack();
        const el    = document.getElementById('local-video') as HTMLVideoElement | null;
        if (track && el) track.attach(el);
      });

    } catch (err) {
      this.proxConnected = false;
      this.connecting    = false;
      this.nearbyName    = null;
      this.showError('接続に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  private async doDisconnect(): Promise<void> {
    await this.liveKit.disconnect();
    this.chatConnected = false;
    this.participants  = [];
    this.connecting    = false;
    this.micMuted      = false;
    this.camOff        = false;
    this.cdr.markForCheck();
  }

  private async fetchToken(): Promise<string> {
    const url = `${this.cfg.apiBaseUrl}/api/token`
      + `?room=${encodeURIComponent(this.cfg.roomName)}`
      + `&identity=${encodeURIComponent(this.cfg.displayName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { token: string }).token;
  }

  // ============================================================
  // LiveKit イベント処理
  // ============================================================
  private onParticipantConnected(p: RemoteParticipant): void {
    if (!this.participants.some(x => x.identity === p.identity)) {
      this.participants = [...this.participants, { identity: p.identity }];
      this.cdr.markForCheck();
    }
  }

  private onTrackSubscribed(track: RemoteTrack, participant: RemoteParticipant): void {
    const id = participant.identity;
    if (!this.participants.some(x => x.identity === id)) {
      this.participants = [...this.participants, { identity: id }];
      this.cdr.markForCheck();
    }

    // DOM 生成を 1 フレーム待ってからアタッチ
    requestAnimationFrame(() => {
      const elId = track.kind === 'video' ? `rv-${id}` : `ra-${id}`;
      const el   = document.getElementById(elId) as HTMLVideoElement | HTMLAudioElement | null;
      if (el) track.attach(el);
    });
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    this.cdr.markForCheck();
    setTimeout(() => { this.errorMsg = null; this.cdr.markForCheck(); }, 5000);
  }

  // ============================================================
  // Canvas 描画
  // ============================================================
  private draw(): void {
    const W = this.canvas.width, H = this.canvas.height;
    this.ctx.clearRect(0, 0, W, H);
    this.ctx.fillStyle = '#0f0f1a';
    this.ctx.fillRect(0, 0, W, H);

    // グリッド
    this.ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    this.ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += this.GRID) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, H); this.ctx.stroke();
    }
    for (let y = 0; y < H; y += this.GRID) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(W, y); this.ctx.stroke();
    }

    this.drawDecorations(W, H);

    const others = this.partyKit.getPlayers();
    for (const p of others) {
      const d = this.dist2d(this.myPlayer, p);
      this.drawProximityRing(p, d);
      this.drawAvatar(p.x, p.y, p.displayName, p.color, false);
      this.drawDistLabel(d);
    }

    this.drawAvatar(this.myPlayer.x, this.myPlayer.y, this.myPlayer.name, '#4e54c8', true);

    if (this.chatConnected) {
      this.ctx.fillStyle   = '#2ecc71';
      this.ctx.shadowColor = '#2ecc71';
      this.ctx.shadowBlur  = 8;
      this.ctx.beginPath();
      this.ctx.arc(this.myPlayer.x + 16, this.myPlayer.y - 16, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private drawProximityRing(p: RemotePlayer, d: number): void {
    if (d > PROXIMITY.TOAST_DIST * 1.2) return;
    const connected = d < PROXIMITY.CONNECT_DIST;

    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, PROXIMITY.CONNECT_DIST, 0, Math.PI * 2);
    this.ctx.fillStyle = connected ? 'rgba(78,84,200,0.10)' : 'rgba(255,255,255,0.02)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, PROXIMITY.CONNECT_DIST, 0, Math.PI * 2);
    this.ctx.strokeStyle = connected ? 'rgba(78,84,200,0.55)' : 'rgba(255,255,255,0.12)';
    this.ctx.lineWidth   = 1.5;
    this.ctx.setLineDash([6, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawDistLabel(d: number): void {
    if (d > PROXIMITY.TOAST_DIST) return;
    const others = this.partyKit.getPlayers();
    if (!others.length) return;
    const p  = others[0];
    const mx = (this.myPlayer.x + p.x) / 2;
    const my = (this.myPlayer.y + p.y) / 2;
    this.ctx.fillStyle = d < PROXIMITY.CONNECT_DIST ? 'rgba(120,130,255,0.9)' : 'rgba(255,255,255,0.3)';
    this.ctx.font      = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.round(d)}px`, mx, my - 8);
    this.ctx.textAlign = 'left';
  }

  private drawAvatar(x: number, y: number, name: string, color: string, isMe: boolean): void {
    const r = isMe ? 22 : 18;
    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur  = isMe ? 22 : 10;
    this.ctx.fillStyle   = color;
    this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.restore();

    this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.strokeStyle = isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)';
    this.ctx.lineWidth   = isMe ? 2.5 : 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle    = '#fff';
    this.ctx.font         = `bold ${isMe ? 13 : 12}px sans-serif`;
    this.ctx.textAlign    = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(name.charAt(0).toUpperCase(), x, y);
    this.ctx.textBaseline = 'alphabetic';

    this.ctx.font = `${isMe ? 12 : 11}px sans-serif`;
    const tagW = this.ctx.measureText(name).width + 16;
    this.ctx.fillStyle = 'rgba(0,0,0,0.68)';
    this.roundRect(x - tagW / 2, y + r + 4, tagW, 18, 4);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(name, x, y + r + 17);
    this.ctx.textAlign = 'left';
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y); this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
  }

  private drawDecorations(W: number, H: number): void {
    const tables = [
      { x: 160, y: 160 }, { x: W - 160, y: 160 },
      { x: 160, y: H - 160 }, { x: W - 160, y: H - 160 },
    ];
    for (const t of tables) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.04)';
      this.ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      this.ctx.lineWidth = 1;
      this.roundRect(t.x - 38, t.y - 26, 76, 52, 8);
      this.ctx.fill(); this.ctx.stroke();
    }
    const plants = [
      { x: 80, y: 80 }, { x: W - 80, y: 80 },
      { x: 80, y: H - 80 }, { x: W - 80, y: H - 80 },
    ];
    for (const p of plants) {
      this.ctx.fillStyle = 'rgba(46,204,113,0.12)';
      this.ctx.strokeStyle = 'rgba(46,204,113,0.3)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
      this.ctx.fill(); this.ctx.stroke();
      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('🌿', p.x, p.y);
      this.ctx.textBaseline = 'alphabetic'; this.ctx.textAlign = 'left';
    }
  }
}
