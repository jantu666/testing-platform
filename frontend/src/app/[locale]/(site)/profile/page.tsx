'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { RoleBadges } from '@/components/RoleBadges';

type ResultRow = {
  id: string;
  score: number;
  completionTimeSeconds: number;
  createdAt: string;
  test: { id: string; title: string };
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.nickname) setNickname(user.nickname);
  }, [user?.nickname]);

  useEffect(() => {
    if (!user) return;
    apiFetch<ResultRow[]>('/results?mine=true')
      .then(setResults)
      .catch(() => setResults([]));
  }, [user?.id]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPending(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('nickname', nickname);
      const fileInput = (e.target as HTMLFormElement).elements.namedItem(
        'avatar',
      ) as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        fd.append('avatar', fileInput.files[0]);
      }
      const { access } = {
        access:
          typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
      };
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: access ? { Authorization: `Bearer ${access}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Update failed');
      await refreshUser();
      setMsg('Saved');
    } catch {
      setMsg(tc('error'));
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <p className="text-forum-muted">{tc('loading')}</p>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1 forum-card p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full border border-forum-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-forum-border bg-forum-bg text-2xl text-forum-muted">
              {user.nickname[0]?.toUpperCase()}
            </div>
          )}
          <RoleBadges roles={user.roles} />
        </div>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="text-xs text-forum-muted">{t('editNickname')}</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-forum-muted">{t('avatar')}</label>
            <input name="avatar" type="file" accept="image/*" className="mt-1 w-full text-sm text-forum-muted" />
          </div>
          {msg && <p className="text-sm text-forum-accent">{msg}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-forum-accent py-2 text-sm text-white disabled:opacity-50"
          >
            {tc('save')}
          </button>
        </form>
        <p className="text-xs text-forum-muted break-all">{user.email}</p>
        <Link
          href={`/users/${user.id}`}
          className="text-sm text-forum-accent hover:underline"
        >
          Public profile →
        </Link>
      </div>
      <div className="md:col-span-2 forum-card p-6">
        <h2 className="font-semibold text-white">{t('history')}</h2>
        {!results && <p className="mt-4 text-forum-muted">{tc('loading')}</p>}
        {results && results.length === 0 && (
          <p className="mt-4 text-forum-muted">No results yet.</p>
        )}
        {results && results.length > 0 && (
          <ul className="mt-4 divide-y divide-forum-border">
            {results.map((r) => (
              <li key={r.id} className="forum-row flex flex-wrap justify-between gap-2">
                <span className="text-white">{r.test.title}</span>
                <span className="text-forum-muted">
                  {r.score}% · {r.completionTimeSeconds}s
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
