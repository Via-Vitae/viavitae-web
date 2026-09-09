"use client";

import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { clientAssessmentSchema, type AssessmentFormValues } from "@/lib/assessment-schema";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { ASSESSMENT_GOALS, CONSENT_NOTICE_VERSION, ORGANIZATION_TYPES } from "@/lib/constants";
import type { Locale } from "@/lib/routing";

// Multi-step assessment funnel. Client-validated with Zod against the same shape as
// docs/contracts/assessment.openapi.yaml, then POSTed to /api/assessment (the server
// proxy re-validates and forwards to viavitae-api).
//
// DPIA-001 controls implemented here:
//   R7 — consent checkbox is UNCHECKED by default, separate from marketing consent,
//        and the exact notice version (CONSENT_NOTICE_VERSION) is submitted so the
//        controller can store demonstrable consent.
//   R2 — a notice asks the submitter not to include personal data about identifiable
//        third parties and to describe a community, not individuals.
//   Bot trap — a hidden honeypot field must stay empty (maxLength 0 in the contract).
//   Idempotency — one UUID is generated per form instance and reused across retries.

const schema = clientAssessmentSchema;

type FormValues = AssessmentFormValues;

const CURRENT_STATUS = [
  "no_website",
  "outdated",
  "needs_redesign",
  "unhappy_with_provider",
] as const;
const STEPS = ["organization", "site", "goals", "contact"] as const;
type Step = (typeof STEPS)[number];

type Status = "idle" | "submitting" | "success" | "error";

export interface AssessmentFormProps {
  /** Prefilled organization type (e.g. from the "make it mine" wizard). */
  defaultOrganizationType?: (typeof ORGANIZATION_TYPES)[number];
  /** Prefilled goals (from a product page CTA). */
  defaultGoals?: ReadonlyArray<(typeof ASSESSMENT_GOALS)[number]>;
}

function emptyValues(locale: Locale, defaults: AssessmentFormProps): FormValues {
  return {
    organization_type: defaults.defaultOrganizationType ?? "parish_church",
    organization_name: "",
    current_site_url: "",
    current_status: undefined,
    goals: [...(defaults.defaultGoals ?? [])],
    message: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    preferred_language: locale,
    consent_privacy: undefined as unknown as true,
    consent_marketing: false,
    honeypot: "",
  };
}

