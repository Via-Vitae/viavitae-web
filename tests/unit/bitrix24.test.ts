import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { apiServiceToken } from "@/lib/bitrix24";

describe("apiServiceToken", () => {
  const originalEnv = process.env.API_SERVICE_TOKEN;

  beforeEach(() => {
    delete process.env.API_SERVICE_TOKEN;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.API_SERVICE_TOKEN = originalEnv;
    } else {
      delete process.env.API_SERVICE_TOKEN;
    }
  });

  it("throws when API_SERVICE_TOKEN is not configured (fail closed)", () => {
    expect(() => apiServiceToken()).toThrow("API_SERVICE_TOKEN is not configured");
  });

  it("returns the token when API_SERVICE_TOKEN is set", () => {
    process.env.API_SERVICE_TOKEN = "test-token-123";
    expect(apiServiceToken()).toBe("test-token-123");
  });

  it("throws when API_SERVICE_TOKEN is empty string", () => {
    process.env.API_SERVICE_TOKEN = "";
    expect(() => apiServiceToken()).toThrow("API_SERVICE_TOKEN is not configured");
  });
});
