import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/routing';

// ADR-WEB-002: middleware owns DYNAMIC, per-request concerns only —
//   1. locale negotiation and locale-prefixed redirects (next-intl),
//   2. the nonce-bearing Content-Security-Policy.
// Static headers (HSTS, X-Content-Type-Options, ...) live in next.config.ts.
// scripts/check-header-split.mjs fails CI if a static header is set here or if
// CSP is set in next.config.ts.
const intlMiddleware = createMiddleware(routing.locales, {
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

// Origins allowed by CSP. These appear in a public response header, so they are
// NEXT_PUBLIC by design. Missing values fall back to same-origin only.
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? '';
const matomoOrigin = process.env.NEXT_PUBLIC_MATOMO_URL ?? '';
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? '';
const demoOrigin = process.env.NEXT_PUBLIC_DEMO_URL ?? 'https://demo.viavitae.com';

function originOf(value: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Generate a per-request CSP nonce. Uses the Web Crypto API, which is available
 * in the Edge runtime that middleware runs in. 16 random bytes -> base64.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function buildCsp(nonce: string): string {
  const connectSrc = ["'self'", originOf(apiOrigin), originOf(matomoOrigin), originOf(siteOrigin)]
    .filter((v): v is string => Boolean(v));
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    // Nonce + strict-dynamic: no 'unsafe-inline' for scripts. Every inline script
    // Next emits carries the nonce, and it may load further same-origin scripts.
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    // Next.js and next-intl inject inline <style>; a style nonce is not reliably
    // propagated to all of them, so 'unsafe-inline' is scoped to styles only.
    // Accepted residual risk recorded in ADR-WEB-002.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'connect-src': connectSrc,
    // demo.viavitae.com is framed by demo-embed.tsx.
    'frame-src': ["'self'", originOf(demoOrigin) ?? demoOrigin].filter(Boolean) as string[],
    'upgrade-insecure-requests': [],
  };
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join('; ');
}

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // API routes return JSON and must not be locale-redirected or CSP-nonced.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request) as NextResponse;
  const nonce = generateNonce();
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  // Forward the nonce so server components can attach it to any manual <script>.
  response.headers.set('x-nonce', nonce);
  return response;
}

export const config = {
  // Run on all page routes; skip Next internals, the API, and static assets.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
