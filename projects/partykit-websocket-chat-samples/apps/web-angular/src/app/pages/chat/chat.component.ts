import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  signal,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppShellComponent } from '../../components/app-shell/app-shell.component';
import { RoomModalComponent } from '../../components/room-modal/room-modal.component';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import type { Message, Room } from '@chat-app/shared';

type Status = 'disconnected' | 'connecting' | 'connected';
interface SystemMsg {
  id: string;
  text: string;
  kind: 'system';
}
type ChatItem = Message | SystemMsg;
function isSystem(i: ChatItem): i is SystemMsg {
  return (i as SystemMsg).kind === 'system';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AppShellComponent, RoomModalComponent],
  template: `
    <app-shell>
      <div class="chat-layout">
        <div class="chat-header">
          <div style="flex:1">
            <h2>#{{ room()?.name ?? roomId }}</h2>
            @if (room()?.description) {
              <p style="font-size:13px;color:var(--text-2)">{{ room()?.description }}</p>
            }
          </div>
          <div class="connection-status" [class]="statusClass()">
            <div class="status-dot"></div>
            {{ statusLabel() }}
          </div>
          @if (auth.user()?.id === room()?.createdBy) {
            <button class="btn btn-ghost btn-sm" (click)="showEdit.set(true)" type="button">✏️</button>
            <button class="btn btn-ghost btn-sm" (click)="showDelete.set(true)" type="button" style="color:var(--danger)">🗑️</button>
          }
          @if (status() === 'connected') {
            <button class="btn btn-secondary btn-sm" (click)="disconnect()" type="button">切断</button>
          } @else {
            <button
              class="btn btn-primary btn-sm"
              (click)="connect(wsUrl())"
              [disabled]="!wsUrl() || status() === 'connecting'"
              type="button"
            >
              接続
            </button>
          }
        </div>

        <div class="ws-connect-bar">
          <span class="ws-url-label">WS URL:</span>
          <input
            class="input"
            [ngModel]="editUrl()"
            (ngModelChange)="editUrl.set($event)"
            placeholder="ws://localhost:8787/ws/room-id"
            (keydown.enter)="applyUrl()"
            style="font-size:12px;padding:6px 10px"
          />
          <button class="btn btn-secondary btn-sm" (click)="applyUrl()" type="button">接続</button>
        </div>

        <div class="messages-container" #msgContainer>
          @if (items().length === 0 && status() === 'connected') {
            <div class="empty-state">
              <div class="empty-state-icon">💬</div>
              <h3>まだメッセージはありません</h3>
              <p>最初のメッセージを送ってみましょう</p>
            </div>
          }
          @for (group of grouped(); track group.key) {
            @if (group.isSystem) {
              @for (item of group.items; track item.id) {
                <div class="system-message">{{ asSystem(item).text }}</div>
              }
            } @else {
              <div class="message-row" [class.own]="group.isOwn">
                @if (!group.isOwn) {
                  <div class="msg-avatar">{{ group.initials }}</div>
                }
                <div class="msg-content">
                  <div class="msg-meta">
                    @if (!group.isOwn) {
                      <strong>{{ asMsg(group.items[0]).displayName }} </strong>
                    }
                    {{ fmt(asMsg(group.items[0]).createdAt) }}
                  </div>
                  @for (item of group.items; track item.id) {
                    <div class="msg-bubble" [class]="group.isOwn ? 'own' : 'other'">{{ asMsg(item).content }}</div>
                  }
                </div>
              </div>
            }
          }
          <div #msgEnd></div>
        </div>

        <div class="chat-input-area">
          <div class="chat-input-row">
            <textarea
              class="input"
              [(ngModel)]="inputText"
              [placeholder]="
                status() === 'connected' ? '#' + (room()?.name ?? '...') + ' にメッセージを送信 (Enter で送信)' : '接続していません'
              "
              (keydown)="onKey($event)"
              [disabled]="status() !== 'connected'"
              rows="1"
            ></textarea>
            <button class="btn btn-primary" (click)="send()" [disabled]="!inputText.trim() || status() !== 'connected'" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </app-shell>

    @if (showEdit() && room()) {
      <app-room-modal [editRoom]="room()!" (close)="showEdit.set(false)" (saved)="onRoomUpdated()" />
    }
    @if (showDelete()) {
      <div class="modal-overlay" (click)="showDelete.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>ルームを削除</h3></div>
          <p style="color:var(--text-2);font-size:14px">このルームとすべてのメッセージを削除しますか？</p>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDelete.set(false)" type="button">キャンセル</button>
            <button class="btn btn-danger" (click)="deleteRoom()" type="button">削除する</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgEnd') private msgEnd!: ElementRef;
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomService = inject(RoomService);

  roomId = '';
  room = signal<Room | null>(null);
  items = signal<ChatItem[]>([]);
  inputText = '';
  wsUrl = signal('');
  editUrl = signal('');
  status = signal<Status>('disconnected');
  showEdit = signal(false);
  showDelete = signal(false);
  private ws: WebSocket | null = null;
  private ping: ReturnType<typeof setInterval> | null = null;
  private scrollPending = false;

  statusLabel = () => ({ connected: '接続中', connecting: '接続中...', disconnected: '未接続' })[this.status()];
  statusClass = () =>
    `connection-status status-${this.status() === 'connected' ? 'connected' : this.status() === 'connecting' ? 'connecting' : 'disconnected'}`;

  grouped = () => {
    const g: { key: string; isSystem: boolean; isOwn: boolean; initials: string; items: ChatItem[] }[] = [];
    for (const item of this.items()) {
      if (isSystem(item)) {
        g.push({ key: item.id, isSystem: true, isOwn: false, initials: '', items: [item] });
      } else {
        const m = item as Message;
        const last = g[g.length - 1];
        if (last && !last.isSystem && (last.items[0] as Message).userId === m.userId) last.items.push(item);
        else
          g.push({
            key: m.id,
            isSystem: false,
            isOwn: m.userId === this.auth.user()?.id,
            initials: m.displayName.slice(0, 2).toUpperCase(),
            items: [item],
          });
      }
    }
    return g;
  };

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') ?? '';
    this.roomService
      .get(this.roomId)
      .then((r) => this.room.set(r))
      .catch(() => {});
    const token = this.auth.getToken();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/ws/${this.roomId}?token=${token}`;
    this.wsUrl.set(url);
    this.editUrl.set(url);
    this.connect(url);
    this.ping = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'ping' }));
    }, 25_000);
  }

  ngAfterViewChecked() {
    if (this.scrollPending) {
      this.msgEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.scrollPending = false;
    }
  }

  ngOnDestroy() {
    if (this.ping) clearInterval(this.ping);
    this.ws?.close();
  }

  connect(url: string) {
    if (!url) return;
    this.ws?.close();
    this.status.set('connecting');
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      this.status.set('connected');
      this.addSys('接続しました');
    };
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.type === 'history') this.items.set([...m.data]);
        else if (m.type === 'message') this.items.update((p) => [...p, m.data]);
        else if (m.type === 'join') this.addSys(`${m.data.displayName} が参加しました`);
        else if (m.type === 'leave') this.addSys(`${m.data.displayName} が退出しました`);
        this.scrollPending = true;
      } catch {}
    };
    ws.onclose = () => {
      this.status.set('disconnected');
      this.ws = null;
    };
    ws.onerror = () => this.status.set('disconnected');
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.status.set('disconnected');
    this.addSys('切断しました');
  }
  applyUrl() {
    this.wsUrl.set(this.editUrl());
    this.connect(this.editUrl());
  }

  send() {
    if (!this.inputText.trim() || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'message', content: this.inputText.trim() }));
    this.inputText = '';
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
  addSys(text: string) {
    this.items.update((p) => [...p, { id: crypto.randomUUID(), text, kind: 'system' }]);
    this.scrollPending = true;
  }
  fmt(iso: string) {
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
  asSystem(i: ChatItem) {
    return i as SystemMsg;
  }
  asMsg(i: ChatItem) {
    return i as Message;
  }

  async onRoomUpdated() {
    this.showEdit.set(false);
    const r = await this.roomService.get(this.roomId).catch(() => null);
    if (r) this.room.set(r);
  }
  async deleteRoom() {
    await this.roomService.delete(this.roomId);
    this.router.navigate(['/rooms']);
  }
}
