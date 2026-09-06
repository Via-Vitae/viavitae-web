import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  cn,
  formatEur,
  formatEurWithVat,
  intlLocale,
  slugify,
  vatAmount,
} from '@/lib/utils';

describe('cn', () => {
  it('joins truthy class names and drops falsy values', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });
  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('intlLocale', () => {
  it('maps app locales to BCP-47 tags', () => {
    expect(intlLocale('lt')).toBe('lt-LT');
    expect(intlLocale('ru')).toBe('ru-RU');
    expect(intlLocale('en')).toBe('en-IE');
  });
});

describe('formatEur', () => {
  it('formats a net amount with two decimals and the euro sign (en)', () => {
    const out = formatEur(1900, 'en');
    expect(out).toContain('1,900.00');
    expect(out).toContain('€');
  });
  it('always includes the euro sign across locales', () => {
    for (const locale of ['lt', 'en', 'ru'] as const) {
      expect(formatEur(900, locale)).toContain('€');
    }
  });
});

describe('formatEurWithVat / vatAmount', () => {
  it('adds the 21% PVM to the gross figure', () => {
    expect(formatEurWithVat(1000, 'en')).toContain('1,210.00');
  });
  it('computes the VAT amount, rounded to cents', () => {
    expect(vatAmount(1000)).toBe(210);
    expect(vatAmount(900)).toBe(189);
    expect(vatAmount(0)).toBe(0);
  });
});

describe('slugify', () => {
  it('lowercases, dash-joins and trims', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  --A--B--  ')).toBe('a-b');
  });
  it('folds diacritics to ASCII', () => {
    expect(slugify('Café ÁBČ')).toBe('cafe-abc');
  });
  it('drops non-alphanumeric runs', () => {
    expect(slugify('Donations & Payments!')).toBe('donations-payments');
  });
});

describe('absoluteUrl', () => {
  it('normalises trailing and leading slashes', () => {
    expect(absoluteUrl('https://x.com/', '/y')).toBe('https://x.com/y');
    expect(absoluteUrl('https://x.com', 'y')).toBe('https://x.com/y');
    expect(absoluteUrl('https://x.com/', '/')).toBe('https://x.com/');
  });
});
