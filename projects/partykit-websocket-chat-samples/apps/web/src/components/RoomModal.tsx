'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
  editRoom?: { id: string; name: string; description?: string };
  onUpdated?: () => void;
}

export default function RoomModal({ onClose, onCreated, editRoom, onUpdated }: Props) {
  const [name, setName] = useState(editRoom?.name ?? '');
  const [description, setDescription] = useState(editRoom?.description ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editRoom) {
        await api.rooms.update(editRoom.id, { name, description: description || undefined });
        onUpdated?.();
      } else {
        await api.rooms.create({ name, description: description || undefined });
        onCreated();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editRoom ? 'ルームを編集' : 'ルームを作成'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="room-name">
              ルーム名
            </label>
            <input
              id="room-name"
              className="input"
              type="text"
              placeholder="general"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="room-desc">
              説明（任意）
            </label>
            <input
              id="room-desc"
              className="input"
              type="text"
              placeholder="このルームの目的"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              キャンセル
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '保存中...' : editRoom ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
