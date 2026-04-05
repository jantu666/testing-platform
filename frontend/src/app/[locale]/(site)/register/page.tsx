'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register(email, password, nickname);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md forum-card p-8">
      <h1 className="text-xl font-semibold text-white">{t('registerTitle')}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm text-forum-muted">{t('nickname')}</label>
          <input
            required
            minLength={2}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-forum-muted">{t('email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-forum-muted">{t('password')}</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-forum-accent py-2 font-medium text-white hover:bg-forum-accentHover disabled:opacity-50"
        >
          {t('submitRegister')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-forum-muted">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-forum-accent hover:underline">
          {t('loginTitle')}
        </Link>
      </p>
    </div>
  );
}
