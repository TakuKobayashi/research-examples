'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Tab = 'password' | 'passkey';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.auth.login({ email, password });
      login(token, user);
      router.replace('/rooms');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setError('');
    setLoading(true);
    try {
      const { options, challengeId } = await api.auth.passkeyAuthOptions({
        email: email || undefined,
      });
      // @simplewebauthn/browser v10: options を直接渡す
      const response = await startAuthentication(options as PublicKeyCredentialRequestOptionsJSON);
      const result = await api.auth.passkeyAuthVerify({ challengeId, response });
      login(result.token, result.user);
      router.replace('/rooms');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'パスキー認証に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>ChatApp</h1>
          <p>リアルタイムチャットへようこそ</p>
        </div>

        <div className="auth-card">
          <h2>ログイン</h2>

          <div className="tabs">
            <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')} type="button">
              パスワード
            </button>
            <button className={`tab ${tab === 'passkey' ? 'active' : ''}`} onClick={() => setTab('passkey')} type="button">
              パスキー
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {tab === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <div className="field">
                <label className="label" htmlFor="email">
                  メールアドレス
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="password">
                  パスワード
                </label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 20 }}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          ) : (
            <div>
              <div className="field">
                <label className="label" htmlFor="passkey-email">
                  メールアドレス（任意）
                </label>
                <input
                  id="passkey-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-3)',
                    marginTop: 6,
                    display: 'block',
                  }}
                >
                  省略するとデバイスに保存された全パスキーから選択できます
                </span>
              </div>

              <button className="passkey-btn" style={{ marginTop: 20 }} onClick={handlePasskeyLogin} disabled={loading} type="button">
                <PasskeyIcon />
                {loading ? '認証中...' : 'パスキーでログイン'}
              </button>
            </div>
          )}

          <div className="auth-footer">
            アカウントをお持ちでない方は <Link href="/register">新規登録</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasskeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
      <path d="M16 11l1.5 1.5L20 10" />
    </svg>
  );
}
