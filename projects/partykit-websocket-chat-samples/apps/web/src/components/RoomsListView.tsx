'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ChatView from '@/components/ChatView';
import RoomModal from '@/components/RoomModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Room } from '@chat-app/shared';

export default function RoomsListView() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchRooms = useCallback(() => {
    setLoading(true);
    api.rooms
      .list()
      .then((r) => setRooms(r.data))
      .catch(() => setError('ルームの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  if (roomId) {
    return <ChatView roomId={roomId} />;
  }

  async function handleDelete(id: string) {
    try {
      await api.rooms.delete(id);
      fetchRooms();
      setDeleteConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>ルーム一覧</h1>
          <p>チャットルームを選択してください</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} type="button">
          + 新しいルーム
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px 24px' }}>
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>ルームがありません</h3>
          <p>最初のルームを作成してみましょう</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} type="button">
            ルームを作成
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="room-card">
              {/* /rooms?id=xxx でチャット画面に遷移 */}
              <div style={{ cursor: 'pointer' }} onClick={() => router.push(`/rooms?id=${room.id}`)}>
                <div className="room-card-name">#{room.name}</div>
                <div className="room-card-desc">{room.description || '説明なし'}</div>
              </div>
              <div className="room-card-footer">
                <span className="badge">チャット</span>
                {user?.id === room.createdBy && (
                  <div className="room-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditRoom(room)} title="編集" type="button">
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteConfirm(room.id)}
                      title="削除"
                      type="button"
                      style={{ color: 'var(--danger)' }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <RoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchRooms();
            setShowCreate(false);
          }}
        />
      )}
      {editRoom && (
        <RoomModal
          editRoom={editRoom}
          onClose={() => setEditRoom(null)}
          onCreated={() => {}}
          onUpdated={() => {
            fetchRooms();
            setEditRoom(null);
          }}
        />
      )}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ルームを削除</h3>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>このルームを削除しますか？メッセージもすべて削除されます。</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} type="button">
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} type="button">
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
