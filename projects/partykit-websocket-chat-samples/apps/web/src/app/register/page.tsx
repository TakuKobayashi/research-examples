'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user: newUser } = await api.auth.register({
        email,
        password,
        displayName,
      });
      login(token, newUser);
      router.replace('/rooms');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPasskey() {
    if (!user) {
      setError('先にパスワードで登録してください');
      return;
    }
    setError('');
    setSuccess('');
    setPasskeyLoading(true);
    try {
      const { options, challengeId } = await api.auth.passkeyRegisterOptions({
        userId: user.id,
        displayName: user.displayName,
      });
      // @simplewebauthn/browser v10: options を直接渡す
      const response = await startRegistration(options as PublicKeyCredentialCreationOptionsJSON);
      await api.auth.passkeyRegisterVerify({ challengeId, response });
      setSuccess('パスキーを登録しました！');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'パスキー登録に失敗しました');
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>ChatApp</h1>
          <p>新規アカウント作成</p>
        </div>

        <div className="auth-card">
          <h2>新規登録</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleRegister}>
            <div className="field">
              <label className="label" htmlFor="displayName">
                表示名
              </label>
              <input
                id="displayName"
                className="input"
                type="text"
                placeholder="山田 太郎"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                パスワード（8文字以上）
              </label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 20 }}>
              {loading ? '登録中...' : 'アカウントを作成'}
            </button>
          </form>

          {user && (
            <>
              <div className="auth-divider">パスキーを追加</div>
              <button className="passkey-btn" onClick={handleAddPasskey} disabled={passkeyLoading} type="button">
                <PasskeyIcon />
                {passkeyLoading ? '登録中...' : 'このデバイスにパスキーを登録'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>次回から指紋・顔認証でログインできます</p>
            </>
          )}

          <div className="auth-footer">
            すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
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
