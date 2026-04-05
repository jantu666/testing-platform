'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { API } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Answer = { id: string; text: string; isCorrect?: boolean };
type Question = { id: string; order: number; text: string; answers: Answer[] };
type TestDetail = {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  published: boolean;
  shareToken?: string | null;
  creatorId: string;
  creator: { id: string; nickname: string };
  questions: Question[];
};

export default function TestDetailPage() {
  const t = useTranslations('test');
  const locale = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const shareToken = searchParams.get('shareToken') || undefined;
  const { user } = useAuth();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const q = shareToken
      ? `?shareToken=${encodeURIComponent(shareToken)}`
      : '';
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API}/tests/${id}${q}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<TestDetail>;
      })
      .then((data) => {
        if (!cancelled) setTest(data);
      })
      .catch(() => {
        if (!cancelled) setError('404');
      });
    return () => {
      cancelled = true;
    };
  }, [id, shareToken, user?.id]);

  if (error) {
    return (
      <div className="forum-card p-8 text-center text-forum-muted">
        Test not found or no access.
      </div>
    );
  }
  if (!test) {
    return <p className="text-forum-muted">…</p>;
  }

  const canEdit =
    user &&
    (user.roles.includes('ADMIN') ||
      (user.roles.includes('CREATOR') && user.id === test.creatorId));
  const canTake = test.published && test.questions.length > 0 && user;
  const shareUrl =
    typeof window !== 'undefined' && test.shareToken
      ? `${window.location.origin}/${locale}/tests/${test.id}?shareToken=${test.shareToken}`
      : '';

  return (
    <div className="space-y-6">
      <article className="forum-card p-6">
        <h1 className="text-2xl font-bold text-white">{test.title}</h1>
        <p className="mt-2 text-sm text-forum-muted">
          {t('by')} {test.creator.nickname}
        </p>
        {test.description ? (
          <p className="mt-4 whitespace-pre-wrap text-forum-muted">{test.description}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {canTake && (
            <Link
              href={
                shareToken
                  ? `/tests/${test.id}/take?shareToken=${encodeURIComponent(shareToken)}`
                  : `/tests/${test.id}/take`
              }
              className="rounded bg-forum-accent px-4 py-2 text-sm font-medium text-white hover:bg-forum-accentHover"
            >
              {t('start')}
            </Link>
          )}
          {canEdit && (
            <Link
              href={`/tests/${test.id}/edit`}
              className="rounded border border-forum-border px-4 py-2 text-sm text-white hover:border-forum-accent"
            >
              {t('edit')}
            </Link>
          )}
        </div>
        {!user && test.published && (
          <p className="mt-4 text-sm text-amber-200/90">
            Log in to take this test.
          </p>
        )}
        {canEdit && test.isPrivate && test.shareToken && (
          <div className="mt-6 rounded border border-forum-border bg-forum-bg p-3">
            <p className="text-xs text-forum-muted">{t('shareLink')}</p>
            <code className="mt-1 block break-all text-sm text-forum-accent">{shareUrl}</code>
          </div>
        )}
      </article>
    </div>
  );
}
