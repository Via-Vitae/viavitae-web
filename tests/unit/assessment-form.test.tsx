import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssessmentForm } from "@/components/church/assessment-form";

// Component tests for the multi-step assessment funnel. The route handler is
// already covered at 97.75%; these assert the CLIENT-side DPIA-001 controls and
// the wizard behaviour: unchecked-by-default consent, the honeypot trap, step
// navigation, client validation, and the success/error submit states. next-intl
// and analytics are mocked so assertions key off the translation ids.

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) =>
    values ? `${ns}.${key}:${JSON.stringify(values)}` : `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics";
import { CONSENT_NOTICE_VERSION } from "@/lib/constants";
const fakeFetch = vi.fn();

function gotoContactStep() {
  // organization -> site -> goals -> contact = 3 clicks of "continue".
  const cont = () => fireEvent.click(screen.getByRole("button", { name: /assessment\.continue/ }));
  cont();
  cont();
  cont();
}

describe("AssessmentForm", () => {
  beforeEach(() => {
    fakeFetch.mockReset();
    vi.stubGlobal("fetch", fakeFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the first step with the heading", () => {
    render(<AssessmentForm />);
    expect(screen.getByText("assessment.title")).toBeInTheDocument();
    expect(screen.getByText("assessment.steps.organization")).toBeInTheDocument();
  });

  it("leaves the privacy consent UNCHECKED by default (DPIA-001 R7)", () => {
    render(<AssessmentForm />);
    gotoContactStep();
    const consent = screen.getByRole("checkbox", { name: /assessment\.consentPrivacy/ });
    expect(consent).not.toBeChecked();
  });

  it("disables Back on the first step and advances through steps", () => {
    render(<AssessmentForm />);
    expect(screen.getByRole("button", { name: /assessment\.back/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /assessment\.continue/ }));
    expect(screen.getByText("assessment.steps.site")).toBeInTheDocument();
  });

  it("shows a validation error and does not call fetch when consent is missing", () => {
    render(<AssessmentForm />);
    gotoContactStep();
    fireEvent.change(screen.getByLabelText(/assessment\.labels\.contactEmail/), {
      target: { value: "priest@parish.lt" },
    });
    fireEvent.click(screen.getByRole("button", { name: /assessment\.submit/ }));
    expect(screen.getByText("assessment.errors.consentRequired")).toBeInTheDocument();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("submits a valid form and shows the success state", async () => {
    fakeFetch.mockResolvedValue({ status: 202 });
    render(<AssessmentForm />);
    gotoContactStep();
    fireEvent.change(screen.getByLabelText(/assessment\.labels\.contactEmail/), {
      target: { value: "priest@parish.lt" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /assessment\.consentPrivacy/ }));
    fireEvent.click(screen.getByRole("button", { name: /assessment\.submit/ }));

    const success = await screen.findByRole("status");
    expect(success).toBeInTheDocument();
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0]!;
    expect(url).toBe("/api/assessment");
    expect(init.headers["Idempotency-Key"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    const body = JSON.parse(init.body);
    expect(body.consent_notice_version).toBe(CONSENT_NOTICE_VERSION);
    expect(body.locale).toBe("en");
    expect(trackEvent).toHaveBeenCalledWith("assessment", "submit", "parish_church");
  });

  it("treats a filled honeypot as a silent success without calling the API", () => {
    render(<AssessmentForm />);
    gotoContactStep();
    // Fill the hidden honeypot input by its accessible label text.
    const hp = screen.getByLabelText("Do not fill this field");
    fireEvent.change(hp, { target: { value: "bot" } });
    fireEvent.click(screen.getByRole("button", { name: /assessment\.submit/ }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(fakeFetch).not.toHaveBeenCalled();
  });
});
