import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/assessment/route";
import { CONSENT_NOTICE_VERSION } from "@/lib/constants";

vi.mock("@/lib/bitrix24", () => ({
  submitAssessment: vi.fn(),
}));

import { submitAssessment } from "@/lib/bitrix24";
const mockSubmit = vi.mocked(submitAssessment);

const validPayload = {
  organization_type: "parish_church",
  contact_email: "secretary@parish.lt",
  consent_privacy: true as const,
  consent_notice_version: CONSENT_NOTICE_VERSION,
  locale: "en" as const,
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/assessment", {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const validIdempotencyKey = "12345678-1234-1234-1234-123456789abc";

describe("POST /api/assessment", () => {
  beforeEach(() => {
    mockSubmit.mockReset();
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/assessment", {
      method: "POST",
      body: "not-json{{{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_json");
  });

  it("returns a benign 202 when the honeypot is filled (bot trap)", async () => {
    const req = makeRequest({ honeypot: "bot-filled-this" });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.status).toBe("accepted");
    expect(json.next_steps.confirmation_email_sent).toBe(false);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("returns 400 when Idempotency-Key is missing", async () => {
    const req = makeRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("missing_idempotency_key");
  });

  it("returns 400 when Idempotency-Key is not a valid UUID", async () => {
    const req = makeRequest(validPayload, { "Idempotency-Key": "not-a-uuid" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("missing_idempotency_key");
  });

  it("returns 400 with field errors for validation failure", async () => {
    const req = makeRequest(
      { ...validPayload, contact_email: "not-an-email" },
      { "Idempotency-Key": validIdempotencyKey },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
    expect(json.error.fields).toHaveProperty("contact_email");
  });

  it("returns 202 on successful upstream submission", async () => {
    const upstreamData = {
      assessment_id: "aaa-bbb-ccc",
      status: "accepted",
      next_steps: { confirmation_email_sent: true, booking_url: null },
    };
    mockSubmit.mockResolvedValue({
      response: new Response(JSON.stringify(upstreamData), { status: 202 }),
      data: upstreamData,
      error: undefined,
    } as any);

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.status).toBe("accepted");
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("forwards upstream 409 (duplicate) verbatim", async () => {
    const upstreamError = { error: { code: "duplicate", message: "Already submitted" } };
    mockSubmit.mockResolvedValue({
      response: new Response(JSON.stringify(upstreamError), {
        status: 409,
        headers: { "Retry-After": "60" },
      }),
      data: undefined,
      error: upstreamError,
    } as any);

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(409);
    expect(res.headers.get("Retry-After")).toBe("60");
    const json = await res.json();
    expect(json.error.code).toBe("duplicate");
  });

  it("forwards upstream 429 (rate limit) verbatim", async () => {
    const upstreamError = { error: { code: "rate_limited", message: "Too many requests" } };
    mockSubmit.mockResolvedValue({
      response: new Response(JSON.stringify(upstreamError), {
        status: 429,
        headers: { "Retry-After": "30" },
      }),
      data: undefined,
      error: upstreamError,
    } as any);

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("returns 502 for unexpected upstream status", async () => {
    mockSubmit.mockResolvedValue({
      response: new Response("", { status: 500 }),
      data: undefined,
      error: undefined,
    } as any);

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe("upstream_error");
  });

  it("returns 500 when the service token is missing (fail closed)", async () => {
    mockSubmit.mockRejectedValue(new Error("API_SERVICE_TOKEN is not configured"));

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("service_unavailable");
    expect(json.error.message).toContain("API_SERVICE_TOKEN");
  });

  it("returns 500 on network failure (fail closed)", async () => {
    mockSubmit.mockRejectedValue(new TypeError("fetch failed"));

    const req = makeRequest(validPayload, { "Idempotency-Key": validIdempotencyKey });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("service_unavailable");
  });

  it("normalises empty optional strings to undefined before forwarding", async () => {
    mockSubmit.mockResolvedValue({
      response: new Response("{}", { status: 202 }),
      data: {},
      error: undefined,
    } as any);

    const payload = {
      ...validPayload,
      organization_name: "",
      current_site_url: "",
      contact_name: "",
      contact_phone: "",
      message: "",
    };
    const req = makeRequest(payload, { "Idempotency-Key": validIdempotencyKey });
    await POST(req);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const forwarded = mockSubmit.mock.calls[0]![0];
    expect(forwarded.organization_name).toBeUndefined();
    expect(forwarded.current_site_url).toBeUndefined();
    expect(forwarded.contact_name).toBeUndefined();
    expect(forwarded.contact_phone).toBeUndefined();
    expect(forwarded.message).toBeUndefined();
    expect(forwarded.honeypot).toBeUndefined();
  });
});
