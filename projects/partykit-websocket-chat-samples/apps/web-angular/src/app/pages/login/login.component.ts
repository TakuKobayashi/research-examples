import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { AuthService, AuthResponse } from '../../services/auth.service';

type Tab = 'password' | 'passkey';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo">
          <h1>ChatApp</h1>
          <p>Angular — リアルタイムチャット</p>
        </div>
        <div class="auth-card">
          <h2>ログイン</h2>
          <div class="tabs">
            <button class="tab" [class.active]="tab() === 'password'" (click)="tab.set('password')" type="button">パスワード</button>
            <button class="tab" [class.active]="tab() === 'passkey'" (click)="tab.set('passkey')" type="button">パスキー</button>
          </div>
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          @if (tab() === 'password') {
            <form (ngSubmit)="loginWithPassword()">
              <div class="field">
                <label class="label" for="email">メールアドレス</label>
                <input
                  id="email"
                  class="input"
                  type="email"
                  placeholder="you@example.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                />
              </div>
              <div class="field" style="margin-top:16px">
                <label class="label" for="pw">パスワード</label>
                <input
                  id="pw"
                  class="input"
                  type="password"
                  placeholder="••••••••"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                />
              </div>
              <button class="btn btn-primary btn-full" type="submit" [disabled]="loading()" style="margin-top:20px">
                {{ loading() ? 'ログイン中...' : 'ログイン' }}
              </button>
            </form>
          } @else {
            <div>
              <div class="field">
                <label class="label" for="pk-email">メールアドレス（任意）</label>
                <input
                  id="pk-email"
                  class="input"
                  type="email"
                  placeholder="you@example.com"
                  [(ngModel)]="email"
                  name="pkEmail"
                  autocomplete="email"
                />
                <span style="font-size:12px;color:var(--text-3);margin-top:6px;display:block"
                  >省略するとデバイスに保存された全パスキーから選択できます</span
                >
              </div>
              <button class="passkey-btn" style="margin-top:20px" (click)="loginWithPasskey()" [disabled]="loading()" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <path d="M16 11l1.5 1.5L20 10" />
                </svg>
                {{ loading() ? '認証中...' : 'パスキーでログイン' }}
              </button>
            </div>
          }
          <div class="auth-footer">アカウントをお持ちでない方は <a routerLink="/register">新規登録</a></div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  tab = signal<Tab>('password');
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  async loginWithPassword() {
    this.error.set('');
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/login', { email: this.email, password: this.password }));
      this.auth.setAuth(res.token, res.user);
      this.router.navigate(['/rooms']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithPasskey() {
    this.error.set('');
    this.loading.set(true);
    try {
      const { options, challengeId } = await firstValueFrom(
        this.http.post<{ options: PublicKeyCredentialRequestOptionsJSON; challengeId: string }>('/api/auth/passkey/auth/options', {
          email: this.email || undefined,
        }),
      );
      // @simplewebauthn/browser v10: options を直接渡す（optionsJSON でラップしない）
      const response = await startAuthentication(options);
      const res = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/passkey/auth/verify', { challengeId, response }));
      this.auth.setAuth(res.token, res.user);
      this.router.navigate(['/rooms']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'パスキー認証に失敗しました');
    } finally {
      this.loading.set(false);
    }
  }
}
