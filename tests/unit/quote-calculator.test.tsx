import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuoteCalculator } from "@/components/church/quote-calculator";

// Component tests for the quote calculator. The route handler is covered at
// 100%; these assert the CLIENT behaviour: the summary reflects the selected
// tier/pages/languages/addons, the consent gate blocks a PDF request without
// explicit consent (DPIA-001), and a consented request hits /api/quote and
// triggers the blob download. next-intl and <Link> are mocked.

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("@/lib/i18n", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const fakeFetch = vi.fn();

describe("QuoteCalculator", () => {
  beforeEach(() => {
    fakeFetch.mockReset();
    vi.stubGlobal("fetch", fakeFetch);
    // jsdom does not implement the object-URL APIs used by the download path.
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    // The component programmatically clicks a temp <a download> to save the PDF;
    // jsdom would try to navigate to the blob URL and log a not-implemented error.
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the configuration form and the price summary", () => {
    render(<QuoteCalculator />);
    expect(screen.getByText("quote.configure")).toBeInTheDocument();
    expect(screen.getByText("quote.summary")).toBeInTheDocument();
  });

  it("reflects page and language counts in the summary", () => {
    render(<QuoteCalculator />);
    fireEvent.change(screen.getByLabelText(/quote\.pages/), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText(/quote\.languages/), { target: { value: "3" } });
    // The summary <dd> values render as text; the inputs hold their value as an
    // attribute, so the visible "12"/"3" come only from the summary panel.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("blocks the PDF request when consent is not given (DPIA-001)", () => {
    render(<QuoteCalculator />);
    fireEvent.change(screen.getByLabelText(/quote\.email/), {
      target: { value: "priest@parish.lt" },
    });
    fireEvent.click(screen.getByRole("button", { name: /quote\.downloadPdf/ }));
    expect(screen.getByText("quote.errors.consentRequired")).toBeInTheDocument();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("requests the PDF and triggers a download once consent is given", async () => {
    fakeFetch.mockResolvedValue({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob(["%PDF"], { type: "application/pdf" })),
    });
    render(<QuoteCalculator />);
    fireEvent.change(screen.getByLabelText(/quote\.email/), {
      target: { value: "priest@parish.lt" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /quote\.consent/ }));
    fireEvent.click(screen.getByRole("button", { name: /quote\.downloadPdf/ }));

    // The submit button returns to the idle label once the download completes.
    expect(await screen.findByRole("button", { name: /quote\.downloadPdf/ })).toBeEnabled();
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0]!;
    expect(url).toContain("/api/quote");
    const body = JSON.parse(init.body);
    expect(body.consent_privacy).toBe(true);
    expect(body.contact_email).toBe("priest@parish.lt");
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("shows a generic error when the API rejects the request", async () => {
    fakeFetch.mockResolvedValue({ ok: false, status: 500 });
    render(<QuoteCalculator />);
    fireEvent.change(screen.getByLabelText(/quote\.email/), {
      target: { value: "priest@parish.lt" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /quote\.consent/ }));
    fireEvent.click(screen.getByRole("button", { name: /quote\.downloadPdf/ }));
    expect(await screen.findByText("quote.errors.generic")).toBeInTheDocument();
  });
});
