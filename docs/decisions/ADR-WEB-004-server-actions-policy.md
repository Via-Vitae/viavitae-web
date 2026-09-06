# ADR-WEB-004 — Server Actions policy

- **Status:** Accepted
- **Owner:** ViaVitae sole maintainer (four-eyes reviewer: @IterVitae)
- **Date:** 2026-09-06

## Context

Next.js Server Actions allow form handlers to run on the server without a hand-written API
route. Used carelessly they become an unauthenticated, un-rate-limited mutation surface that
is invisible to the API contract and hard to audit — a poor fit for a funnel that feeds a CRM
and is in scope for GDPR and abuse (bot) protection.

## Decision

**Server Actions are not used for data mutations that leave the web tier.** All such
mutations go through explicit, contract-typed `app/api/*` route handlers:

- `app/api/assessment/route.ts` → `POST /v1/assessment` (viavitae-api).
- `app/api/quote/route.ts` → `POST /v1/quotes` (viavitae-api).

These route handlers are the single place where we apply: server-side Zod validation against
the generated contract, rate limiting, the honeypot bot trap, UTM passthrough, the
`Idempotency-Key`, and the service-to-service token (`lib/bitrix24.ts`).

Server Actions **may** be used only for stateless, non-persisting UI concerns (e.g. a
"copy to clipboard" acknowledgement or a theme preference) and must never:

- write to a database, CRM or third party;
- accept personal data;
- bypass the API contract.

## Consequences

- Every mutation is observable, rate-limited, validated and contract-tested.
- Slightly more code than an inline Server Action, but the security and audit posture is
  worth it for a regulated funnel.
- `app/api/*` handlers are server-only by construction; `lib/bitrix24.ts` imports
  `server-only` so a client bundle can never reach the CRM gateway.

## Alternatives considered

- **Server Actions for the funnel:** rejected — no natural home for rate limiting,
  idempotency and contract validation; weak auditability.
- **tRPC / GraphQL layer:** rejected — the OpenAPI contract (ADR-WEB-005) is already the
  cross-repo source of truth; a second RPC schema would duplicate it.

## Compliance impact

Keeps personal-data handling on an explicit, DPIA-covered path (DPIA-001) with server-side
validation and minimisation, and keeps CRM/API credentials off the client.
