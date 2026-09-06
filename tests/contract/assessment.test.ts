import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { ASSESSMENT_GOALS, CONSENT_NOTICE_VERSION, ORGANIZATION_TYPES } from '@/lib/constants';

// Contract test (ADR-WEB-005, C4): the assessment funnel must stay in lock-step with
// docs/contracts/assessment.openapi.yaml. This asserts (1) the enums in the spec match
// lib/constants.ts, (2) the GDPR-critical fields are shaped correctly, and (3) real
// payloads validate against the spec schema compiled by ajv (JSON Schema 2020-12,
// which is what OpenAPI 3.1 uses).

const specPath = fileURLToPath(new URL('../../docs/contracts/assessment.openapi.yaml', import.meta.url));
const spec = parse(readFileSync(specPath, 'utf8')) as Record<string, any>;
const schemas = spec.components.schemas;

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(spec, 'assessment.yaml');
const validateRequest = ajv.getSchema('assessment.yaml#/components/schemas/AssessmentRequest');

const validPayload = {
  organization_type: 'parish_church',
  contact_email: 'secretary@parish.lt',
  consent_privacy: true,
  consent_notice_version: CONSENT_NOTICE_VERSION,
  locale: 'en',
};

describe('assessment contract: spec invariants', () => {
  it('uses the bare /assessment path (server URL already ends in /v1)', () => {
    expect(spec.paths['/assessment']).toBeDefined();
    expect(spec.paths['/v1/assessment']).toBeUndefined();
    expect(spec.paths['/assessment'].post.operationId).toBe('submitAssessment');
  });

  it('requires demonstrable consent (DPIA-001 R7)', () => {
    expect(schemas.AssessmentRequest.required).toContain('consent_notice_version');
    expect(schemas.AssessmentRequest.properties.consent_privacy.const).toBe(true);
    expect(schemas.AssessmentRequest.additionalProperties).toBe(false);
  });

  it('requires the Idempotency-Key header on the operation', () => {
    const params = spec.paths['/assessment'].post.parameters ?? [];
    const idem = params.find((p: any) => p.name === 'Idempotency-Key');
    expect(idem?.required).toBe(true);
  });
});

describe('assessment contract: enum parity with lib/constants', () => {
  it('OrganisationType matches ORGANIZATION_TYPES exactly', () => {
    expect([...schemas.OrganizationType.enum].sort()).toEqual([...ORGANIZATION_TYPES].sort());
  });
  it('AssessmentGoal matches ASSESSMENT_GOALS exactly', () => {
    expect([...schemas.AssessmentGoal.enum].sort()).toEqual([...ASSESSMENT_GOALS].sort());
  });
  it('CurrentSiteStatus matches the form options', () => {
    expect([...schemas.CurrentSiteStatus.enum].sort()).toEqual(
      ['no_website', 'outdated', 'needs_redesign', 'unhappy_with_provider'].sort(),
    );
  });
});

describe('assessment contract: ajv payload validation', () => {
  it('accepts a valid submission', () => {
    expect(validateRequest?.(validPayload)).toBe(true);
  });

  it('rejects consent_privacy: false', () => {
    expect(validateRequest?.({ ...validPayload, consent_privacy: false })).toBe(false);
  });

  it('rejects an unknown organisation type', () => {
    expect(validateRequest?.({ ...validPayload, organization_type: 'spaceport' })).toBe(false);
  });

  it('rejects additional properties (data minimisation)', () => {
    expect(validateRequest?.({ ...validPayload, national_id: '123' })).toBe(false);
  });

  it('rejects a malformed email and too many goals', () => {
    expect(validateRequest?.({ ...validPayload, contact_email: 'nope' })).toBe(false);
    expect(
      validateRequest?.({
        ...validPayload,
        goals: ['new_website', 'ecommerce', 'donations', 'crm_integration', 'ai_assistant', 'cemetery_map'],
      }),
    ).toBe(false);
  });

  it('accepts a nullable current_site_url (OpenAPI 3.1 type array)', () => {
    expect(validateRequest?.({ ...validPayload, current_site_url: null })).toBe(true);
    expect(validateRequest?.({ ...validPayload, current_site_url: 'https://parish.lt' })).toBe(true);
  });
});
