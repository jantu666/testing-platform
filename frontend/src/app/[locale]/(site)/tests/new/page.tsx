'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type LocalAnswer = { key: string; text: string; isCorrect: boolean };
type LocalQuestion = { key: string; order: number; text: string; answers: LocalAnswer[] };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function NewTestPage() {
  const t = useTranslations('test');
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [testId, setTestId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && user && !user.roles.includes('CREATOR') && !user.roles.includes('ADMIN')) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const createDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await apiFetch<{ id: string }>('/tests', {
        method: 'POST',
        body: JSON.stringify({ title, description, isPrivate }),
      });
      setTestId(created.id);
      setQuestions([
        {
          key: uid(),
          order: 0,
          text: '',
          answers: [
            { key: uid(), text: '', isCorrect: true },
            { key: uid(), text: '', isCorrect: false },
          ],
        },
      ]);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const buildPayload = useCallback(() => {
    return {
      title,
      description,
      isPrivate,
      questions: questions.map((q, i) => ({
        order: i,
        text: q.text,
        answers: q.answers.map((a) => ({
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      })),
    };
  }, [title, description, isPrivate, questions]);

  const saveDraft = async () => {
    if (!testId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/tests/${testId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...buildPayload(), published: false }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!testId) return;
    for (const q of questions) {
      if (!q.text.trim()) {
        setError('Each question needs text');
        return;
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        setError('Each question needs a correct answer');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/tests/${testId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...buildPayload(), published: true }),
      });
      router.push(`/tests/${testId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      {
        key: uid(),
        order: qs.length,
        text: '',
        answers: [
          { key: uid(), text: '', isCorrect: true },
          { key: uid(), text: '', isCorrect: false },
        ],
      },
    ]);
  };

  if (loading || !user) {
    return <p className="text-forum-muted">…</p>;
  }

  if (step === 1) {
    return (
      <div className="mx-auto max-w-lg forum-card p-8">
        <h1 className="text-xl font-semibold text-white">{t('createTitle')}</h1>
        <p className="mt-1 text-sm text-forum-muted">{t('metaStep')}</p>
        <form onSubmit={createDraft} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-forum-muted">{t('titleLabel')}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-forum-muted">{t('descLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-forum-muted">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            {t('privateLabel')}
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-forum-accent px-4 py-2 text-white disabled:opacity-50"
          >
            {t('editorStep')} →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-forum-muted hover:text-white"
        >
          {t('back')}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {questions.map((q, qi) => (
        <div key={q.key} className="forum-card p-6">
          <label className="text-sm text-forum-muted">
            {t('question')} {qi + 1}
          </label>
          <textarea
            value={q.text}
            onChange={(e) => {
              const v = e.target.value;
              setQuestions((qs) =>
                qs.map((x) => (x.key === q.key ? { ...x, text: v } : x)),
              );
            }}
            rows={2}
            className="mt-2 w-full rounded border border-forum-border bg-forum-bg px-3 py-2 text-white"
          />
          <div className="mt-4 space-y-2">
            {q.answers.map((a) => (
              <div key={a.key} className="flex flex-wrap items-center gap-2">
                <input
                  value={a.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuestions((qs) =>
                      qs.map((qq) =>
                        qq.key !== q.key
                          ? qq
                          : {
                              ...qq,
                              answers: qq.answers.map((aa) =>
                                aa.key === a.key ? { ...aa, text: v } : aa,
                              ),
                            },
                      ),
                    );
                  }}
                  placeholder="Answer"
                  className="flex-1 min-w-[120px] rounded border border-forum-border bg-forum-bg px-3 py-2 text-sm text-white"
                />
                <label className="flex items-center gap-1 text-xs text-forum-muted">
                  <input
                    type="checkbox"
                    checked={a.isCorrect}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setQuestions((qs) =>
                        qs.map((qq) =>
                          qq.key !== q.key
                            ? qq
                            : {
                                ...qq,
                                answers: qq.answers.map((aa) =>
                                  aa.key === a.key ? { ...aa, isCorrect: v } : aa,
                                ),
                              },
                        ),
                      );
                    }}
                  />
                  {t('correct')}
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setQuestions((qs) =>
                  qs.map((qq) =>
                    qq.key !== q.key
                      ? qq
                      : {
                          ...qq,
                          answers: [
                            ...qq.answers,
                            { key: uid(), text: '', isCorrect: false },
                          ],
                        },
                  ),
                );
              }}
              className="text-sm text-forum-accent hover:underline"
            >
              + {t('addAnswer')}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addQuestion}
        className="text-forum-accent hover:underline"
      >
        + {t('addQuestion')}
      </button>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveDraft()}
          className="rounded border border-forum-border px-4 py-2 text-white hover:border-forum-accent disabled:opacity-50"
        >
          {t('saveDraft')}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void publish()}
          className="rounded bg-forum-accent px-4 py-2 text-white disabled:opacity-50"
        >
          {t('publish')}
        </button>
      </div>
    </div>
  );
}
