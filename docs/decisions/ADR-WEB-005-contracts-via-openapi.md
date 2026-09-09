# ADR-WEB-005 — Cross-repo contracts via OpenAPI + generated types

- **Status:** Accepted
- **Owner:** ViaVitae sole maintainer (four-eyes reviewer: @IterVitae)
- **Date:** 2026-09-06

## Context

`viavitae-web` and `viavitae-api` share the assessment-funnel and quote payloads. In the
v1.0 tree the web repo carried a **hand-written** `types/assessment.ts` described as "shared
with viavitae-api". A hand-copied type in two repos is not shared — it is duplicated, and the
two copies drift the moment one side changes a field. Drift between a client and a server
contract surfaces only in production.

## Decision

Introduce **OpenAPI 3.1 contracts as the single source of truth** under `docs/contracts/`:

- `assessment.openapi.yaml`, `quotes.openapi.yaml`.
- `viavitae-web` generates TypeScript into `src/generated/*.ts` via `openapi-typescript`
  (`pnpm generate:types`, also run as `prebuild`).
- `viavitae-api` generates Pydantic models from the same files.
- The hand-written `types/assessment.ts` is **deleted**. Only generated contract types and
  genuinely web-local domain types remain (`types/catalog.ts`, `types/content.ts`).
- Client code consumes the API through `openapi-fetch`, so request/response shapes are typed
  from the spec (`lib/bitrix24.ts`, `app/api/*`).

### Generated-code boundary

Generated artefacts live under `src/generated/` — deliberately isolated from the otherwise
flat root layout (`app/`, `components/`, `lib/`, `types/`) so the "do not edit" boundary is
unmistakable and lint/coverage ignore it. _(Trade-off noted during review: this is the one
`src/` directory in an otherwise flat repo. It was kept because the isolation value outweighs
the layout inconsistency; `@/*` still maps to the repo root, so imports read
`@/src/generated/assessment`.)_

### Freshness gate

`scripts/check-generated-fresh.ts` regenerates into a temp dir and diffs against the committed
files; the `contract-check` CI job fails on any difference. This catches both "spec changed,
types not regenerated" and "someone hand-edited a generated file".

### Contract correctness fixes applied during review

- Operation paths are `/assessment` and `/quotes` (server URL already ends in `/v1`); the
  draft's `/v1/assessment` would have produced `/v1/v1/assessment`.
- `consent_privacy: const true` makes a `false` value a **400** schema violation, not 422.

## Consequences

- One authoritative schema; client and server cannot silently diverge.
- A contract change is a reviewed, versioned, regenerate-all-consumers event.
- Local typecheck requires running `pnpm generate:types` first (the generated files are
  committed, so a fresh clone typechecks after `pnpm install`).

## Alternatives considered

- **Hand-maintained shared types (v1.0):** rejected — duplication and drift.
- **A shared `@via-vitae/contracts` npm package:** viable later; heavier to version and
  publish. OpenAPI-in-git with per-repo generation is simpler now and can graduate to a
  package without changing the source of truth.

## Compliance impact

Data-minimisation and purpose-limitation for the funnel are expressed in the contract itself
(`additionalProperties: false`, bounded fields, explicit consent), which DPIA-001 references.
