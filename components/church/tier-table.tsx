import { getLocale, getTranslations } from "next-intl/server";
import { TIERS, TIER_ORDER, MAINTENANCE_EUR_MONTH } from "@/lib/constants";
import { formatEur } from "@/lib/utils";
import type { Locale } from "@/lib/routing";

// Sticky tier comparison table. Rendered on the server (SSR) so the price content
// is in the initial HTML and indexable (ADR-WEB-001). Prices are net EUR; the VAT
// (PVM) note is shown once, not baked into each figure.
const FEATURES: ReadonlyArray<{ key: string; byTier: Record<string, boolean> }> = [
  { key: "responsive", byTier: { economy: true, normal: true, vip: true } },
  { key: "multilanguage", byTier: { economy: false, normal: true, vip: true } },
  { key: "donations", byTier: { economy: false, normal: true, vip: true } },
  { key: "crm", byTier: { economy: false, normal: false, vip: true } },
  { key: "aiAssistant", byTier: { economy: false, normal: false, vip: true } },
  { key: "prioritySupport", byTier: { economy: false, normal: false, vip: true } },
];

export async function TierTable() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("pricing");
  // Tier display names live at the ROOT `tiers.<id>.name` keys (lib/constants.ts,
  // types/catalog.ts) so they are shared with the JSON-LD Offers and the pricing
  // page; the table-specific labels stay under the `pricing` namespace.
  const tRoot = await getTranslations();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body-md">
        <caption className="vv-sr-only">{t("tableCaption")}</caption>
        <thead>
          <tr className="sticky top-0 z-10 bg-surface-raised">
            <th scope="col" className="border-b border-border p-3 text-left font-semibold">
              {t("featureColumn")}
            </th>
            {TIER_ORDER.map((tierId) => (
              <th key={tierId} scope="col" className="border-b border-border p-3 text-center">
                <span className="block text-body-lg font-semibold text-text-primary">
                  {tRoot(`tiers.${tierId}.name`)}
                </span>
                <span className="block text-display-sm text-text-brand">
                  {formatEur(TIERS[tierId].priceEur, locale)}
                </span>
                <span className="block text-body-sm text-text-muted">{t("oneOff")}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature) => (
            <tr key={feature.key}>
              <th
                scope="row"
                className="border-b border-border-divider p-3 text-left font-normal text-text-secondary"
              >
                {t(`features.${feature.key}`)}
              </th>
              {TIER_ORDER.map((tierId) => (
                <td key={tierId} className="border-b border-border-divider p-3 text-center">
                  {feature.byTier[tierId] ? (
                    <span aria-label={t("included")} className="text-state-success">
                      &#10003;
                    </span>
                  ) : (
                    <span aria-label={t("notIncluded")} className="text-text-disabled">
                      &ndash;
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="p-3 text-left font-normal text-text-secondary">
              {t("maintenance")}
            </th>
            <td colSpan={TIER_ORDER.length} className="p-3 text-center text-text-primary">
              {formatEur(MAINTENANCE_EUR_MONTH.min, locale)}&ndash;
              {formatEur(MAINTENANCE_EUR_MONTH.max, locale)} / {t("perMonth")}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-body-sm text-text-muted">{t("vatNote")}</p>
    </div>
  );
}
