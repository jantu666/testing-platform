'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded border border-forum-border p-0.5 text-xs">
      {locales.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => router.replace(pathname, { locale: l.code })}
          className={
            locale === l.code
              ? 'rounded bg-forum-border px-2 py-0.5 text-white'
              : 'px-2 py-0.5 text-forum-muted hover:text-white'
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
