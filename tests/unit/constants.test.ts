import { describe, expect, it } from "vitest";
import {
  ADDONS,
  ASSESSMENT_GOALS,
  CATALOG,
  CATALOG_BY_ID,
  CONSENT_NOTICE_VERSION,
  CONTACT_CHANNELS,
  MAINTENANCE_EUR_MONTH,
  ORGANIZATION_TYPES,
  PVM_RATE,
  SUPPORT_SLA,
  TIERS,
  TIER_ORDER,
} from "@/lib/constants";

describe("tiers and pricing", () => {
  it("publishes the three agreed one-off tier prices (EUR, excl. VAT)", () => {
    expect(TIERS.economy.priceEur).toBe(900);
    expect(TIERS.normal.priceEur).toBe(1900);
    expect(TIERS.vip.priceEur).toBe(2900);
  });
  it("orders tiers ascending by price", () => {
    expect(TIER_ORDER).toEqual(["economy", "normal", "vip"]);
    const prices = TIER_ORDER.map((id) => TIERS[id].priceEur);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
  it("uses the Lithuanian standard VAT rate", () => {
    expect(PVM_RATE).toBe(0.21);
  });
  it("publishes only a maintenance BAND, never a fixed monthly price", () => {
    expect(MAINTENANCE_EUR_MONTH.min).toBe(30);
    expect(MAINTENANCE_EUR_MONTH.max).toBe(50);
    expect(MAINTENANCE_EUR_MONTH.min).toBeLessThan(MAINTENANCE_EUR_MONTH.max);
  });
  it("pins a consent-notice version for demonstrable consent (DPIA-001 R7)", () => {
    expect(typeof CONSENT_NOTICE_VERSION).toBe("string");
    expect(CONSENT_NOTICE_VERSION.length).toBeGreaterThan(0);
  });
});

describe("catalogue", () => {
  it("has exactly 15 products with unique ids equal to their slugs", () => {
    expect(CATALOG).toHaveLength(15);
    const ids = CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(15);
    for (const product of CATALOG) expect(product.slug).toBe(product.id);
  });
  it("indexes every product by id", () => {
    for (const product of CATALOG) expect(CATALOG_BY_ID[product.id]).toBe(product);
  });
  it("flags every payment/donation-handling product for PCI + GDPR review", () => {
    const paymentProducts = CATALOG.filter((p) => p.handlesPayments).map((p) => p.id);
    expect(paymentProducts.sort()).toEqual(
      [
        "donation-flow",
        "donation-impact",
        "marketplace",
        "online-store",
        "vendor-dashboard",
      ].sort(),
    );
  });
  // QODER rule 4: no fabricated per-add-on prices are published client-side.
  it("does NOT hardcode any add-on price (authoritative pricing comes from the quote API)", () => {
    expect(ADDONS).toHaveLength(5);
    for (const addon of ADDONS) {
      expect(addon).not.toHaveProperty("priceEur");
      expect(typeof addon.nameKey).toBe("string");
    }
  });
});

describe("assessment enums", () => {
  it("declares the 10 organisation types and 7 goals used by the funnel", () => {
    expect(ORGANIZATION_TYPES).toHaveLength(10);
    expect(ORGANIZATION_TYPES).toContain("other_organization");
    expect(ASSESSMENT_GOALS).toHaveLength(7);
  });
});

describe("contact channels and SLA", () => {
  it("always exposes the fixed security-disclosure address (SECURITY.md)", () => {
    const security = CONTACT_CHANNELS.find((c) => c.id === "security");
    expect(security?.value).toBe("security@viavitae.com");
  });
  it("never exposes a channel with an empty value", () => {
    for (const channel of CONTACT_CHANNELS) expect(channel.value.length).toBeGreaterThan(0);
  });
  it("defines response and update targets for each SLA severity", () => {
    expect(SUPPORT_SLA).toHaveLength(3);
    for (const row of SUPPORT_SLA) {
      expect(row.tierKey).toMatch(/^sla\.tier\./);
      expect(row.responseKey).toMatch(/^sla\.response\./);
      expect(row.updateKey).toMatch(/^sla\.update\./);
    }
  });
});
