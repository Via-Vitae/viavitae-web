import { z } from 'zod';
import { ASSESSMENT_GOALS, ORGANIZATION_TYPES } from './constants';

// Single source of runtime validation for the assessment funnel, mirroring
// docs/contracts/assessment.openapi.yaml (ADR-WEB-005). Both the client form
// (components/church/assessment-form.tsx) and the server proxy
// (app/api/assessment/route.ts) validate against THIS schema, so the two can never
// drift. tests/contract asserts the schema matches the OpenAPI contract.

const optionalText = (min: number, max: number) =>
  z.string().min(min).max(max).optional().or(z.literal(''));

export const assessmentRequestSchema = z
  .object({
    organization_type: z.enum(ORGANIZATION_TYPES),
    organization_name: optionalText(2, 200),
    current_site_url: z.string().url().max(2048).optional().or(z.literal('')),
    current_status: z
      .enum(['no_website', 'outdated', 'needs_redesign', 'unhappy_with_provider'])
      .optional(),
    goals: z.array(z.enum(ASSESSMENT_GOALS)).max(5).default([]),
    message: z.string().max(2000).optional().or(z.literal('')),
    contact_name: optionalText(2, 120),
    contact_email: z.string().email().max(254),
    contact_phone: z
      .string()
      .regex(/^\+?[0-9 ()-]{6,20}$/)
      .max(20)
      .optional()
      .or(z.literal('')),
    preferred_language: z.enum(['lt', 'en', 'ru', 'pl', 'de']).optional(),
    locale: z.enum(['lt', 'en', 'ru']),
    utm: z
      .object({
        source: z.string().max(120).optional(),
        medium: z.string().max(120).optional(),
        campaign: z.string().max(120).optional(),
      })
      .optional()
      .nullable(),
    consent_privacy: z.literal(true),
    consent_notice_version: z.string().min(1).max(40),
    consent_marketing: z.boolean().default(false),
    honeypot: z.string().max(0).optional().or(z.literal('')),
  })
  .strict();

// The client form validates the user's inputs; locale + consent_notice_version are
// appended at submit time (see assessment-form.tsx), so they are omitted here.
export const clientAssessmentSchema = assessmentRequestSchema.omit({
  locale: true,
  consent_notice_version: true,
});

export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;
export type AssessmentFormValues = z.input<typeof clientAssessmentSchema>;
