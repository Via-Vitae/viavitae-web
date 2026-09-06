import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ADDONS, CATALOG, TIER_ORDER } from '@/lib/constants';

// Contract test (ADR-WEB-005, C4): the quote funnel must stay in lock-step with
// docs/contracts/quotes.openapi.yaml, and the spec's Product/Addon enums must match
// the marketing catalogue (types/catalog.ts ProductId, lib/constants.ts). Drift here
// would let the calculator send a product/add-on the API rejects.

const specPath = fileURLToPath(new URL('../../docs/contracts/quotes.openapi.yaml', import.meta.url));
const spec = parse(readFileSync(specPath, 'utf8')) as Record<string, any>;
const schemas = spec.components.schemas;

describe('quotes contract: spec invariants', () => {
  it('uses the bare /quotes path (server URL already ends in /v1)', () => {
    expect(spec.paths['/quotes']).toBeDefined();
    expect(spec.paths['/v1/quotes']).toBeUndefined();
    expect(spec.paths['/quotes'].post.operationId).toBe('createQuote');
  });

  it('returns the quote as a PDF on 200', () => {
    expect(spec.paths['/quotes'].post.responses['200'].content['application/pdf']).toBeDefined();
  });

  it('requires demonstrable consent (DPIA-001 R7), matching the assessment funnel', () => {
    expect(schemas.QuoteRequest.required).toContain('consent_notice_version');
    expect(schemas.QuoteRequest.properties.consent_privacy.const).toBe(true);
    expect(schemas.QuoteRequest.additionalProperties).toBe(false);
  });
});

describe('quotes contract: enum parity with the catalogue', () => {
  it('Product enum matches every CATALOG id (ProductId)', () => {
    expect([...schemas.Product.enum].sort()).toEqual([...CATALOG.map((p) => p.id)].sort());
  });

  it('Addon enum matches every ADDONS id', () => {
    expect([...schemas.Addon.enum].sort()).toEqual([...ADDONS.map((a) => a.id)].sort());
  });

  it('Tier enum matches TIER_ORDER', () => {
    expect([...schemas.Tier.enum].sort()).toEqual([...TIER_ORDER].sort());
  });
});