export function AssessmentForm(props: AssessmentFormProps) {
  const t = useTranslations("assessment");
  const locale = useLocale() as Locale;
  const uid = useId();
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : ""),
    [],
  );

  const [step, setStep] = useState<Step>("organization");
  const [values, setValues] = useState<FormValues>(() => emptyValues(locale, props));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const stepIndex = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]!);
  const back = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]!);

  const toggleGoal = (goal: (typeof ASSESSMENT_GOALS)[number]) => {
    setValues((prev) => {
      const goals = prev.goals ?? [];
      const nextGoals = goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal];
      return { ...prev, goals: nextGoals.slice(0, 5) };
    });
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerMessage(null);

    // Bot trap: a filled honeypot looks like success but is not forwarded.
    if (values.honeypot) {
      setStatus("success");
      return;
    }

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || issue.message;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const payload = {
        ...parsed.data,
        // Normalise optional-empty strings to undefined so the contract's
        // additionalProperties:false + nullable rules are respected.
        organization_name: parsed.data.organization_name || undefined,
        current_site_url: parsed.data.current_site_url || undefined,
        contact_name: parsed.data.contact_name || undefined,
        contact_phone: parsed.data.contact_phone || undefined,
        message: parsed.data.message || undefined,
        consent_notice_version: CONSENT_NOTICE_VERSION,
        locale,
      };
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      if (response.status === 202) {
        setStatus("success");
        trackEvent("assessment", "submit", parsed.data.organization_type);
        return;
      }
      if (response.status === 429) {
        setServerMessage(t("errors.rateLimited"));
      } else if (response.status === 409) {
        setServerMessage(t("errors.duplicate"));
      } else {
        setServerMessage(t("errors.generic"));
      }
      setStatus("error");
    } catch {
      setServerMessage(t("errors.network"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-md border border-state-success bg-state-success-tint p-6 text-text-primary"
      >
        <p className="text-heading-4">{t("successTitle")}</p>
        <p className="mt-2 text-body-md">{t("successBody")}</p>
      </div>
    );
  }

  const fieldId = (name: string) => `${uid}-${name}`;
  const errorFor = (name: string) => (errors[name] ? t(`fields.${name}`) : undefined);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-labelledby={`${uid}-heading`}
    >
      <div>
        <p id={`${uid}-heading`} className="text-heading-3 text-text-primary">
          {t("title")}
        </p>
        <p className="mt-1 text-body-sm text-text-muted">
          {t("stepProgress", { current: stepIndex + 1, total: STEPS.length })}
        </p>
      </div>

      {step === "organization" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-md font-medium text-text-primary">
            {t("steps.organization")}
          </legend>
          <label
            htmlFor={fieldId("organization_type")}
            className="text-body-sm text-text-secondary"
          >
            {t("labels.organizationType")}
          </label>
          <select
            id={fieldId("organization_type")}
            value={values.organization_type}
            onChange={(event) =>
              set("organization_type", event.target.value as FormValues["organization_type"])
            }
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          >
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`orgTypes.${type}`)}
              </option>
            ))}
          </select>
          <label
            htmlFor={fieldId("organization_name")}
            className="text-body-sm text-text-secondary"
          >
            {t("labels.organizationName")}
          </label>
          <input
            id={fieldId("organization_name")}
            type="text"
            value={values.organization_name ?? ""}
            onChange={(event) => set("organization_name", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          />
        </fieldset>
      )}

      {step === "site" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-md font-medium text-text-primary">{t("steps.site")}</legend>
          <label htmlFor={fieldId("current_site_url")} className="text-body-sm text-text-secondary">
            {t("labels.currentSiteUrl")}
          </label>
          <input
            id={fieldId("current_site_url")}
            type="url"
            value={values.current_site_url ?? ""}
            onChange={(event) => set("current_site_url", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          />
          <label htmlFor={fieldId("current_status")} className="text-body-sm text-text-secondary">
            {t("labels.currentStatus")}
          </label>
          <select
            id={fieldId("current_status")}
            value={values.current_status ?? ""}
            onChange={(event) =>
              set(
                "current_status",
                (event.target.value || undefined) as FormValues["current_status"],
              )
            }
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          >
            <option value="">{t("labels.selectOptional")}</option>
            {CURRENT_STATUS.map((status) => (
              <option key={status} value={status}>
                {t(`currentStatus.${status}`)}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      {step === "goals" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-md font-medium text-text-primary">{t("steps.goals")}</legend>
          {ASSESSMENT_GOALS.map((goal) => (
            <label key={goal} className="flex items-center gap-2 text-body-md text-text-secondary">
              <input
                type="checkbox"
                checked={(values.goals ?? []).includes(goal)}
                onChange={() => toggleGoal(goal)}
              />
              {t(`goals.${goal}`)}
            </label>
          ))}
          <p className="text-body-sm text-text-muted">{t("goalsHint")}</p>
        </fieldset>
      )}

      {step === "contact" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-md font-medium text-text-primary">
            {t("steps.contact")}
          </legend>
          <label htmlFor={fieldId("contact_name")} className="text-body-sm text-text-secondary">
            {t("labels.contactName")}
          </label>
          <input
            id={fieldId("contact_name")}
            type="text"
            autoComplete="name"
            value={values.contact_name ?? ""}
            onChange={(event) => set("contact_name", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
            aria-invalid={Boolean(errors.contact_name)}
            aria-describedby={errors.contact_name ? `${fieldId("contact_name")}-err` : undefined}
          />
          {errors.contact_name && (
            <p id={`${fieldId("contact_name")}-err`} className="text-body-sm text-state-danger">
              {errorFor("contact_name")}
            </p>
          )}

          <label htmlFor={fieldId("contact_email")} className="text-body-sm text-text-secondary">
            {t("labels.contactEmail")}
          </label>
          <input
            id={fieldId("contact_email")}
            type="email"
            autoComplete="email"
            required
            value={values.contact_email}
            onChange={(event) => set("contact_email", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
            aria-invalid={Boolean(errors.contact_email)}
            aria-describedby={errors.contact_email ? `${fieldId("contact_email")}-err` : undefined}
          />
          {errors.contact_email && (
            <p id={`${fieldId("contact_email")}-err`} className="text-body-sm text-state-danger">
              {errorFor("contact_email")}
            </p>
          )}

          <label htmlFor={fieldId("contact_phone")} className="text-body-sm text-text-secondary">
            {t("labels.contactPhone")}
          </label>
          <input
            id={fieldId("contact_phone")}
            type="tel"
            autoComplete="tel"
            value={values.contact_phone ?? ""}
            onChange={(event) => set("contact_phone", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          />

          <label htmlFor={fieldId("message")} className="text-body-sm text-text-secondary">
            {t("labels.message")}
          </label>
          <textarea
            id={fieldId("message")}
            rows={4}
            maxLength={2000}
            value={values.message ?? ""}
            onChange={(event) => set("message", event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2 text-body-md"
          />

          {/* DPIA-001 R2: discourage third-party personal data. */}
          <p className="rounded-sm bg-surface-sunken p-3 text-body-sm text-text-secondary">
            {t("thirdPartyNotice")}
          </p>

          {/* Honeypot: visually hidden, must remain empty. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor={fieldId("honeypot")}>Do not fill this field</label>
            <input
              id={fieldId("honeypot")}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.honeypot ?? ""}
              onChange={(event) => set("honeypot", event.target.value)}
            />
          </div>

          {/* DPIA-001 R7: unchecked, unbundled consent + notice version. */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 text-body-sm text-text-secondary">
              <input
                type="checkbox"
                checked={values.consent_privacy === true}
                onChange={(event) =>
                  set(
                    "consent_privacy",
                    event.target.checked ? true : (undefined as unknown as true),
                  )
                }
                aria-invalid={Boolean(errors.consent_privacy)}
                aria-describedby={errors.consent_privacy ? `${fieldId("consent")}-err` : undefined}
                required
              />
              <span>{t("consentPrivacy")}</span>
            </label>
            {errors.consent_privacy && (
              <p id={`${fieldId("consent")}-err`} className="text-body-sm text-state-danger">
                {t("errors.consentRequired")}
              </p>
            )}
            <label className="flex items-start gap-2 text-body-sm text-text-secondary">
              <input
                type="checkbox"
                checked={values.consent_marketing === true}
                onChange={(event) => set("consent_marketing", event.target.checked)}
              />
              <span>{t("consentMarketing")}</span>
            </label>
            <p className="text-body-sm text-text-muted">
              {t("consentVersion", { version: CONSENT_NOTICE_VERSION })}
            </p>
          </div>
        </fieldset>
      )}

      {serverMessage && (
        <p role="alert" className="text-body-sm text-state-danger">
          {serverMessage}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={stepIndex === 0 || status === "submitting"}
        >
          {t("back")}
        </Button>
        {stepIndex < STEPS.length - 1 ? (
          <Button type="button" variant="secondary" onClick={next}>
            {t("continue")}
          </Button>
        ) : (
          <Button type="submit" variant="primary" disabled={status === "submitting"}>
            {status === "submitting" ? t("submitting") : t("submit")}
          </Button>
        )}
      </div>
    </form>
  );
}
