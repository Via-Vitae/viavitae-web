import { describe, expect, it } from "vitest";
import { GLOBAL_NAV, NAV_CTAS, CHURCH_RIBBON, FOOTER_COLUMNS } from "@/lib/navigation";
import { CATALOG } from "@/lib/constants";

describe("GLOBAL_NAV", () => {
  it("has the expected number of items", () => {
    expect(GLOBAL_NAV.length).toBe(7);
  });

  it("each item has id, labelKey, and href", () => {
    for (const item of GLOBAL_NAV) {
      expect(item.id).toBeTruthy();
      expect(item.labelKey).toMatch(/^nav\./);
      expect(item.href).toMatch(/^\//);
    }
  });

  it("product link points to the primary product page", () => {
    const product = GLOBAL_NAV.find((n) => n.id === "product");
    expect(product?.href).toBe("/product/parish-church");
  });
});

describe("NAV_CTAS", () => {
  it("has startFree and login", () => {
    expect(NAV_CTAS.startFree.id).toBe("start-free");
    expect(NAV_CTAS.startFree.href).toBe("/start-for-free");
    expect(NAV_CTAS.login.id).toBe("login");
    expect(NAV_CTAS.login.href).toBe("/login");
  });
});

describe("CHURCH_RIBBON", () => {
  it("has one item per catalogue product", () => {
    expect(CHURCH_RIBBON.length).toBe(CATALOG.length);
  });

  it("each item has id, labelKey, and href derived from CATALOG", () => {
    for (let i = 0; i < CHURCH_RIBBON.length; i++) {
      const ribbon = CHURCH_RIBBON[i]!;
      const catalog = CATALOG[i]!;
      expect(ribbon.id).toBe(catalog.id);
      expect(ribbon.labelKey).toBe(catalog.shortNameKey);
      expect(ribbon.href).toBe(`/product/${catalog.slug}`);
    }
  });
});

describe("FOOTER_COLUMNS", () => {
  it("has 4 columns (products, company, resources, legal)", () => {
    expect(FOOTER_COLUMNS.length).toBe(4);
    expect(FOOTER_COLUMNS[0]!.id).toBe("products");
    expect(FOOTER_COLUMNS[1]!.id).toBe("company");
    expect(FOOTER_COLUMNS[2]!.id).toBe("resources");
    expect(FOOTER_COLUMNS[3]!.id).toBe("legal");
  });

  it("each column has a headingKey and items", () => {
    for (const col of FOOTER_COLUMNS) {
      expect(col.headingKey).toBeTruthy();
      expect(col.items.length).toBeGreaterThan(0);
      for (const item of col.items) {
        expect(item.id).toBeTruthy();
        expect(item.labelKey).toBeTruthy();
        expect(item.href).toMatch(/^\//);
      }
    }
  });

  it("legal column links to the 4 legal pages", () => {
    const legal = FOOTER_COLUMNS[3]!;
    const hrefs = legal.items.map((i) => i.href);
    expect(hrefs).toContain("/legal/privacy");
    expect(hrefs).toContain("/legal/terms");
    expect(hrefs).toContain("/legal/cookies");
    expect(hrefs).toContain("/legal/impressum");
  });
});
