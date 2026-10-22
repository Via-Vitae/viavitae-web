import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieConsent } from "@/components/ui/cookie-consent";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/i18n", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/analytics", () => ({
  readConsent: () => ({ necessary: true, analytics: false, marketing: false }),
  writeConsent: vi.fn(),
  CONSENT_COOKIE: "vv_consent",
}));

import { writeConsent } from "@/lib/analytics";
const mockWriteConsent = vi.mocked(writeConsent);

describe("CookieConsent", () => {
  beforeEach(() => {
    document.cookie = "vv_consent=; Max-Age=0; path=/";
    mockWriteConsent.mockReset();
  });

  it("renders nothing when consent cookie exists", () => {
    document.cookie = 'vv_consent={"analytics":true}; path=/';
    const { container } = render(<CookieConsent />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the consent banner when no cookie exists", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("displays accept all, reject all, and save choices buttons", () => {
    render(<CookieConsent />);
    expect(screen.getByText("acceptAll")).toBeInTheDocument();
    expect(screen.getByText("rejectAll")).toBeInTheDocument();
    expect(screen.getByText("saveChoices")).toBeInTheDocument();
  });

  it("calls writeConsent with all true when accept all is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("acceptAll"));
    expect(mockWriteConsent).toHaveBeenCalledWith({ analytics: true, marketing: true });
  });

  it("calls writeConsent with all false when reject all is clicked", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("rejectAll"));
    expect(mockWriteConsent).toHaveBeenCalledWith({ analytics: false, marketing: false });
  });

  it("has necessary checkbox checked and disabled", () => {
    render(<CookieConsent />);
    const necessaryCheckbox = screen.getByRole("checkbox", { name: /necessary/i });
    expect(necessaryCheckbox).toBeChecked();
    expect(necessaryCheckbox).toBeDisabled();
  });

  it("allows toggling analytics and marketing checkboxes", () => {
    render(<CookieConsent />);
    const analyticsCheckbox = screen.getByRole("checkbox", { name: /analytics/i });
    const marketingCheckbox = screen.getByRole("checkbox", { name: /marketing/i });

    expect(analyticsCheckbox).not.toBeChecked();
    expect(marketingCheckbox).not.toBeChecked();

    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox).toBeChecked();

    fireEvent.click(marketingCheckbox);
    expect(marketingCheckbox).toBeChecked();
  });

  it("calls writeConsent with current selections when save choices is clicked", () => {
    render(<CookieConsent />);
    const analyticsCheckbox = screen.getByRole("checkbox", { name: /analytics/i });

    fireEvent.click(analyticsCheckbox);
    fireEvent.click(screen.getByText("saveChoices"));

    expect(mockWriteConsent).toHaveBeenCalledWith({ analytics: true, marketing: false });
  });
});
