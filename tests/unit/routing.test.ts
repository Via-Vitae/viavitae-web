import { describe, expect, it } from "vitest";
import { COMING_SOON_LOCALES, isLocale, localizedPath, routing } from "@/lib/routing";

describe("routing", () => {
  it("declares LT/EN/RU with LT as the default and always-prefixed locales", () => {
    expect(routing.locales).toEqual(["lt", "en", "ru"]);
    expect(routing.defaultLocale).toBe("lt");
    expect(routing.localePrefix).toBe("always");
  });

  it("keeps PL/DE as coming-soon (declared but not routable)", () => {
    expect(COMING_SOON_LOCALES).toEqual(["pl", "de"]);
    for (const locale of COMING_SOON_LOCALES) {
      expect(routing.locales).not.toContain(locale);
    }
  });
});

describe("isLocale", () => {
  it("accepts routable locales and rejects everything else", () => {
    expect(isLocale("lt")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("pl")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("LT")).toBe(false);
  });
});

describe("localizedPath", () => {
  it("prefixes a canonical path with the locale segment", () => {
    expect(localizedPath("en", "/pricing")).toBe("/en/pricing");
    expect(localizedPath("ru", "product/diocese")).toBe("/ru/product/diocese");
  });
  it("maps the root path to just the locale prefix", () => {
    expect(localizedPath("lt", "/")).toBe("/lt");
  });
});
