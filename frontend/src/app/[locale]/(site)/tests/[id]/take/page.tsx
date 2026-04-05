'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import { API, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Answer = { id: string; text: string };
type Question = { id: string; order: number; text: string; answers: Answer[] };
type TestDetail = {
  id: string;
  title: string;
  published: boolean;
  isPrivate: boolean;
  questions: Question[];
};

export default function TakeTestPage() {
  const t = useTranslations('test');
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const shareToken = searchParams.get('shareToken') || undefined;
  const { user } = useAuth();

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [antiCheat, setAntiCheat] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    completionTimeSeconds: number;
    tabSwitchCount: number;
    finishedByAntiCheat: boolean;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitting = useRef(false);
  const antiSubmitDone = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const q = shareToken
      ? `?shareToken=${encodeURIComponent(shareToken)}`
      : '';
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API}/tests/${id}${q}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('fail');
        return res.json() as Promise<TestDetail>;
      })
      .then(setTest)
      .catch(() => setLoadError(true));
  }, [id, shareToken]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        setTabSwitches((c) => {
          const n = c + 1;
          if (n >= 3 && !submitting.current) {
            setAntiCheat(true);
          }
          return n;
        });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const submit = useCallback(
    async (forcedAnti: boolean) => {
      if (!test || !user || submitting.current) return;
      submitting.current = true;
      setSubmitError(null);
      const answers = test.questions.map((q) => ({
        questionId: q.id,
        selectedAnswerIds: selections[q.id] || [],
      }));
      const completionTimeSeconds = Math.max(
        0,
        Math.round((Date.now() - startedAt) / 1000),
      );
      const ts = tabSwitches;
      const finishedByAntiCheat = forcedAnti || ts >= 3;
      try {
        const body: Record<string, unknown> = {
          testId: test.id,
          answers,
          completionTimeSeconds,
          tabSwitchCount: ts,
          finishedByAntiCheat,
        };
        if (shareToken) body.shareToken = shareToken;
        const res = await apiFetch<{
          score: number;
          completionTimeSeconds: number;
          tabSwitchCount: number;
          finishedByAntiCheat: boolean;
        }>('/results', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setResult(res);
        setFinished(true);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Error');
        submitting.current = false;
        antiSubmitDone.current = false;
      }
    },
    [test, user, selections, startedAt, tabSwitches, shareToken],
  );

  useEffect(() => {
    if (
      antiCheat &&
      test &&
      user &&
      !finished &&
      !antiSubmitDone.current
    ) {
      antiSubmitDone.current = true;
      void submit(true);
    }
  }, [antiCheat, test, user, finished, submit]);

  if (!user) {
    return (
      <div className="forum-card p-8 text-center">
        <Link href="/login" className="text-forum-accent hover:underline">
          Log in
        </Link>{' '}
        to take tests.
      </div>
    );
  }
  if (loadError || !test) {
    return (
      <div className="forum-card p-8 text-center text-forum-muted">
        {loadError ? 'Unable to load test.' : '…'}
      </div>
    );
  }

  if (finished && result) {
    return (
      <div className="forum-card mx-auto max-w-lg space-y-4 p-8">
        <h1 className="text-xl font-semibold text-white">{t('resultTitle')}</h1>
        <p className="text-forum-muted">
          {t('score')}: <span className="text-2xl font-bold text-white">{result.score}%</span>
        </p>
        <p className="text-sm text-forum-muted">
          {t('time')}: {result.completionTimeSeconds}s · {t('tabSwitches')}:{' '}
          {result.tabSwitchCount}
        </p>
        {result.finishedByAntiCheat && (
          <p className="text-amber-200">{t('antiCheatEnd')}</p>
        )}
        <Link href="/" className="inline-block text-forum-accent hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  const q = test.questions[index];
  const total = test.questions.length;
  const selected = new Set(selections[q.id] || []);

  function toggleAnswer(aid: string) {
    setSelections((prev) => {
      const cur = new Set(prev[q.id] || []);
      if (cur.has(aid)) cur.delete(aid);
      else cur.add(aid);
      return { ...prev, [q.id]: [...cur] };
    });
  }

  function nextOrFinish() {
    if (index < total - 1) setIndex(index + 1);
    else void submit(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex justify-between text-sm text-forum-muted">
        <span>
          {t('question')} {index + 1} {t('of')} {total}
        </span>
        <span>
          {t('tabSwitches')}: {tabSwitches}
        </span>
      </div>
      <div className="forum-card p-6">
        <h2 className="text-lg font-medium text-white">{q.text}</h2>
        <p className="mt-2 text-sm text-forum-muted">{t('selectAnswers')}</p>
        <ul className="mt-4 space-y-2">
          {q.answers.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded border border-forum-border p-3 hover:bg-forum-bg">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleAnswer(a.id)}
                  className="h-4 w-4"
                />
                <span className="text-forum-muted">{a.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      {submitError && <p className="text-sm text-red-400">{submitError}</p>}
      <button
        type="button"
        onClick={nextOrFinish}
        disabled={antiCheat}
        className="rounded bg-forum-accent px-6 py-2 font-medium text-white hover:bg-forum-accentHover disabled:opacity-50"
      >
        {index < total - 1 ? t('next') : t('finish')}
      </button>
    </div>
  );
}
