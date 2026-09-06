'use client';

// Matomo analytics wrapper, gated behind granular cookie consent (GDPR / ePrivacy).
// QODER rule 7 (EU data residency): the Matomo instance MUST be self-hosted in the
// EEA. Nothing is loaded or sent until the visitor opts in to the "analytics"
// category; reject-all must leave analytics fully disabled (parity with opt-in).
//
// The Matomo script is injected from this (nonce'd, first-party) module, so the
// CSP `script-src 'strict-dynamic'` allows it without a host allowlist; tracking
// pings to matomo.php are permitted by `connect-src` (see middleware.ts).

import { analyticsEnabled, siteConfig } from './config';

export const CONSENT_COOKIE = 'vv_consent';

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_CONSENT: ConsentState = { necessary: true, analytics: false, marketing: false };

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export function readConsent(): ConsentState {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return DEFAULT_CONSENT;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function writeConsent(consent: Omit<ConsentState, 'necessary'>): void {
  if (typeof document === 'undefined') return;
  const value: ConsentState = { necessary: true, ...consent };
  // 12 months, SameSite=Lax, Secure. Not HttpOnly: the client must read it.
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; ` +
    `Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
  if (value.analytics) {
    initMatomo();
  } else {
    disableMatomo();
  }
}

declare global {
  interface Window {
    _paq?: Array<unknown>;
  }
}

let matomoLoaded = false;

/** Inject the Matomo loader once, only when analytics consent + config exist. */
export function initMatomo(): void {
  if (matomoLoaded || !analyticsEnabled || typeof window === 'undefined') return;
  const { url, siteId } = siteConfig.matomo;
  const paq: Array<unknown> = (window._paq = window._paq ?? []);
  paq.push(['disableCookies']); // first-party, cookieless where possible
  paq.push(['setTrackerUrl', `${url}/matomo.php`]);
  paq.push(['setSiteId', siteId]);
  paq.push(['setDoNotTrack', true]);
  paq.push(['trackPageView']);
  paq.push(['enableLinkTracking']);

  const script = document.createElement('script');
  script.src = `${url}/matomo.js`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  matomoLoaded = true;
}

/** Opt-out: forget the visitor and stop tracking without a page reload. */
export function disableMatomo(): void {
  if (typeof window === 'undefined') return;
  const paq: Array<unknown> = (window._paq = window._paq ?? []);
  paq.push(['optUserOut']);
}

/** Track a page view (used on client-side route changes). */
export function trackPageView(url: string, title: string): void {
  if (!readConsent().analytics || !analyticsEnabled || typeof window === 'undefined') return;
  const paq: Array<unknown> = (window._paq = window._paq ?? []);
  paq.push(['setCustomUrl', url]);
  paq.push(['setDocumentTitle', title]);
  paq.push(['trackPageView']);
}

/** Track a custom event, e.g. a funnel step or a CTA click. */
export function trackEvent(category: string, action: string, name?: string): void {
  if (!readConsent().analytics || !analyticsEnabled || typeof window === 'undefined') return;
  const paq: Array<unknown> = (window._paq = window._paq ?? []);
  paq.push(['trackEvent', category, action, name ?? '']);
}
