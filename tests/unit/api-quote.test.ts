import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/quote/route";
import { CONSENT_NOTICE_VERSION } from "@/lib/constants";

vi.mock("@/lib/bitrix24", () => ({
  apiServiceToken: vi.fn(),
}));

import { apiServiceToken } from "@/lib/bitrix24";
const mockToken = vi.mocked(apiServiceToken);

const validPayload = {
  product: "parish-church",
  tier: "normal",
  pages: 8,
  languages: 1,
  addons: [],
  contact_email: "secretary@parish.lt",
  consent_privacy: true as const,
  consent_notice_version: CONSENT_NOTICE_VERSION,
  locale: "en" as const,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/quote", {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

const fakeFetch = vi.fn();

describe("POST /api/quote", () => {
  beforeEach(() => {
    mockToken.mockReset();
    fakeFetch.mockReset();
    mockToken.mockReturnValue("test-service-token");
    vi.stubGlobal("fetch", fakeFetch);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/quote", {
      method: "POST",
      body: "not-json{{{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_json");
  });

  it("returns 400 with field errors for validation failure", async () => {
    const req = makeRequest({ ...validPayload, pages: -1 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.fields).toHaveProperty("pages");
  });

  it("returns 400 for an unknown product id", async () => {
    const req = makeRequest({ ...validPayload, product: "spaceport" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.fields).toHaveProperty("product");
  });

  it("returns 500 when the service token is missing (fail closed)", async () => {
    mockToken.mockImplementation(() => {
      throw new Error("API_SERVICE_TOKEN is not configured");
    });
    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("service_unavailable");
    expect(json.error.message).toContain("API_SERVICE_TOKEN");
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("returns a PDF on successful upstream response", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    fakeFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/pdf" }),
      arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
    });

    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Disposition")).toContain("viavitae-quote");

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0]!;
    expect(url).toContain("/quotes");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-service-token");
  });

  it("forwards upstream 400 error verbatim", async () => {
    const upstreamError = { error: { code: "invalid_config", message: "Bad pages" } };
    fakeFetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () => Promise.resolve(upstreamError),
    });

    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_config");
  });

  it("forwards upstream 429 with Retry-After header", async () => {
    const upstreamError = { error: { code: "rate_limited", message: "Slow down" } };
    fakeFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({
        "Content-Type": "application/json",
        "Retry-After": "30",
      }),
      json: () => Promise.resolve(upstreamError),
    });

    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("returns 502 for unexpected upstream status", async () => {
    fakeFetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
    });

    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe("upstream_error");
  });

  it("returns 502 on network failure", async () => {
    fakeFetch.mockRejectedValue(new TypeError("fetch failed"));

    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe("service_unavailable");
  });

  it("normalises empty optional strings before forwarding", async () => {
    fakeFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/pdf" }),
      arrayBuffer: () => Promise.resolve(new Uint8Array([]).buffer),
    });

    const payload = {
      ...validPayload,
      organization_name: "",
      contact_name: "",
    };
    const req = makeRequest(payload);
    await POST(req);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const forwarded = JSON.parse(fakeFetch.mock.calls[0]![1].body);
    expect(forwarded.organization_name).toBeUndefined();
    expect(forwarded.contact_name).toBeUndefined();
  });
});
