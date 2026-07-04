import { Component, Input, Output, EventEmitter, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../services/room.service';
import type { Room } from '@chat-app/shared';

@Component({
  selector: 'app-room-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlay($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editRoom ? 'ルームを編集' : 'ルームを作成' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="close.emit()" type="button">✕</button>
        </div>
        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <div class="field">
            <label class="label" for="rname">ルーム名</label>
            <input id="rname" class="input" type="text" placeholder="general" [(ngModel)]="name" name="name" required />
          </div>
          <div class="field" style="margin-top:16px">
            <label class="label" for="rdesc">説明（任意）</label>
            <input id="rdesc" class="input" type="text" placeholder="このルームの目的" [(ngModel)]="description" name="description" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" (click)="close.emit()">キャンセル</button>
            <button class="btn btn-primary" type="submit" [disabled]="loading()">
              {{ loading() ? '保存中...' : editRoom ? '更新' : '作成' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RoomModalComponent implements OnInit {
  @Input() editRoom?: Room;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private roomService = inject(RoomService);
  name = '';
  description = '';
  error = signal('');
  loading = signal(false);

  ngOnInit() {
    if (this.editRoom) {
      this.name = this.editRoom.name;
      this.description = this.editRoom.description ?? '';
    }
  }
  onOverlay(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close.emit();
  }

  async submit() {
    if (!this.name.trim()) return;
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.editRoom) await this.roomService.update(this.editRoom.id, { name: this.name, description: this.description || undefined });
      else await this.roomService.create({ name: this.name, description: this.description || undefined });
      this.saved.emit();
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : '失敗しました');
    } finally {
      this.loading.set(false);
    }
  }
}
