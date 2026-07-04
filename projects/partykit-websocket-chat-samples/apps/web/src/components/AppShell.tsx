'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Room } from '@chat-app/shared';
import RoomModal from './RoomModal';

interface Props {
  children: React.ReactNode;
  currentRoomId?: string;
}

export default function AppShell({ children, currentRoomId }: Props) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadRooms = useCallback(() => {
    api.rooms
      .list()
      .then((r) => setRooms(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadRooms();
  }, [user, loadRooms]);

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-dot" />
            ChatApp
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">ルーム</div>
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room-item ${currentRoomId === room.id ? 'active' : ''}`}
              onClick={() => router.push(`/rooms?id=${room.id}`)}
              type="button"
            >
              <span className="room-item-icon">#</span>
              <span className="room-item-name">{room.name}</span>
            </button>
          ))}
          <button className="room-item" style={{ color: 'var(--accent)', marginTop: 4 }} onClick={() => setShowModal(true)} type="button">
            <span className="room-item-icon">+</span>
            <span className="room-item-name">新しいルーム</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user.displayName}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              title="ログアウト"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">{children}</div>

      {showModal && (
        <RoomModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            loadRooms();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
