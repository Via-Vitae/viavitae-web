import { describe, expect, it } from "vitest";
import { findSeoEntry, indexableEntries } from "@/components/seo/metadata-builder";
import { CATALOG } from "@/lib/constants";

// Only the pure, synchronous helpers are unit-tested here. buildMetadata() calls
// next-intl's getTranslations and needs a request context, so it is exercised by
// the Playwright suite (rendered pages) rather than in jsdom.

describe("findSeoEntry", () => {
  it("resolves the homepage entry", () => {
    const entry = findSeoEntry("/");
    expect(entry).toBeDefined();
    expect(entry?.titleKey).toBe("seo.home.title");
    expect(entry?.index).toBe(true);
  });

  it("resolves a product entry by canonical path", () => {
    expect(findSeoEntry("/product/diocese")?.titleKey).toBe("seo.product.diocese.title");
  });

  it("returns undefined for an unknown path", () => {
    expect(findSeoEntry("/does-not-exist")).toBeUndefined();
  });
});

describe("indexableEntries", () => {
  const entries = indexableEntries();

  it("includes only entries that declare themselves indexable", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(entry.index).toBe(true);
  });

  it("includes the homepage and every catalogue product", () => {
    const paths = new Set(entries.map((entry) => entry.path));
    expect(paths.has("/")).toBe(true);
    for (const product of CATALOG) expect(paths.has(`/product/${product.slug}`)).toBe(true);
  });

  it("excludes the no-index client portal login", () => {
    const paths = new Set(entries.map((entry) => entry.path));
    expect(paths.has("/login")).toBe(false);
    // The login page still exists in the matrix, just flagged index:false.
    expect(findSeoEntry("/login")?.index).toBe(false);
  });

  it("gives every indexable entry a title and description key", () => {
    for (const entry of entries) {
      expect(entry.titleKey).toMatch(/^seo\./);
      expect(entry.descriptionKey).toMatch(/^seo\./);
    }
  });
});
