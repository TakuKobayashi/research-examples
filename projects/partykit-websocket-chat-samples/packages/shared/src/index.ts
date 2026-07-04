export interface User { id: string; email: string; displayName: string; createdAt: string; updatedAt: string }
export interface Room { id: string; name: string; description?: string; createdBy: string; createdAt: string; updatedAt: string }
export interface Message { id: string; roomId: string; userId: string; displayName: string; content: string; createdAt: string }
export interface AuthResponse { token: string; user: User }
export type WSMessageType = 'message' | 'join' | 'leave' | 'history' | 'error' | 'ping' | 'pong'
export interface WSMessage { type: WSMessageType; data: unknown }
