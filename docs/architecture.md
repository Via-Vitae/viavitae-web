# Architecture Decision Records — viavitae-web

This file is an **index only** (ADR-WEB-005 governance / review C3). It links to the
ADRs and never duplicates their content. The single source of truth for each decision is
its file under [`decisions/`](decisions/).

ADRs are append-only. Supersede by adding a new record and flipping the old one's
`Status`; never rewrite history.

## Format

Each ADR follows MADR: Status · Context · Decision · Consequences · Alternatives ·
Compliance impact · Owner · Date.

## Index

| ID | Title | Status | File |
| --- | --- | --- | --- |
| ADR-WEB-001 | App Router + React Server Components | Accepted | [decisions/ADR-WEB-001-app-router-rsc.md](decisions/ADR-WEB-001-app-router-rsc.md) |
| ADR-WEB-002 | Security-header split (static vs nonce CSP) | Accepted | [decisions/ADR-WEB-002-security-headers-split.md](decisions/ADR-WEB-002-security-headers-split.md) |
| ADR-WEB-003 | MDX content layer with locale fallback | Accepted | [decisions/ADR-WEB-003-mdx-content.md](decisions/ADR-WEB-003-mdx-content.md) |
| ADR-WEB-004 | Server Actions policy | Accepted | [decisions/ADR-WEB-004-server-actions-policy.md](decisions/ADR-WEB-004-server-actions-policy.md) |
| ADR-WEB-005 | Cross-repo contracts via OpenAPI + generated types | Accepted | [decisions/ADR-WEB-005-contracts-via-openapi.md](decisions/ADR-WEB-005-contracts-via-openapi.md) |

## Related governance

- Data protection: [`DPIA-template.md`](DPIA-template.md) — DPIA-001 (assessment funnel) is a launch gate.
- API contracts: [`contracts/`](contracts/) — OpenAPI single source of truth.
- SEO contract: [`seo/`](seo/) — per-page meta matrix, JSON-LD catalogue, hreflang map.
- Corporate baseline: `viavitae-template` (SECURITY.md, CONTRIBUTING.md, QODER.md, CODEOWNERS).
