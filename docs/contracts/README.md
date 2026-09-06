# Cross-repo API contracts

These OpenAPI 3.1 files are the **single source of truth** for the request/response
shapes shared between `viavitae-web` and `viavitae-api` (ADR-WEB-005).

| File | Purpose | Web artefact |
| --- | --- | --- |
| `assessment.openapi.yaml` | Assessment funnel `POST /v1/assessment` | `src/generated/assessment.ts` |
| `quotes.openapi.yaml` | Quote PDF `POST /v1/quotes` | `src/generated/quotes.ts` |

## Rules

1. **Never hand-edit generated files.** `src/generated/*.ts` is emitted by
   `openapi-typescript` and overwritten on every run.
2. **Both consumers generate from the same file.** `viavitae-web` generates
   TypeScript; `viavitae-api` generates Pydantic models. If they diverge, the
   contract — not the generated code — is wrong.
3. **A change to a contract is a breaking-change review.** A PR touching these
   files requires the maintainer's approval plus `@IterVitae` four-eyes review, an `info.version` bump, and
   regeneration by every consumer in the same release train.

## Generate types

```bash
pnpm generate:types   # openapi-typescript -> src/generated/{assessment,quotes}.ts
```

`generate:types` also runs automatically as `prebuild` before `next build`.

## CI freshness gate

`scripts/check-generated-fresh.ts` re-runs the generator into a temp directory and
diffs it against the committed `src/generated/*.ts`. If they differ, the
`contract-check` CI job fails: someone edited the spec without regenerating, or
hand-edited a generated file.

## Path convention

Server URLs already end in `/v1`, so operation paths are `/assessment` and
`/quotes` — **not** `/v1/assessment`. The web client sets `baseUrl` to
`NEXT_PUBLIC_API_URL` (which includes `/v1`) and calls the bare path.
