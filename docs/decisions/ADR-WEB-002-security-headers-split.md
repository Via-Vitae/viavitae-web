# ADR-WEB-002 — Security-header split (static headers vs nonce CSP)

- **Status:** Accepted
- **Owner:** ViaVitae sole maintainer (four-eyes reviewer: @IterVitae)
- **Date:** 2026-09-06

## Context

The v1.0 tree set security headers in **both** `next.config.ts` (CSP, HSTS, headers) and
`middleware.ts` (security headers, CSP nonce). Two sources for the same header class drift
apart, and a duplicated `Content-Security-Policy` header is enforced as the _intersection_
of both policies by browsers — a subtle, hard-to-debug failure. A nonce-based CSP must be
computed **per request**, which `next.config.ts` (build-time, static) cannot do.

## Decision

Split header responsibility with **no overlap**:

- **`next.config.ts` → static headers only** (identical on every response, no per-request
  state): `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`. It must **not** set `Content-Security-Policy`.
- **`middleware.ts` → dynamic, per-request concerns only**: the nonce-bearing
  `Content-Security-Policy`, locale negotiation, and redirects. It must **not** re-set the
  static headers above.

CSP highlights: `script-src 'self' 'nonce-…' 'strict-dynamic'` (no `unsafe-inline` for
scripts); `frame-ancestors 'none'`; `object-src 'none'`; `connect-src` limited to the API
and the (EEA-hosted) Matomo origin; `frame-src` allows `demo.viavitae.com` for
`demo-embed.tsx`.

### Accepted residual risk

`style-src` retains `'unsafe-inline'`. Next.js and `next-intl` inject inline `<style>` whose
nonce cannot be reliably propagated to every emitter. Scoping `unsafe-inline` to styles
(not scripts) keeps the meaningful XSS surface closed while avoiding broken rendering. This
is reviewed whenever Next exposes a stable style-nonce API.

## Enforcement

`scripts/check-header-split.mjs` (CI job `contract-check`) fails the build if
`Content-Security-Policy` appears in `next.config.ts`, or if a static header name appears in
`middleware.ts`. This makes the boundary machine-checked, not merely documented.

## Consequences

- One authoritative source per header; no intersection surprises.
- CSP nonce rotates every request, defeating script injection that relies on a fixed policy.
- Adding a new static header goes in `next.config.ts`; anything per-request goes in
  `middleware.ts` and needs an ADR update.

## Alternatives considered

- **All headers in `next.config.ts`:** cannot express a per-request nonce. Rejected.
- **All headers in `middleware.ts`:** workable, but static assets served outside the
  middleware matcher would lose HSTS/nosniff. Rejected.

## Compliance impact

Supports the security baseline in SECURITY.md and WCAG/GDPR expectations by default-deny
framing and strict script sourcing. No personal data involved.
