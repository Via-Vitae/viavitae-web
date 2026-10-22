# viavitae-web

The public ViaVitae marketing and product website: a **Next.js 15 App Router** application
with **React 19**, server-first rendering, `next-intl` localisation (LT / EN / RU, with PL
and DE stubbed as "coming soon"), MDX content, and generated cross-repo API contracts.

> **Status: pre-launch scaffold.** The architecture, governance, CI and code contracts are
> complete. Several items are **launch gates** that must be closed by their owners before
> production — see [Launch gates](#launch-gates). Nothing here is wired to live personal-data
> processing until DPIA-001 is signed off by the DPO.

---

## Quickstart

```bash
corepack enable                 # activates the pinned pnpm
pnpm install --frozen-lockfile  # requires access to GitHub Packages (see below)
pnpm generate:types             # emit src/generated/*.ts from docs/contracts/*.openapi.yaml
cp .env.example .env.local      # then fill in values — never commit them
pnpm dev                        # http://localhost:3000
```

> **First-time bootstrap.** `pnpm-lock.yaml` and `src/generated/*.ts` are committed
> artefacts that this pre-launch scaffold does not yet contain — they cannot be produced
> offline (no network, and generated output must never be fabricated). On the first
> networked setup run `pnpm install` **without** `--frozen-lockfile` to create the
> lockfile, then `pnpm generate:types`, and commit both. Afterwards — and always in CI —
> use `pnpm install --frozen-lockfile`.

### `@via-vitae/brand` (workspace package)

Design tokens, the Tailwind preset and CSS custom properties come from `@via-vitae/brand`,
resolved as a **local workspace package** (`packages/brand/`, declared `workspace:*` in
`package.json`). No registry auth or `.npmrc` is required — `pnpm install` and `pnpm build`
work out of the box, locally and in CI.

> If the package is later published to GitHub Packages under the `Via-Vitae` org, restore the
> registry `.npmrc` (`@via-vitae:registry=https://npm.pkg.github.com`), the CI install steps,
> and the Docker BuildKit `npmrc` secret.

### Verification

```bash
pnpm verify   # generate-freshness + lint + typecheck + unit/contract tests + i18n/seo/header gates
pnpm test:e2e # Playwright against PLAYWRIGHT_BASE_URL (staging only)
pnpm lighthouse
```

> **Coverage gate.** The enforced thresholds live in `vitest.config.ts` (the `unit` job
> runs `pnpm test -- --coverage`, which fails the build if any floor is missed). Current
> floors: `lines`/`statements` ≥ 19%, `branches` ≥ 64%, `functions` ≥ 36%, measured over
> `lib/**`, `components/**` **and** `app/**` (`coverage.all` is true, so untouched Server
> Components count as 0% — the aggregate is therefore low even though tested modules run
> 83–100%: `lib/` 83%, the assessment route handler 98%, the quote route handler 100%,
> and the `AssessmentForm`/`QuoteCalculator`/`CookieConsent` components 91/98/100%). These
> are **measured baselines**, ratcheted upward per PR as tests are added — run
> `pnpm test -- --coverage`, then raise the `thresholds` block to the new number. There is
> no `COVERAGE_MIN` env var; the config is the single source of truth.

---

## Architecture

- **[docs/architecture.md](docs/architecture.md)** — ADR index (links only).
- **[docs/decisions/](docs/decisions/)** — the ADRs themselves (single source of truth):
  - ADR-WEB-001 — App Router + React Server Components
  - ADR-WEB-002 — Security-header split (static in `next.config.ts`, nonce CSP in `middleware.ts`)
  - ADR-WEB-003 — MDX content layer with locale fallback
  - ADR-WEB-004 — Server Actions policy
  - ADR-WEB-005 — Cross-repo contracts via OpenAPI + generated types
- **[docs/contracts/](docs/contracts/)** — OpenAPI specs, the single source of truth for
  types shared with `viavitae-api`. TS types under `src/generated/` are generated from these
  and must never be hand-edited (`scripts/check-generated-fresh.ts` enforces this in CI).
- **[docs/seo/](docs/seo/)** — per-page meta matrix, JSON-LD catalogue, hreflang map.

### Layout

The repository uses a **flat root layout** (`app/`, `components/`, `lib/`, `types/`) with the
single exception of `src/generated/`, which is isolated so the "do not edit" boundary is
obvious. `@/*` maps to the repository root.

---

## Governance

This repository inherits the ViaVitae corporate baseline from `viavitae-template`:
[SECURITY.md](SECURITY.md) (72-hour breach SLA), [CONTRIBUTING.md](CONTRIBUTING.md)
(Conventional Commits, small-PR doctrine), [QODER.md](QODER.md) (AI pair-programming rules),
[LICENSE](LICENSE) (Proprietary — All Rights Reserved), and [.github/CODEOWNERS](.github/CODEOWNERS).

Personal-data processing is governed by [docs/DPIA-template.md](docs/DPIA-template.md);
**DPIA-001** covers the assessment funnel.

Ownership is adapted to reality: this is a **public** repository under the `Via-Vitae` org
with a **sole maintainer** and one independent **four-eyes reviewer** (`@IterVitae`) — see
[.github/CODEOWNERS](.github/CODEOWNERS). The template's multi-team owners are collapsed to
that reviewer; compliance-critical paths additionally need DPO / external sign-off.

---

## Launch gates

These are intentionally **not** fabricated by the scaffold and must be supplied by their
owners before go-live:

| Gate                                                                                 | Owner                 | Blocks                                         |
| ------------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------- |
| DPIA-001 completion + DPO sign-off (GDPR Art. 9 — church vertical)                   | DPO / compliance      | Assessment funnel, `start-for-free`, donations |
| Real legal entity content for `legal/{privacy,terms,cookies,impressum}` (LT imprint) | Legal                 | Legal pages, footer links                      |
| Real marketing/MDX content + native LT/RU translation review                         | Content / marketing   | Blog, news, guides, product prose              |
| Imagery: heroes, products, church, team, per-locale OG images                        | Design                | `public/images`, `public/og`                   |
| `pnpm-lock.yaml` (generated by `pnpm install`)                                       | Engineering           | Reproducible installs, Dependabot              |
| `src/generated/*.ts` (from `pnpm generate:types`)                                    | Engineering           | Typecheck, build, typed API client             |
| `viavitae-api` implementing `/v1/assessment` and `/v1/quotes`                        | API team              | Live form submission, quotes                   |
| Processor DPAs + EEA residency: Matomo (self-hosted), Stripe, Bitrix24, Keycloak     | Compliance / platform | Analytics, payments, CRM, SSO                  |

See [docs/DPIA-template.md](docs/DPIA-template.md) and the ADRs for the compliance rationale.
