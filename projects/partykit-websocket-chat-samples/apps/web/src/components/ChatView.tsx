'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import RoomModal from '@/components/RoomModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { createRoomWebSocketUrl } from '@/lib/ws';
import type { Message, Room } from '@chat-app/shared';

type ConnStatus = 'disconnected' | 'connecting' | 'connected';
interface SystemMsg {
  id: string;
  text: string;
  kind: 'system';
}
type ChatItem = Message | SystemMsg;
function isSystem(item: ChatItem): item is SystemMsg {
  return (item as SystemMsg).kind === 'system';
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  roomId: string;
}

export default function ChatView({ roomId }: Props) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [status, setStatus] = useState<ConnStatus>('disconnected');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && roomId && token) {
      const url = createRoomWebSocketUrl(roomId, token);
      setWsUrl(url);
      setEditUrl(url);
    }
  }, [roomId, token]);

  useEffect(() => {
    if (roomId)
      api.rooms
        .get(roomId)
        .then((r) => setRoom(r.data))
        .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  const addSystem = useCallback((text: string) => {
    setItems((p) => [...p, { id: crypto.randomUUID(), text, kind: 'system' }]);
  }, []);

  const connect = useCallback(
    (url: string) => {
      if (!url) return;
      wsRef.current?.close();
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        setStatus('connected');
        addSystem('接続しました');
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'history') setItems(msg.data as Message[]);
          else if (msg.type === 'message') setItems((p) => [...p, msg.data as Message]);
          else if (msg.type === 'join') addSystem(`${msg.data.displayName} が参加しました`);
          else if (msg.type === 'leave') addSystem(`${msg.data.displayName} が退出しました`);
        } catch {}
      };
      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
      };
      ws.onerror = () => setStatus('disconnected');
    },
    [addSystem],
  );

  useEffect(() => {
    if (wsUrl) connect(wsUrl);
    return () => {
      wsRef.current?.close();
    };
  }, [wsUrl, connect]);

  useEffect(() => {
    const id = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }, 25_000);
    return () => clearInterval(id);
  }, []);

  function disconnect() {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
    addSystem('切断しました');
  }
  function applyUrl() {
    setWsUrl(editUrl);
  }
  function sendMessage() {
    if (!input.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content: input.trim() }));
    setInput('');
    inputRef.current?.focus();
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // 連続メッセージをグループ化
  const grouped: { key: string; isOwn: boolean; items: ChatItem[] }[] = [];
  for (const item of items) {
    if (isSystem(item)) {
      grouped.push({ key: item.id, isOwn: false, items: [item] });
    } else {
      const last = grouped[grouped.length - 1];
      if (last && !isSystem(last.items[0]) && (last.items[0] as Message).userId === (item as Message).userId) last.items.push(item);
      else grouped.push({ key: (item as Message).id, isOwn: (item as Message).userId === user?.id, items: [item] });
    }
  }

  const statusClass = status === 'connected' ? 'status-connected' : status === 'connecting' ? 'status-connecting' : 'status-disconnected';
  const statusLabel = status === 'connected' ? '接続中' : status === 'connecting' ? '接続中...' : '未接続';

  return (
    <AppShell currentRoomId={roomId}>
      <div className="chat-layout">
        <div className="chat-header">
          <div style={{ flex: 1 }}>
            <h2>#{room?.name ?? roomId}</h2>
            {room?.description && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{room.description}</p>}
          </div>
          <div className={`connection-status ${statusClass}`}>
            <div className="status-dot" />
            {statusLabel}
          </div>
          {user?.id === room?.createdBy && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)} title="編集" type="button">
                ✏️
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDelete(true)}
                title="削除"
                type="button"
                style={{ color: 'var(--danger)' }}
              >
                🗑️
              </button>
            </>
          )}
          {status === 'connected' ? (
            <button className="btn btn-secondary btn-sm" onClick={disconnect} type="button">
              切断
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => connect(wsUrl)}
              disabled={!wsUrl || status === 'connecting'}
              type="button"
            >
              接続
            </button>
          )}
        </div>

        <div className="ws-connect-bar">
          <span className="ws-url-label">WS URL:</span>
          <input
            className="input"
            style={{ fontSize: 12, padding: '6px 10px' }}
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="ws://localhost:8787/ws/room-id"
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
          />
          <button className="btn btn-secondary btn-sm" onClick={applyUrl} type="button">
            接続
          </button>
        </div>

        <div className="messages-container">
          {items.length === 0 && status === 'connected' && (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>まだメッセージはありません</h3>
              <p>最初のメッセージを送ってみましょう</p>
            </div>
          )}
          {grouped.map((group) => {
            if (isSystem(group.items[0])) {
              return group.items.map((item) => (
                <div key={(item as SystemMsg).id} className="system-message">
                  {(item as SystemMsg).text}
                </div>
              ));
            }
            const first = group.items[0] as Message;
            return (
              <div key={group.key} className={`message-row ${group.isOwn ? 'own' : ''}`}>
                {!group.isOwn && <div className="msg-avatar">{first.displayName.slice(0, 2).toUpperCase()}</div>}
                <div className="msg-content">
                  <div className="msg-meta">
                    {!group.isOwn && <strong>{first.displayName} </strong>}
                    {formatTime(first.createdAt)}
                  </div>
                  {group.items.map((item) => {
                    const m = item as Message;
                    return (
                      <div key={m.id} className={`msg-bubble ${group.isOwn ? 'own' : 'other'}`}>
                        {m.content}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="input"
              placeholder={status === 'connected' ? `#${room?.name ?? '...'} にメッセージを送信 (Enter で送信)` : '接続していません'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={status !== 'connected'}
              rows={1}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={!input.trim() || status !== 'connected'} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showEdit && room && (
        <RoomModal
          editRoom={room}
          onClose={() => setShowEdit(false)}
          onCreated={() => {}}
          onUpdated={() => {
            setShowEdit(false);
            api.rooms
              .get(roomId)
              .then((r) => setRoom(r.data))
              .catch(() => {});
          }}
        />
      )}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ルームを削除</h3>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>このルームとすべてのメッセージを削除しますか？</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)} type="button">
                キャンセル
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await api.rooms.delete(roomId);
                  router.push('/rooms');
                }}
                type="button"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
