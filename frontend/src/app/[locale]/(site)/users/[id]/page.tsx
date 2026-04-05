'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { RoleBadges } from '@/components/RoleBadges';

type PublicUser = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  roles: string[];
  testsPassed: number;
};

export default function PublicUserPage() {
  const t = useTranslations('profile');
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<PublicUser>;
      })
      .then(setUser)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="forum-card p-8 text-center text-forum-muted">User not found.</div>
    );
  }
  if (!user) {
    return <p className="text-forum-muted">…</p>;
  }

  return (
    <div className="mx-auto max-w-lg forum-card p-8">
      <div className="flex flex-col items-center gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-28 w-28 rounded-full border border-forum-border object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-forum-border bg-forum-bg text-3xl text-forum-muted">
            {user.nickname[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-semibold text-white">{user.nickname}</h1>
        <RoleBadges roles={user.roles as ('USER' | 'CREATOR' | 'ADMIN')[]} />
        <p className="text-sm text-forum-muted">
          {t('passed')}: {user.testsPassed}
        </p>
      </div>
    </div>
  );
}
