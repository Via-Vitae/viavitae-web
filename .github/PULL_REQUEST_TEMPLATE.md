<!--
Pull request template — viavitae-web.
Titles must follow Conventional Commits (drives CHANGELOG.md):
  feat: fix: docs: style: refactor: perf: test: build: ci: chore: revert:
Keep PRs small (< 400 changed lines) per CONTRIBUTING.md.
-->

## Summary

<!-- What does this change do, and why? Link the issue. -->

Closes #

## Type of change

- [ ] Feature (`feat`)
- [ ] Bug fix (`fix`)
- [ ] Refactor / chore (`refactor` / `chore`)
- [ ] Content (`docs` / MDX)
- [ ] Dependency (`build` / Dependabot)
- [ ] CI (`ci`)

## Verification

- [ ] `pnpm verify` passes locally (generate-freshness, lint, typecheck, unit/contract, i18n, seo, header-split).
- [ ] `pnpm build` succeeds.
- [ ] New/changed behaviour is covered by a test (unit, contract, a11y or e2e).
- [ ] No secrets, tokens or `.env` values are present (Gitleaks clean).

## Web compliance checklist

**Accessibility (WCAG 2.2 AA — launch gate)**

- [ ] Keyboard-accessible with a visible `:focus-visible` state.
- [ ] Programmatic names on all controls; labels on all form fields.
- [ ] `axe` reports no new violations (`pnpm test:a11y`).
- [ ] Images have `alt`; decorative images are `alt=""`; motion has a reduced-motion variant.
- [ ] Colour contrast meets AA (uses `@via-vitae/brand` semantic tokens, not raw palette values).

**SEO**

- [ ] The page has an entry in `docs/seo/meta-matrix.json` (`pnpm check:seo` passes).
- [ ] Title/description come from localised message keys; canonical + hreflang emitted.
- [ ] Correct JSON-LD type(s) rendered (see `docs/seo/jsonld-catalog.md`).
- [ ] `index`/`noindex` matches the matrix (e.g. `/login` stays `noindex`).

**i18n**

- [ ] No hardcoded user-visible copy; all strings in `messages/*.json`.
- [ ] LT / EN / RU parity (`pnpm check:i18n` passes); PL / DE remain key-only stubs.
- [ ] Native review requested for new LT/RU strings (translation is a launch gate).
- [ ] Dates/numbers/currency use `lib/utils.ts` formatters (EUR, PVM).

**Core Web Vitals**

- [ ] No new render-blocking resources; images use `next/image` with AVIF/WebP + srcset.
- [ ] Lighthouse budgets still met (`pnpm lighthouse`); no CLS from injected media/consent banner.
- [ ] Client bundle size not increased without justification (`'use client'` islands stay small).

## Data protection & security

- [ ] No new personal-data processing without a DPIA entry (`docs/DPIA-template.md`); assessment-funnel changes reference **DPIA-001**.
- [ ] No new third-party processor/CDN/font/analytics outside the EEA without an ADR + DPA (QODER rule 7).
- [ ] Consent gating respected: analytics/marketing only load after opt-in; reject-all leaves them off.
- [ ] Contract changes: `docs/contracts/*.openapi.yaml` updated, version bumped, `pnpm generate:types` re-run (no hand-edits to `src/generated/`).
- [ ] Header split preserved: static headers only in `next.config.ts`, CSP nonce only in `middleware.ts` (ADR-WEB-002).

## Ownership

- [ ] CODEOWNERS four-eyes review requested (`@IterVitae`); compliance-critical paths (payment/donation/auth/consent/legal/DPIA) also need off-platform DPO / external sign-off.
- [ ] CHANGELOG.md updated for user-visible changes.
