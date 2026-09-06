import { PVM_RATE } from './constants';
import type { Locale } from './routing';

/**
 * Minimal className combiner. Filters falsy values and joins with a space.
 * Dependency-free on purpose: no clsx/tailwind-merge needed for this codebase.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Map an app locale to a BCP-47 tag used by Intl formatters. */
export function intlLocale(locale: Locale): string {
  switch (locale) {
    case 'lt':
      return 'lt-LT';
    case 'ru':
      return 'ru-RU';
    case 'en':
    default:
      return 'en-IE'; // English with EUR-first conventions used across the EU site.
  }
}

/** Format a net EUR amount, e.g. 1900 -> "€1,900.00" (locale-aware grouping). */
export function formatEur(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a net EUR amount with VAT (PVM) added, labelled for the given locale. */
export function formatEurWithVat(amount: number, locale: Locale): string {
  const gross = amount * (1 + PVM_RATE);
  return formatEur(gross, locale);
}

/** VAT (PVM) amount for a net EUR figure. */
export function vatAmount(netEur: number): number {
  return Math.round(netEur * PVM_RATE * 100) / 100;
}

/** URL-safe slug from an arbitrary string (ASCII fold, lowercase, dash-joined). */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build an absolute URL from the site origin and a path. */
export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
