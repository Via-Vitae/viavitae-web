import type { Addon, Product, ProductId, Tier, TierId } from "@/types/catalog";

// Single source of truth for tiers, prices, the product catalogue and contact
// channels. Prices are product-strategy inputs supplied by the business and must
// match docs/seo and the pricing page. All EUR figures exclude VAT (PVM).

/** Lithuania standard VAT rate (PVM), used for gross-price display. */
export const PVM_RATE = 0.21;

/**
 * Version identifier of the privacy-notice text shown on the assessment funnel.
 * Sent with every submission as `consent_notice_version` so the controller can
 * store the exact text the submitter agreed to (DPIA-001 control R7 — demonstrable
 * consent). Bump this whenever the notice wording in messages/*.json (key
 * `assessment.consentNotice`) changes.
 */
export const CONSENT_NOTICE_VERSION = "assessment-privacy-2026-09";

export const TIERS: Readonly<Record<TierId, Tier>> = {
  economy: {
    id: "economy",
    priceEur: 900,
    nameKey: "tiers.economy.name",
    summaryKey: "tiers.economy.summary",
  },
  normal: {
    id: "normal",
    priceEur: 1900,
    nameKey: "tiers.normal.name",
    summaryKey: "tiers.normal.summary",
  },
  vip: { id: "vip", priceEur: 2900, nameKey: "tiers.vip.name", summaryKey: "tiers.vip.summary" },
} as const;

export const TIER_ORDER: readonly TierId[] = ["economy", "normal", "vip"];

/** Monthly maintenance band, EUR excluding VAT. */
export const MAINTENANCE_EUR_MONTH = { min: 30, max: 50 } as const;

/** The online-store product is sold at the Normal tier price by default. */
export const STORE_DEFAULT_TIER: TierId = "normal";

/** Add-ons priced by the quote calculator. */
export const ADDONS: readonly Addon[] = [
  { id: "extra_language", nameKey: "addons.extraLanguage" },
  { id: "extra_page_pack", nameKey: "addons.extraPagePack" },
  { id: "donation_module", nameKey: "addons.donationModule" },
  { id: "cemetery_gps", nameKey: "addons.cemeteryGps" },
  { id: "ai_assistant", nameKey: "addons.aiAssistant" },
] as const;

/**
 * Organization types a visitor can select in the assessment funnel.
 * These MUST match OrganizationType in docs/contracts/assessment.openapi.yaml
 * exactly; tests/contract asserts the parity.
 */
export const ORGANIZATION_TYPES = [
  "basilica",
  "cathedral",
  "diocese",
  "deanery",
  "parish_church",
  "funeral_services",
  "cemetery_services",
  "online_store",
  "marketplace_vendor",
  "other_organization",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

/** Assessment goal options; must match the contract `goals` enum. */
export const ASSESSMENT_GOALS = [
  "new_website",
  "ecommerce",
  "donations",
  "crm_integration",
  "ai_assistant",
  "cemetery_map",
  "maintenance_only",
] as const;
export type AssessmentGoal = (typeof ASSESSMENT_GOALS)[number];

const all = TIER_ORDER;
const paid = (
  id: ProductId,
  demoType: string,
  nameKeySuffix: string,
  handlesPayments = false,
): Product => ({
  id,
  slug: id,
  nameKey: `products.${nameKeySuffix}.name`,
  shortNameKey: `products.${nameKeySuffix}.short`,
  demoType,
  tiers: all,
  handlesPayments,
});

/** The 15-product marketing catalogue, in church-ribbon display order. */
export const CATALOG: readonly Product[] = [
  paid("basilica", "basilica", "basilica"),
  paid("cathedral", "cathedral", "cathedral"),
  paid("diocese", "diocese", "diocese"),
  paid("deaneries", "deaneries", "deaneries"),
  paid("parish-church", "parish", "parishChurch"),
  paid("funeral-services", "funeral", "funeralServices"),
  paid("cemetery-services", "cemetery", "cemeteryServices"),
  paid("online-store", "store", "onlineStore", true),
  paid("marketplace", "marketplace", "marketplace", true),
  paid("vendor-dashboard", "vendor", "vendorDashboard", true),
  paid("donation-flow", "donations", "donationFlow", true),
  paid("donation-impact", "impact", "donationImpact", true),
  paid("crm-dashboard", "crm", "crmDashboard"),
  paid("ai-pastoral-assistant", "ai", "aiPastoralAssistant"),
  paid("gps-cemetery-map", "gps-map", "gpsCemeteryMap"),
] as const;

export const CATALOG_BY_ID: Readonly<Record<ProductId, Product>> = CATALOG.reduce(
  (acc, product) => {
    acc[product.id] = product;
    return acc;
  },
  {} as Record<ProductId, Product>,
);

export interface ContactChannel {
  readonly id: string;
  readonly labelKey: string;
  readonly value: string;
  readonly kind: "email" | "phone" | "url";
}

// Public contact channels. Values are sourced from NEXT_PUBLIC env vars so no
// unverified address or phone number is hardcoded into a live page (QODER rule 4).
// A channel with an empty value is hidden by the UI. The only literal is the
// security disclosure address, which is fixed by SECURITY.md.
const env = (name: string): string => process.env[name] ?? "";

/** Public support/sales channels shown on contact-support and in the footer. */
const ALL_CONTACT_CHANNELS: readonly ContactChannel[] = [
  { id: "sales", labelKey: "contact.sales", value: env("NEXT_PUBLIC_SALES_EMAIL"), kind: "email" },
  {
    id: "support",
    labelKey: "contact.support",
    value: env("NEXT_PUBLIC_SUPPORT_EMAIL"),
    kind: "email",
  },
  { id: "security", labelKey: "contact.security", value: "security@viavitae.com", kind: "email" },
  {
    id: "phone",
    labelKey: "contact.phone",
    value: env("NEXT_PUBLIC_SUPPORT_PHONE"),
    kind: "phone",
  },
  { id: "status", labelKey: "contact.status", value: "https://status.viavitae.com", kind: "url" },
];

export const CONTACT_CHANNELS: readonly ContactChannel[] = ALL_CONTACT_CHANNELS.filter(
  (channel) => channel.value.length > 0,
);

/** Support SLA table shown on contact-support. Response targets, not uptime. */
export const SUPPORT_SLA = [
  { tierKey: "sla.tier.critical", responseKey: "sla.response.1h", updateKey: "sla.update.4h" },
  { tierKey: "sla.tier.high", responseKey: "sla.response.4h", updateKey: "sla.update.1d" },
  { tierKey: "sla.tier.normal", responseKey: "sla.response.1d", updateKey: "sla.update.3d" },
] as const;
