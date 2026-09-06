import 'server-only';
import createClient from 'openapi-fetch';
import type { paths } from '@/src/generated/assessment';
import { siteConfig } from './config';

// Thin, SERVER-ONLY gateway to viavitae-api.
//
// The browser never talks to the CRM, and this repo never holds Bitrix24
// credentials. Lead/CRM synchronisation is performed inside viavitae-api; the web
// tier only forwards a validated assessment payload over the generated contract.
// `server-only` makes any client-side import a hard build error.
//
// Types come from src/generated/assessment.ts, produced by `pnpm generate:types`
// from docs/contracts/assessment.openapi.yaml (ADR-WEB-005). Run that generator
// before typechecking; the CI `contract-check` job fails if the generated file is
// stale relative to the spec.

export function apiServiceToken(): string {
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) {
    // Fail closed: without a service token we must not call the API unauthenticated.
    throw new Error('API_SERVICE_TOKEN is not configured');
  }
  return token;
}

/** Typed client for the assessment contract, with the service-to-service token. */
export function createAssessmentClient() {
  return createClient<paths>({
    baseUrl: siteConfig.apiBase,
    headers: {
      Authorization: `Bearer ${apiServiceToken()}`,
      'Content-Type': 'application/json',
    },
  });
}

export type AssessmentRequestBody =
  paths['/assessment']['post']['requestBody']['content']['application/json'];

/**
 * Forward an assessment submission to viavitae-api.
 * `idempotencyKey` must be a client-generated UUID; retries reuse the same key so
 * the API can de-duplicate (see contract: 202 duplicate_ignored / 409).
 */
export async function submitAssessment(
  body: AssessmentRequestBody,
  idempotencyKey: string,
) {
  const client = createAssessmentClient();
  return client.POST('/assessment', {
    headers: { 'Idempotency-Key': idempotencyKey },
    body,
  });
}
