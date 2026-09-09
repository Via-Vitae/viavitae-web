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

### Private registry (`@via-vitae/brand`)

Design tokens, the Tailwind preset and CSS custom properties come from the private package
`@via-vitae/brand`, published to GitHub Packages. Create a project `.npmrc` (git-ignored):

```
@via-vitae:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`NODE_AUTH_TOKEN` is a PAT with `read:packages`, supplied by the repository owner (or the
platform team once formed). CI and the Docker build inject it as a secret; it is never
committed.

> **Cross-repo gate.** `@via-vitae/brand` is not published yet, so `pnpm install` and
> `pnpm build` are blocked until the `viavitae-brand` repository publishes it to GitHub
> Packages under the `Via-Vitae` org. This is an external dependency, not a defect here.

### Verification

```bash
pnpm verify   # generate-freshness + lint + typecheck + unit/contract tests + i18n/seo/header gates
pnpm test:e2e # Playwright against PLAYWRIGHT_BASE_URL (staging only)
pnpm lighthouse
```

> **Coverage gate (read before the first CI run).** `ci.yml` enforces
> `COVERAGE_MIN=80` for lines/statements, and `vitest.config.ts` adds `functions`≥ 75
> and `branches`≥ 70, measured over `lib/**`, `components/**` **and** `app/**`
> (`coverage.all` defaults to true, so untouched files count as 0%). The scaffold ships a
> _baseline_ unit suite (pure `lib` helpers + the metadata builder); it does **not** yet
> reach 80%, so the `unit` job will fail on coverage until one of the following is done:
>
> 1. **Expand the suite** to the target — component tests (`@testing-library/react`) and
>    route-handler tests for `app/api/*`; or
> 2. **Set the floor to the measured baseline** — run `pnpm test -- --coverage`, then set
>    `COVERAGE_MIN` (and the config thresholds) to that number and ratchet up per PR.
>
> `app/**` is Server Components / route handlers, which are covered by the contract + e2e
> suites rather than jsdom unit tests; consider scoping `app/**` out of `coverage.include`.

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
