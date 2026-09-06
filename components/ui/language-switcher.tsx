'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n';
import { COMING_SOON_LOCALES } from '@/lib/routing';
import { cn } from '@/lib/utils';

// Locale switcher. Live locales (LT/EN/RU) switch the current path in place;
// declared-but-unroutable locales (PL/DE) render as disabled with a "soon" badge.
// Language names are endonyms (shown in their own language) and are not translated.

const LIVE: ReadonlyArray<{ code: string; endonym: string }> = [
  { code: 'lt', endonym: 'Lietuvių' },
  { code: 'en', endonym: 'English' },
  { code: 'ru', endonym: 'Русский' },
];

const COMING_SOON_ENDONYM: Record<string, string> = {
  pl: 'Polski',
  de: 'Deutsch',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('languageSwitcher');

  const switchTo = (code: string) => {
    // next-intl rewrites the locale prefix while preserving the current path.
    router.replace(pathname, { locale: code });
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="group" aria-label={t('label')}>
      {LIVE.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => switchTo(item.code)}
          aria-current={item.code === locale ? 'true' : undefined}
          lang={item.code}
          className={cn(
            'rounded-sm px-2 py-1 text-body-sm font-medium transition-colors motion-reduce:transition-none',
            item.code === locale
              ? 'bg-navy-900 text-ivory-100'
              : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
          )}
        >
          {item.endonym}
        </button>
      ))}
      {COMING_SOON_LOCALES.map((code) => (
        <span
          key={code}
          lang={code}
          aria-disabled="true"
          title={t('soon')}
          className="inline-flex cursor-not-allowed items-center gap-1 rounded-sm px-2 py-1 text-body-sm text-text-disabled"
        >
          {COMING_SOON_ENDONYM[code]}
          <span className="rounded-sm bg-surface-sunken px-1 text-[0.7em] uppercase tracking-wide">
            {t('soonBadge')}
          </span>
        </span>
      ))}
    </div>
  );
}
