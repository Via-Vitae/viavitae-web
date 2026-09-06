import { getRequestConfig } from 'next-intl/server';
import { createNavigation } from 'next-intl/navigation';
import { routing, isLocale } from './routing';
import type { Locale } from './routing';

// Locale-aware navigation primitives. Use these instead of next/link and
// next/navigation so every href carries the locale prefix (ADR-WEB-001).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// Consumed by createNextIntlPlugin('./lib/i18n.ts') in next.config.ts.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale =
    requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // Messages are bundled per locale; only lt/en/ru are routable.
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
