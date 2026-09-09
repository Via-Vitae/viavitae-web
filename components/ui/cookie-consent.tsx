"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { readConsent, writeConsent, CONSENT_COOKIE } from "@/lib/analytics";
import { Button } from "./button";

// Granular cookie consent (GDPR / ePrivacy). Requirements enforced here:
//   - necessary cookies are always on and cannot be toggled off;
//   - "Reject all" is as prominent as "Accept all" and produces the same default-off
//     state as never consenting (reject-all parity — no dark pattern);
//   - nothing analytics/marketing loads until the visitor opts in (lib/analytics.ts);
//   - the banner reappears only when no consent cookie is present.

function hasConsentCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((part) => part.startsWith(`${CONSENT_COOKIE}=`));
}

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (hasConsentCookie()) return;
    const current = readConsent();
    setAnalytics(current.analytics);
    setMarketing(current.marketing);
    setVisible(true);
  }, []);

  const save = (next: { analytics: boolean; marketing: boolean }) => {
    writeConsent(next);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 text-body-sm text-text-secondary">
          <p className="mb-1 text-body-md font-medium text-text-primary">{t("title")}</p>
          <p>
            {t("body")}{" "}
            <Link href="/legal/cookies" className="text-text-link underline">
              {t("cookiesLink")}
            </Link>
            {" · "}
            <Link href="/legal/privacy" className="text-text-link underline">
              {t("privacyLink")}
            </Link>
          </p>
          <fieldset className="mt-3 flex flex-col gap-2">
            <legend className="vv-sr-only">{t("categories")}</legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled readOnly />
              <span>{t("necessary")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
              <span>{t("analytics")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
              />
              <span>{t("marketing")}</span>
            </label>
          </fieldset>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save({ analytics: true, marketing: true })}
          >
            {t("acceptAll")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => save({ analytics: false, marketing: false })}
          >
            {t("rejectAll")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => save({ analytics, marketing })}>
            {t("saveChoices")}
          </Button>
        </div>
      </div>
    </div>
  );
}
