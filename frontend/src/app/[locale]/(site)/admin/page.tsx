'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, type RoleName } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { RoleBadges } from '@/components/RoleBadges';

type AdminUser = {
  id: string;
  email: string;
  nickname: string;
  blocked: boolean;
  roles: RoleName[];
};

const allRoles: RoleName[] = ['USER', 'CREATOR', 'ADMIN'];

export default function AdminPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<AdminUser[]>('/admin/users')
      .then(setUsers)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Error'));
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('ADMIN'))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.roles.includes('ADMIN')) load();
  }, [user, load]);

  async function toggleBlock(u: AdminUser) {
    try {
      await apiFetch(`/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ blocked: !u.blocked }),
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  async function toggleRole(target: AdminUser, role: RoleName, has: boolean) {
    try {
      if (has) {
        await apiFetch(`/admin/users/${target.id}/roles/${role}`, {
          method: 'DELETE',
        });
      } else {
        await apiFetch(`/admin/users/${target.id}/roles`, {
          method: 'POST',
          body: JSON.stringify({ role }),
        });
      }
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  if (loading || !user?.roles.includes('ADMIN')) {
    return <p className="text-forum-muted">{tc('loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {!users && <p className="text-forum-muted">{tc('loading')}</p>}
      {users && (
        <div className="forum-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forum-border text-forum-muted">
                <th className="p-3">Email</th>
                <th className="p-3">Nick</th>
                <th className="p-3">{t('roles')}</th>
                <th className="p-3">{t('toggleBlock')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-forum-border/60">
                  <td className="p-3 text-forum-muted">{u.email}</td>
                  <td className="p-3 text-white">{u.nickname}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <RoleBadges roles={u.roles} />
                      <div className="flex flex-wrap gap-2">
                        {allRoles.map((r) => {
                          const has = u.roles.includes(r);
                          const disableAdminRemove = r === 'ADMIN' && has;
                          return (
                            <button
                              key={r}
                              type="button"
                              disabled={disableAdminRemove}
                              title={
                                disableAdminRemove
                                  ? 'Cannot remove ADMIN from an administrator'
                                  : undefined
                              }
                              onClick={() => void toggleRole(u, r, has)}
                              className={`rounded px-2 py-0.5 text-xs border ${
                                has
                                  ? 'border-forum-accent text-forum-accent'
                                  : 'border-forum-border text-forum-muted'
                              } disabled:opacity-40`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleBlock(u)}
                      className="rounded border border-forum-border px-2 py-1 text-xs text-white hover:border-forum-accent"
                    >
                      {u.blocked ? t('active') : t('blocked')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
