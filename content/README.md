# `content/` — MDX content model

Locale-aware MDX documents read at render time by
[`components/mdx/content-loader.ts`](../components/mdx/content-loader.ts) and
validated against the front-matter contracts in
[`types/content.ts`](../types/content.ts). Design rationale: **ADR-WEB-003**
(`docs/decisions/ADR-WEB-003-mdx-content.md`).

## Layout

```
content/
├── blog/    <locale>/<slug>.mdx
├── news/    <locale>/<slug>.mdx
├── guides/  <locale>/<slug>.mdx
└── legal/   <locale>/<slug>.mdx   # launch-gated (GDPR + LT imprint)
```

`<locale>` is one of the **routing locales** `lt | en | ru` (see
`lib/routing.ts`). `pl` / `de` are "coming soon" UI stubs and are **not** valid
content locales. `<slug>` is the canonical slug with no locale prefix; it must
equal the `slug` field in the document's front-matter.

Empty locale directories are preserved with `.gitkeep`.

## Locale fallback

`getDoc(collection, locale, slug)` resolves in this order:

| Collection             | Fallback chain    | Why                                                                 |
| ---------------------- | ----------------- | ------------------------------------------------------------------- |
| `blog` `news` `guides` | `locale` → `en`   | Marketing content may safely fall back to English.                  |
| `legal`                | `locale` **only** | A legal text in the wrong language/jurisdiction is worse than none. |

When no file resolves, `getDoc` returns `null` and the page renders a
launch-gate notice instead of fabricated text. When a file resolves but its
front-matter is invalid, the loader **throws** (fail loud, never render half a
page).

## Front-matter contracts

Shared by every document (`BaseFrontMatter`):

| Field         | Type         | Required | Notes                                      |
| ------------- | ------------ | -------- | ------------------------------------------ |
| `title`       | string (≥1)  | yes      | Plain string; localisation lives per-file. |
| `description` | string (≥1)  | yes      | Used for meta + cards.                     |
| `locale`      | `lt\|en\|ru` | yes      | Must mirror the directory it lives under.  |
| `slug`        | string (≥1)  | yes      | Canonical slug, no locale prefix.          |
| `draft`       | boolean      | no       | Drafts are excluded from `listSlugs`.      |

Per-collection additions (enforced by the zod schemas in `content-loader.ts`):

- **blog** — `kind: 'blog'`, `publishedAt` (`YYYY-MM-DD`), `author`, `category`;
  optional `updatedAt` (`YYYY-MM-DD`), `tags` (string[]), `image` (path under
  `public/images`, launch-gated).
- **news** — `kind: 'news'`, `publishedAt` (`YYYY-MM-DD`); optional `source`.
- **guides** — `kind: 'guide'`, `topic`; optional `readingMinutes` (positive
  int), `updatedAt` (`YYYY-MM-DD`).
- **legal** — `kind: 'legal'`, `doc` (`privacy|terms|cookies|impressum`),
  `effectiveDate` (`YYYY-MM-DD`), `version`.

## `TEMPLATE.mdx.example`

Each collection ships a `TEMPLATE.mdx.example` at the collection root as a
copy-paste starting point. The `.example` suffix is deliberate: `listSlugs`
filters on `name.endsWith('.mdx')` and `getDoc` reads an exact `<slug>.mdx`, so
templates are **inert** — never listed, never rendered. To author a document,
copy the template into the target locale directory, rename it to
`<slug>.mdx`, and replace every `TODO`.

## Launch gate (QODER rule 4)

No published prose, and **no legal text**, is fabricated in this repository.
Before go-live the following are required:

1. Real `legal/{privacy,terms,cookies,impressum}` for every served locale, from
   Legal — including the **LT legal imprint** for `/legal/impressum`.
2. Real `blog` / `news` / `guides` entries (or the pages intentionally left
   empty, showing the launch-gate notice).
3. DPIA-001 sign-off for any content that touches the assessment funnel.

Until then the `legal/*` pages render `legal.pendingNotice` and the resource
indexes render empty lists — both are honest, non-fabricated states.
