import { describe, expect, it, beforeEach } from "vitest";
import { CONSENT_COOKIE, readConsent, disableMatomo } from "@/lib/analytics";

describe("readConsent", () => {
  beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
  });

  it("returns default (all false) when no cookie exists", () => {
    const state = readConsent();
    expect(state.necessary).toBe(true);
    expect(state.analytics).toBe(false);
    expect(state.marketing).toBe(false);
  });

  it("parses a valid consent cookie", () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ necessary: true, analytics: true, marketing: false }))}; path=/`;
    const state = readConsent();
    expect(state.necessary).toBe(true);
    expect(state.analytics).toBe(true);
    expect(state.marketing).toBe(false);
  });

  it("returns default for malformed JSON", () => {
    document.cookie = `${CONSENT_COOKIE}=not-json; path=/`;
    const state = readConsent();
    expect(state.necessary).toBe(true);
    expect(state.analytics).toBe(false);
    expect(state.marketing).toBe(false);
  });

  it("returns default for partial consent (missing fields)", () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ analytics: true }))}; path=/`;
    const state = readConsent();
    expect(state.necessary).toBe(true);
    expect(state.analytics).toBe(true);
    expect(state.marketing).toBe(false);
  });

  it("parses a consent cookie with marketing enabled", () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ necessary: true, analytics: false, marketing: true }))}; path=/`;
    const state = readConsent();
    expect(state.necessary).toBe(true);
    expect(state.analytics).toBe(false);
    expect(state.marketing).toBe(true);
  });
});

describe("disableMatomo", () => {
  it("pushes optUserOut to the tracker", () => {
    window._paq = [];
    disableMatomo();
    expect(window._paq).toContainEqual(["optUserOut"]);
  });

  it("creates _paq array if it does not exist", () => {
    window._paq = undefined;
    disableMatomo();
    expect(window._paq).toBeDefined();
    expect(window._paq).toContainEqual(["optUserOut"]);
  });
});
