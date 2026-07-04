import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { AuthService } from '../../services/auth.service';
import { AppShellComponent } from '../../components/app-shell/app-shell.component';
import { RoomModalComponent } from '../../components/room-modal/room-modal.component';
import type { Room } from '@chat-app/shared';

@Component({
  selector: 'app-rooms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, AppShellComponent, RoomModalComponent],
  template: `
    <app-shell>
      <div class="page-header">
        <div>
          <h1>ルーム一覧</h1>
          <p>チャットルームを選択してください</p>
        </div>
        <button class="btn btn-primary" (click)="showCreate.set(true)" type="button">+ 新しいルーム</button>
      </div>

      @if (error()) {
        <div style="padding:16px 24px">
          <div class="alert alert-error">{{ error() }}</div>
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (rooms().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h3>ルームがありません</h3>
          <p>最初のルームを作成してみましょう</p>
          <button class="btn btn-primary" (click)="showCreate.set(true)" type="button">ルームを作成</button>
        </div>
      } @else {
        <div class="rooms-grid">
          @for (room of rooms(); track room.id) {
            <div class="room-card">
              <a [routerLink]="['/rooms', room.id]" style="text-decoration:none;display:block">
                <div class="room-card-name">#{{ room.name }}</div>
                <div class="room-card-desc">{{ room.description || '説明なし' }}</div>
              </a>
              <div class="room-card-footer">
                <span class="badge">チャット</span>
                @if (auth.user()?.id === room.createdBy) {
                  <div class="room-card-actions">
                    <button class="btn btn-ghost btn-sm" (click)="editRoom.set(room)" title="編集" type="button">✏️</button>
                    <button
                      class="btn btn-ghost btn-sm"
                      (click)="deleteConfirm.set(room.id)"
                      title="削除"
                      type="button"
                      style="color:var(--danger)"
                    >
                      🗑️
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </app-shell>

    @if (showCreate()) {
      <app-room-modal (close)="showCreate.set(false)" (saved)="onSaved()" />
    }
    @if (editRoom()) {
      <app-room-modal [editRoom]="editRoom()!" (close)="editRoom.set(undefined)" (saved)="onSaved(); editRoom.set(undefined)" />
    }
    @if (deleteConfirm()) {
      <div class="modal-overlay" (click)="deleteConfirm.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header"><h3>ルームを削除</h3></div>
          <p style="color:var(--text-2);font-size:14px">このルームを削除しますか？メッセージもすべて削除されます。</p>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deleteConfirm.set(null)" type="button">キャンセル</button>
            <button class="btn btn-danger" (click)="deleteRoom(deleteConfirm()!)" type="button">削除する</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RoomsComponent implements OnInit {
  auth = inject(AuthService);
  private roomService = inject(RoomService);
  rooms = signal<Room[]>([]);
  loading = signal(true);
  error = signal('');
  showCreate = signal(false);
  editRoom = signal<Room | undefined>(undefined);
  deleteConfirm = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }
  async load() {
    this.loading.set(true);
    try {
      this.rooms.set(await this.roomService.list());
    } catch {
      this.error.set('ルームの取得に失敗しました');
    } finally {
      this.loading.set(false);
    }
  }
  onSaved() {
    this.showCreate.set(false);
    this.load();
  }
  async deleteRoom(id: string) {
    try {
      await this.roomService.delete(id);
      this.deleteConfirm.set(null);
      this.load();
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : '削除に失敗しました');
    }
  }
}
