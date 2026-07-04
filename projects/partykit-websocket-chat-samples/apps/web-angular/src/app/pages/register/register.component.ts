import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo">
          <h1>ChatApp</h1>
          <p>新規アカウント作成</p>
        </div>
        <div class="auth-card">
          <h2>新規登録</h2>
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          @if (success()) {
            <div class="alert alert-success">{{ success() }}</div>
          }
          <form (ngSubmit)="register()">
            <div class="field">
              <label class="label" for="dn">表示名</label>
              <input
                id="dn"
                class="input"
                type="text"
                placeholder="山田 太郎"
                [(ngModel)]="displayName"
                name="displayName"
                required
                autocomplete="name"
              />
            </div>
            <div class="field" style="margin-top:16px">
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
              <label class="label" for="pw">パスワード（8文字以上）</label>
              <input
                id="pw"
                class="input"
                type="password"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                required
                minlength="8"
                autocomplete="new-password"
              />
            </div>
            <button class="btn btn-primary btn-full" type="submit" [disabled]="loading()" style="margin-top:20px">
              {{ loading() ? '登録中...' : 'アカウントを作成' }}
            </button>
          </form>

          @if (auth.isLoggedIn()) {
            <div>
              <div class="auth-divider">パスキーを追加</div>
              <button class="passkey-btn" (click)="registerPasskey()" [disabled]="passkeyLoading()" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <path d="M16 11l1.5 1.5L20 10" />
                </svg>
                {{ passkeyLoading() ? '登録中...' : 'このデバイスにパスキーを登録' }}
              </button>
              <p style="font-size:12px;color:var(--text-3);margin-top:8px">次回から指紋・顔認証でログインできます</p>
            </div>
          }
          <div class="auth-footer">すでにアカウントをお持ちの方は <a routerLink="/login">ログイン</a></div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  displayName = '';
  email = '';
  password = '';
  error = signal('');
  success = signal('');
  loading = signal(false);
  passkeyLoading = signal(false);

  async register() {
    this.error.set('');
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>('/api/auth/register', { email: this.email, password: this.password, displayName: this.displayName }),
      );
      this.auth.setAuth(res.token, res.user);
      this.router.navigate(['/rooms']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      this.loading.set(false);
    }
  }

  async registerPasskey() {
    const user = this.auth.user();
    if (!user) return;
    this.error.set('');
    this.success.set('');
    this.passkeyLoading.set(true);
    try {
      const { options, challengeId } = await firstValueFrom(
        this.http.post<{ options: PublicKeyCredentialCreationOptionsJSON; challengeId: string }>('/api/auth/passkey/register/options', {
          userId: user.id,
          displayName: user.displayName,
        }),
      );
      // @simplewebauthn/browser v10: options を直接渡す
      const response = await startRegistration(options);
      await firstValueFrom(this.http.post('/api/auth/passkey/register/verify', { challengeId, response }));
      this.success.set('パスキーを登録しました！');
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'パスキー登録に失敗しました');
    } finally {
      this.passkeyLoading.set(false);
    }
  }
}
