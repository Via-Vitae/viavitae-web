import { defineRouting } from "next-intl/routing";

// Single source of truth for locale routing (ADR-WEB-001/003).
// LT is the default locale: Lithuania is the pilot market (see legal/impressum).
// PL and DE are intentionally NOT routable yet — they exist as message stubs and
// appear disabled ("coming soon") in the language switcher.
export const routing = defineRouting({
  locales: ["lt", "en", "ru"],
  defaultLocale: "lt",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/** Locales that are declared in the UI but not yet routable. */
export const COMING_SOON_LOCALES = ["pl", "de"] as const;
export type ComingSoonLocale = (typeof COMING_SOON_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Prefix a canonical (locale-less) path with its locale segment.
 * `localizedPath('en', '/pricing')` -> `/en/pricing`.
 */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}
