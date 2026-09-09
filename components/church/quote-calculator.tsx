"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n";
import {
  ADDONS,
  CATALOG,
  CONSENT_NOTICE_VERSION,
  MAINTENANCE_EUR_MONTH,
  TIERS,
  TIER_ORDER,
} from "@/lib/constants";
import { formatEur } from "@/lib/utils";
import type { Locale } from "@/lib/routing";
import type { ProductId, TierId } from "@/types/catalog";

// Interactive quote calculator. It shows only PUBLISHED figures — the selected tier
// base price ("from") and the monthly maintenance band. The authoritative total for
// a configuration (pages, languages, add-ons) is produced by the quote API and
// returned as a PDF; the client never fabricates a per-page or per-add-on price
// (QODER rule 4). Requesting the PDF collects an email + explicit consent, mirroring
// the assessment funnel (DPIA-001).

type Status = "idle" | "loading" | "error";

export function QuoteCalculator() {
  const t = useTranslations("quote");
  const locale = useLocale() as Locale;
  const uid = useId();

  const [product, setProduct] = useState<ProductId>("parish-church");
  const [tier, setTier] = useState<TierId>("normal");
  const [pages, setPages] = useState(8);
  const [languages, setLanguages] = useState(1);
  const [addons, setAddons] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const toggleAddon = (id: string) =>
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  async function requestPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!consent) {
      setError(t("errors.consentRequired"));
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          tier,
          pages,
          languages,
          addons,
          contact_email: email,
          consent_privacy: true,
          consent_notice_version: CONSENT_NOTICE_VERSION,
          locale,
        }),
      });
      if (!response.ok) {
        setStatus("error");
        setError(t("errors.generic"));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `viavitae-quote-${product}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError(t("errors.network"));
    }
  }

  const field = (name: string) => `${uid}-${name}`;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={requestPdf} className="flex flex-col gap-4" aria-labelledby={`${uid}-config`}>
        <h2 id={`${uid}-config`} className="text-heading-3 text-text-primary">
          {t("configure")}
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor={field("product")} className="text-body-sm text-text-secondary">
            {t("product")}
          </label>
          <select
            id={field("product")}
            value={product}
            onChange={(event) => setProduct(event.target.value as ProductId)}
            className="rounded-sm border border-border-input bg-surface-raised p-2"
          >
            {CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                {t(`products.${item.id}`)}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-body-sm text-text-secondary">{t("tier")}</legend>
          <div className="flex gap-2">
            {TIER_ORDER.map((tierId) => (
              <label
                key={tierId}
                className="flex flex-1 items-center gap-2 rounded-sm border border-border p-2 text-body-sm"
              >
                <input
                  type="radio"
                  name={`${uid}-tier`}
                  value={tierId}
                  checked={tier === tierId}
                  onChange={() => setTier(tierId)}
                />
                {t(`tiers.${tierId}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={field("pages")} className="text-body-sm text-text-secondary">
              {t("pages")}
            </label>
            <input
              id={field("pages")}
              type="number"
              min={1}
              max={500}
              value={pages}
              onChange={(event) => setPages(Number(event.target.value))}
              className="rounded-sm border border-border-input bg-surface-raised p-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={field("languages")} className="text-body-sm text-text-secondary">
              {t("languages")}
            </label>
            <input
              id={field("languages")}
              type="number"
              min={1}
              max={5}
              value={languages}
              onChange={(event) => setLanguages(Number(event.target.value))}
              className="rounded-sm border border-border-input bg-surface-raised p-2"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm text-text-secondary">{t("addonsLabel")}</legend>
          {ADDONS.map((addon) => (
            <label
              key={addon.id}
              className="flex items-center gap-2 text-body-sm text-text-secondary"
            >
              <input
                type="checkbox"
                checked={addons.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
              />
              {t(addon.nameKey)}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1 border-t border-border-divider pt-4">
          <label htmlFor={field("email")} className="text-body-sm text-text-secondary">
            {t("email")}
          </label>
          <input
            id={field("email")}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-sm border border-border-input bg-surface-raised p-2"
          />
          <label className="flex items-start gap-2 text-body-sm text-text-secondary">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>{t("consent")}</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-body-sm text-state-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={status === "loading"}>
            {status === "loading" ? t("preparing") : t("downloadPdf")}
          </Button>
          <Link
            href="/start-for-free"
            className="self-center text-body-md text-text-link underline"
          >
            {t("requestAssessment")}
          </Link>
        </div>
      </form>

      <aside
        className="flex flex-col gap-3 rounded-md border border-border bg-surface-raised p-6"
        aria-labelledby={`${uid}-summary`}
      >
        <h2 id={`${uid}-summary`} className="text-heading-4 text-text-primary">
          {t("summary")}
        </h2>
        <p className="text-body-sm text-text-muted">{t("fromLabel")}</p>
        <p className="text-display-md text-text-brand">{formatEur(TIERS[tier].priceEur, locale)}</p>
        <p className="text-body-sm text-text-secondary">
          {t("maintenance")}: {formatEur(MAINTENANCE_EUR_MONTH.min, locale)}&ndash;
          {formatEur(MAINTENANCE_EUR_MONTH.max, locale)} / {t("perMonth")}
        </p>
        <dl className="mt-2 flex flex-col gap-1 text-body-sm text-text-secondary">
          <div className="flex justify-between">
            <dt>{t("pages")}</dt>
            <dd>{pages}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("languages")}</dt>
            <dd>{languages}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("addonsLabel")}</dt>
            <dd>{addons.length}</dd>
          </div>
        </dl>
        <p className="mt-2 text-body-sm text-text-muted">{t("finalPriceNote")}</p>
      </aside>
    </div>
  );
}
