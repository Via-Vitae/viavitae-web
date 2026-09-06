// Catalogue type contracts for the ViaVitae product tree.
// These are hand-authored domain types (NOT generated). The cross-repo API
// payload types live in src/generated/ and are produced from docs/contracts/.
//
// The 15 ProductIds below are the marketing catalogue (the church ribbon). They
// are distinct from the 10 OrganizationType values in the assessment contract —
// a product is something we sell; an organization type is who is asking.

/** Marketing catalogue product identifiers (the church ribbon + product pages). */
export type ProductId =
  | 'basilica'
  | 'cathedral'
  | 'diocese'
  | 'deaneries'
  | 'parish-church'
  | 'funeral-services'
  | 'cemetery-services'
  | 'online-store'
  | 'marketplace'
  | 'vendor-dashboard'
  | 'donation-flow'
  | 'donation-impact'
  | 'crm-dashboard'
  | 'ai-pastoral-assistant'
  | 'gps-cemetery-map';

/** Pricing tiers. Prices are fixed by product strategy (see lib/constants.ts). */
export type TierId = 'economy' | 'normal' | 'vip';

export interface Tier {
  readonly id: TierId;
  /** One-off build price in EUR, excluding VAT (PVM). */
  readonly priceEur: number;
  /** i18n message key for the human tier name (messages/*.json -> tiers.<key>). */
  readonly nameKey: string;
  /** i18n message key for the one-line tier summary. */
  readonly summaryKey: string;
}

/**
 * Optional add-ons selected in the quote calculator. Unit prices are NOT hardcoded:
 * only tier base prices and the monthly maintenance band are published figures. The
 * authoritative price for a configuration is computed by the quote API
 * (POST /v1/quotes) and returned as a PDF — the client never fabricates a price.
 */
export interface Addon {
  readonly id: string;
  readonly nameKey: string;
}

export interface Product {
  readonly id: ProductId;
  /** Route segment under /[locale]/product/. Matches ProductId. */
  readonly slug: ProductId;
  /** i18n message key for the product name (products.<id>.name). */
  readonly nameKey: string;
  /** i18n message key for the short ribbon/menu label. */
  readonly shortNameKey: string;
  /** Demo path segment for demo.viavitae.com/<demoType>. */
  readonly demoType: string;
  /** Tiers offered for this product, in ascending price order. */
  readonly tiers: readonly TierId[];
  /** Whether the product collects donations/payments (triggers PCI + GDPR review). */
  readonly handlesPayments: boolean;
}
