'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { API } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type TestListItem = {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  published: boolean;
  creatorId: string;
  creator: { id: string; nickname: string };
  questionCount: number;
  shareToken?: string | null;
};

async function fetchTests(token: string | null, shareToken?: string) {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const q = shareToken ? `?shareToken=${encodeURIComponent(shareToken)}` : '';
  const res = await fetch(`${API}/tests${q}`, { headers });
  if (!res.ok) throw new Error('Failed to load tests');
  return res.json() as Promise<TestListItem[]>;
}

export default function HomePage() {
  const t = useTranslations('home');
  const tt = useTranslations('test');
  const tc = useTranslations('common');
  const { user } = useAuth();
  const [tests, setTests] = useState<TestListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    fetchTests(token)
      .then((data) => {
        if (!cancelled) setTests(data);
      })
      .catch(() => {
        if (!cancelled) setErr('load');
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="forum-card p-6">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-forum-muted">{t('subtitle')}</p>
      </div>
      {err && (
        <p className="text-red-400">{t('empty')}</p>
      )}
      {tests === null && !err && (
        <p className="text-forum-muted">{tc('loading')}</p>
      )}
      {tests && tests.length === 0 && (
        <div className="forum-card p-8 text-center text-forum-muted">{t('empty')}</div>
      )}
      {tests && tests.length > 0 && (
        <ul className="space-y-3">
          {tests.map((test) => (
            <li key={test.id}>
              <Link
                href={`/tests/${test.id}`}
                className="block forum-card p-4 transition hover:border-forum-accent/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-white">{test.title}</h2>
                  <div className="flex gap-2 text-xs">
                    {!test.published && (
                      <span className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-200">
                        {t('draft')}
                      </span>
                    )}
                    {test.isPrivate && (
                      <span className="rounded bg-purple-900/40 px-2 py-0.5 text-purple-200">
                        {t('private')}
                      </span>
                    )}
                  </div>
                </div>
                {test.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-forum-muted">
                    {test.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-forum-muted">
                  {test.questionCount} {t('questions')} · {tt('by')}{' '}
                  <span className="text-forum-accent">{test.creator.nickname}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
