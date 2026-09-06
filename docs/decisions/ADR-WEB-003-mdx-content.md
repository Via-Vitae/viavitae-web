# ADR-WEB-003 — MDX content layer with locale fallback

- **Status:** Accepted
- **Owner:** ViaVitae sole maintainer (four-eyes reviewer: @IterVitae)
- **Date:** 2026-09-06

## Context

Blog posts, news, guides and legal documents are authored by non-engineers, change often,
and must exist per locale (LT/EN/RU). Embedding prose in TSX would couple content releases to
code releases and make translation review impossible. UI strings and long-form content have
different lifecycles and different owners.

## Decision

Separate **UI strings** from **content**:

- **UI strings** live in `messages/<locale>.json` and are accessed with `next-intl`
  (`useTranslations`). Components must never hardcode visible copy.
- **Long-form content** lives in `content/<collection>/<locale>/*.mdx` with typed
  front-matter (`types/content.ts`). Collections: `blog`, `news`, `guides`, `legal`.
- Content is read server-side by `components/mdx/content-loader.ts` and rendered with
  `next-mdx-remote/rsc` through `components/mdx/mdx-components.tsx`, which enforces
  accessible images (`alt` required) and heading ids.

### Locale fallback chain

`content-loader.ts` resolves a document for locale `L` as: `content/<c>/L/slug.mdx` →
`content/<c>/en/slug.mdx` → not-found. English is the fallback of last resort so a missing
translation degrades to readable content instead of a 404. Legal documents are the
**exception**: they never fall back, because a legal text in the wrong language/jurisdiction
is worse than none (see launch gate).

## Consequences

- Content releases do not require a code deploy; on-demand ISR revalidates via
  `CONTENT_REVALIDATE_SECRET`.
- `scripts/check-i18n-parity.ts` enforces UI-string parity across LT/EN/RU; PL/DE are
  key-only stubs excluded from the parity gate and rendered disabled in the switcher.
- Front-matter is validated at load; an invalid document fails loudly rather than rendering
  half a page.

## Alternatives considered

- **Headless CMS (Strapi/Contentful):** adds a processor, an EEA-residency question and a
  DPA (QODER rule 7). Deferred; MDX-in-git keeps content under the same review and licence
  controls as code.
- **`@next/mdx` file-import only:** poor fit for per-locale runtime resolution and fallback.

## Compliance impact

Legal MDX is a **launch gate**: real, jurisdiction-correct text from Legal must be present
before go-live; no placeholder legal prose is fabricated. Content is stored in-git within the
EEA-hosted source platform.
