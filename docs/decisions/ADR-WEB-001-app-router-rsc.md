# ADR-WEB-001 — App Router + React Server Components

- **Status:** Accepted
- **Owner:** ViaVitae sole maintainer (four-eyes reviewer: @IterVitae)
- **Date:** 2026-09-06

## Context

viavitae-web is a content-heavy, SEO-critical marketing and product site for a regulated
EU/Church vertical. It needs: strong organic search (server-rendered HTML, JSON-LD,
hreflang), first-class localisation (LT/EN/RU), Core Web Vitals within Lighthouse budgets,
and a clear boundary between public content and the client portal (Keycloak SSO).

## Decision

Adopt the **Next.js 15 App Router** with **React 19 Server Components** as the default
rendering model:

- Pages are Server Components by default; interactivity is opt-in via `'use client'`
  islands (forms, calculators, menus, consent).
- Locale routing uses a `[locale]` dynamic segment with `next-intl` and `localePrefix:
  'always'`, so every URL is explicitly localised and crawlable.
- Metadata, canonical URLs and JSON-LD are produced server-side
  (`components/seo/metadata-builder.ts`, `components/seo/jsonld.tsx`).
- `output: 'standalone'` for a minimal container runtime (see Dockerfile).

## Consequences

- Positive: SEO-friendly HTML without a client hydration round-trip; small client bundles;
  a single framework for content and API proxies (`app/api/*`).
- Negative: RSC/`'use client'` boundaries require discipline; some ecosystem libraries are
  still catching up to React 19. Mitigated by keeping client islands small and tested.
- The tier comparison table is rendered server-side (SSR) so price content is indexable.

## Alternatives considered

- **Pages Router:** weaker streaming/RSC ergonomics, being superseded.
- **Static export (`output: export`):** incompatible with `app/api/*` route handlers,
  middleware CSP nonce, and on-demand ISR of MDX content.
- **Astro / SvelteKit:** viable, but the org standardises on Next.js + React across repos
  and the private `@via-vitae/brand` preset targets Tailwind/React.

## Compliance impact

No personal data is processed by the rendering layer itself. The assessment funnel that
this architecture hosts is governed separately by DPIA-001. Server rendering keeps analytics
and CRM calls server-side, supporting data-minimisation and EU residency.
