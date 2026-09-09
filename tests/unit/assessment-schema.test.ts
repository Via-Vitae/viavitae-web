import { describe, expect, it } from "vitest";
import { assessmentRequestSchema, clientAssessmentSchema } from "@/lib/assessment-schema";
import { CONSENT_NOTICE_VERSION } from "@/lib/constants";

const valid = {
  organization_type: "parish_church",
  contact_email: "secretary@parish.lt",
  consent_privacy: true,
  consent_notice_version: CONSENT_NOTICE_VERSION,
  locale: "en",
} as const;

describe("assessmentRequestSchema (server)", () => {
  it("accepts a minimal valid payload and applies defaults", () => {
    const result = assessmentRequestSchema.safeParse({ ...valid });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goals).toEqual([]);
      expect(result.data.consent_marketing).toBe(false);
    }
  });

  it("rejects consent_privacy that is not literally true (DPIA-001 R7)", () => {
    expect(assessmentRequestSchema.safeParse({ ...valid, consent_privacy: false }).success).toBe(
      false,
    );
  });

  it("requires a consent notice version so consent is demonstrable", () => {
    const { consent_notice_version: _omit, ...rest } = valid;
    expect(assessmentRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing or malformed contact email", () => {
    const { contact_email: _omit, ...rest } = valid;
    expect(assessmentRequestSchema.safeParse(rest).success).toBe(false);
    expect(
      assessmentRequestSchema.safeParse({ ...valid, contact_email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a non-empty honeypot (bot trap, maxLength 0)", () => {
    expect(assessmentRequestSchema.safeParse({ ...valid, honeypot: "spam" }).success).toBe(false);
    expect(assessmentRequestSchema.safeParse({ ...valid, honeypot: "" }).success).toBe(true);
  });

  it("caps goals at five and rejects unknown organisation types", () => {
    const six = [
      "new_website",
      "ecommerce",
      "donations",
      "crm_integration",
      "ai_assistant",
      "cemetery_map",
    ];
    expect(assessmentRequestSchema.safeParse({ ...valid, goals: six }).success).toBe(false);
    expect(
      assessmentRequestSchema.safeParse({ ...valid, organization_type: "spaceport" }).success,
    ).toBe(false);
  });

  it("is strict: unknown properties are rejected (additionalProperties: false parity)", () => {
    expect(assessmentRequestSchema.safeParse({ ...valid, unexpected: "x" }).success).toBe(false);
  });

  it("allows optional fields to be empty strings or a valid URL only", () => {
    expect(assessmentRequestSchema.safeParse({ ...valid, organization_name: "" }).success).toBe(
      true,
    );
    expect(assessmentRequestSchema.safeParse({ ...valid, current_site_url: "" }).success).toBe(
      true,
    );
    expect(
      assessmentRequestSchema.safeParse({ ...valid, current_site_url: "https://parish.lt" })
        .success,
    ).toBe(true);
    expect(
      assessmentRequestSchema.safeParse({ ...valid, current_site_url: "not a url" }).success,
    ).toBe(false);
  });

  it("rejects a locale outside the routable set", () => {
    expect(assessmentRequestSchema.safeParse({ ...valid, locale: "pl" }).success).toBe(false);
  });
});

describe("clientAssessmentSchema (browser)", () => {
  it("omits server-only fields (locale, consent_notice_version) from client validation", () => {
    const { locale: _l, consent_notice_version: _v, ...clientPayload } = valid;
    expect(clientAssessmentSchema.safeParse(clientPayload).success).toBe(true);
  });

  it("is still strict, so a client cannot smuggle the server-only locale field", () => {
    expect(clientAssessmentSchema.safeParse({ ...valid }).success).toBe(false);
  });
});
