// Environment-typed site configuration. Only NEXT_PUBLIC values are read here,
// so this module is safe to import from both server and client components.
// Server-only secrets (API_SERVICE_TOKEN, CONTENT_REVALIDATE_SECRET, KEYCLOAK_*)
// are read directly in the server modules that need them and never re-exported.

function requiredPublic(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value) {
    // Do not throw at import time: that would break static analysis and the
    // build. Warn loudly and fall back so the misconfiguration is visible.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[config] missing NEXT_PUBLIC env var: ${name}; using fallback "${fallback}"`);
    }
    return fallback;
  }
  return value.replace(/\/$/, '');
}

export const siteConfig = {
  /** Brand name; not localised (proper noun). */
  name: 'ViaVitae',
  legalEntity: 'ViaVitae IT Technologies',
  /** Canonical site origin, no trailing slash. */
  url: requiredPublic('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  /** viavitae-api base, including the /v1 prefix (see docs/contracts). */
  apiBase: requiredPublic('NEXT_PUBLIC_API_URL', 'http://localhost:8000/v1'),
  /** Demo origin framed by demo-embed.tsx. */
  demoBase: requiredPublic('NEXT_PUBLIC_DEMO_URL', 'https://demo.viavitae.com'),
  matomo: {
    url: process.env.NEXT_PUBLIC_MATOMO_URL?.replace(/\/$/, '') ?? '',
    siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? '',
  },
} as const;

/** True when analytics can be wired up (URL + site id present). */
export const analyticsEnabled = Boolean(siteConfig.matomo.url && siteConfig.matomo.siteId);
