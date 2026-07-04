import type { User, Room, Message, AuthResponse } from '@chat-app/shared';
const getBaseUrl = () => (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8787');
function getToken(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem('chat_token');
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}
export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string }) =>
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User }>('/api/auth/me'),
    passkeyRegisterOptions: (data: { userId: string; displayName: string }) =>
      request<{ options: object; challengeId: string }>('/api/auth/passkey/register/options', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    passkeyRegisterVerify: (data: { challengeId: string; response: unknown }) =>
      request<{ verified: boolean }>('/api/auth/passkey/register/verify', { method: 'POST', body: JSON.stringify(data) }),
    passkeyAuthOptions: (data: { email?: string }) =>
      request<{ options: object; challengeId: string }>('/api/auth/passkey/auth/options', { method: 'POST', body: JSON.stringify(data) }),
    passkeyAuthVerify: (data: { challengeId: string; response: unknown }) =>
      request<AuthResponse>('/api/auth/passkey/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
  },
  rooms: {
    list: () => request<{ data: Room[] }>('/api/rooms'),
    get: (id: string) => request<{ data: Room }>(`/api/rooms/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<{ data: Room }>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; description?: string }) =>
      request<{ data: Room }>(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/api/rooms/${id}`, { method: 'DELETE' }),
    messages: (roomId: string) => request<{ data: Message[] }>(`/api/rooms/${roomId}/messages`),
  },
};
