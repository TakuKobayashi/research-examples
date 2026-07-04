import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { User } from '@chat-app/shared';

export interface AuthResponse {
  token: string;
  user: User;
}
const TOKEN_KEY = 'chat_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _loading = signal(true);
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  constructor(private http: HttpClient) {
    this.initFromStorage();
  }

  private async initFromStorage() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      this._token.set(token);
      try {
        const res = await firstValueFrom(this.http.get<{ user: User }>('/api/auth/me'));
        this._user.set(res.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        this._token.set(null);
      }
    }
    this._loading.set(false);
  }

  setAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
    this._user.set(user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
