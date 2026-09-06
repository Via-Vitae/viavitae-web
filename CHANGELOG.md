# Changelog

All notable changes to `viavitae-web` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and is driven by
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [Unreleased]

### Added

- Repository scaffold for the Next.js 15 App Router + React 19 marketing site.
- Localisation via `next-intl` for LT / EN / RU, with PL / DE message stubs.
- Security-header split: static headers in `next.config.ts`, per-request nonce CSP in
  `middleware.ts` (ADR-WEB-002).
- Cross-repo OpenAPI contracts under `docs/contracts/` with generated TypeScript types
  under `src/generated/` and a CI freshness gate (ADR-WEB-005).
- CI pipeline: lint, typecheck, contract-check, unit, build, Lighthouse CI, axe.
- Governance baseline inherited from `viavitae-template` (SECURITY, CONTRIBUTING, QODER,
  LICENSE, CODEOWNERS, dependabot, issue and PR templates, DPIA template).

### Notes

- Launch gates remain open: DPIA-001 + DPO sign-off, real legal content, real MDX/marketing
  content and native LT/RU review, imagery, `pnpm-lock.yaml`, and the `viavitae-api`
  implementation of `/v1/assessment` and `/v1/quotes`. See README.
