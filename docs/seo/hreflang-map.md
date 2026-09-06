# hreflang map

Every indexable page is served under each routable locale with `localePrefix: 'always'`
(`lib/routing.ts`). Language alternates are emitted two ways, which must agree:

1. `<link rel="alternate" hreflang="…" href="…">` in each page's `<head>` (via
   `components/seo/metadata-builder.ts` → Next `alternates.languages`).
2. `xhtml:link` alternate entries per URL in `app/sitemap.ts`.

## Locale → hreflang

| Locale | URL prefix | `hreflang` | Language | Status |
| --- | --- | --- | --- | --- |
| `lt` | `/lt/…` | `lt` | Lithuanian | Live (default / pilot market) |
| `en` | `/en/…` | `en` | English | Live |
| `ru` | `/ru/…` | `ru` | Russian | Live |
| `pl` | — | — | Polish | **Not routable** — "coming soon" in the switcher; no URLs, no hreflang |
| `de` | — | — | German | **Not routable** — "coming soon"; no URLs, no hreflang |

## x-default

`x-default` points at the **`lt`** variant: Lithuania is the pilot market and the default
locale, so an unlocalised or unknown-language visitor lands on Lithuanian. `middleware.ts`
performs Accept-Language negotiation for the unprefixed `/` before any alternate is chosen.

## Rules

- Alternates are emitted **only** for `index: true` pages in `meta-matrix.json`. `/login`
  (`index: false`) emits `robots: noindex` and no alternates.
- The alternate set is always the full `{lt, en, ru}` × `{self}` cross-product plus
  `x-default`; a page missing in one locale falls back per ADR-WEB-003 but still advertises
  all three alternates so crawlers see a complete cluster.
- `legal/*` alternates exist per locale, but each locale's legal text is authored for its own
  jurisdiction; the LT `impressum` is the LT legal imprint (launch gate — real content).
