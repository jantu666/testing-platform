'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { LocaleSwitcher } from './LocaleSwitcher';

export function ForumHeader() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isCreator =
    user?.roles.includes('CREATOR') || user?.roles.includes('ADMIN');
  const isAdmin = user?.roles.includes('ADMIN');

  return (
    <header className="sticky top-0 z-50 border-b border-forum-border bg-forum-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-white hover:text-forum-accent">
          Acron<span className="text-forum-muted font-normal">Tests</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-forum-muted">
          <Link
            href="/"
            className={pathname === '/' ? 'text-white' : 'hover:text-white'}
          >
            {t('home')}
          </Link>
          {isCreator && (
            <Link
              href="/tests/new"
              className={pathname?.startsWith('/tests/new') ? 'text-white' : 'hover:text-white'}
            >
              {t('createTest')}
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={pathname?.startsWith('/admin') ? 'text-white' : 'hover:text-white'}
            >
              {t('admin')}
            </Link>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <LocaleSwitcher />
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-forum-muted hover:text-white"
              >
                {t('profile')}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded border border-forum-border px-3 py-1 text-sm text-forum-muted hover:border-forum-accent hover:text-white"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-forum-muted hover:text-white"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded bg-forum-accent px-3 py-1 text-sm font-medium text-white hover:bg-forum-accentHover"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
