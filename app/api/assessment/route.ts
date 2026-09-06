import { NextResponse, type NextRequest } from 'next/server';
import { assessmentRequestSchema } from '@/lib/assessment-schema';
import { submitAssessment } from '@/lib/bitrix24';

// Server-side proxy for the "Request a Digital Assessment" funnel. The browser
// never talks to viavitae-api directly and never holds the service token; this
// route re-validates the payload against the SAME schema the client uses
// (lib/assessment-schema.ts, derived from docs/contracts/assessment.openapi.yaml)
// and forwards it over the generated contract (ADR-WEB-005, C4).
//
// DPIA-001 controls enforced here:
//   - honeypot: a non-empty trap field returns a benign 202 and is NOT forwarded;
//   - idempotency: a client-generated UUID key is required so retries de-duplicate;
//   - fail closed: a missing API_SERVICE_TOKEN or upstream/network failure is
//     reported as an error, never as success.
export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.');
  }

  // Bot trap first: a filled honeypot looks like success but is never forwarded.
  // Returning the same 202 shape as a real submission keeps the trap invisible.
  if (typeof raw === 'object' && raw !== null) {
    const honeypot = (raw as { honeypot?: unknown }).honeypot;
    if (typeof honeypot === 'string' && honeypot.length > 0) {
      return NextResponse.json(
        {
          assessment_id: crypto.randomUUID(),
          status: 'accepted',
          next_steps: { confirmation_email_sent: false, booking_url: null },
        },
        { status: 202 },
      );
    }
  }

  const idempotencyKey = request.headers.get('Idempotency-Key') ?? '';
  if (!UUID_RE.test(idempotencyKey)) {
    return errorResponse(
      400,
      'missing_idempotency_key',
      'A valid Idempotency-Key header (UUID) is required.',
    );
  }

  const parsed = assessmentRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (key) fields[key] = issue.message;
    }
    return errorResponse(
      400,
      'validation_error',
      'The assessment request failed validation.',
      fields,
    );
  }

  try {
    // Strip the honeypot (a client-side trap only) and normalise optional-empty
    // strings to undefined so the forwarded payload satisfies the contract's
    // format/minLength rules (an empty string would violate e.g. format: uri).
    // The server does not trust the client to have normalised these already.
    const body = {
      ...parsed.data,
      honeypot: undefined,
      organization_name: parsed.data.organization_name || undefined,
      current_site_url: parsed.data.current_site_url || undefined,
      contact_name: parsed.data.contact_name || undefined,
      contact_phone: parsed.data.contact_phone || undefined,
      message: parsed.data.message || undefined,
    };
    const result = await submitAssessment(body, idempotencyKey);
    const status = result.response.status;

    if (status === 202) {
      return NextResponse.json(result.data, { status: 202 });
    }

    // Forward the upstream contract error verbatim (400 / 409 / 422 / 429).
    if (status === 400 || status === 409 || status === 422 || status === 429) {
      const headers = new Headers();
      const retryAfter = result.response.headers.get('Retry-After');
      if (retryAfter) headers.set('Retry-After', retryAfter);
      return NextResponse.json(
        result.error ?? {
          error: { code: 'upstream_error', message: 'Upstream rejected the request.' },
        },
        { status, headers },
      );
    }

    return errorResponse(
      502,
      'upstream_error',
      'The assessment service returned an unexpected response.',
    );
  } catch (error) {
    // Fail closed: a missing service token (thrown by the gateway) or a network
    // failure must surface as an error, never as a silent success.
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(500, 'service_unavailable', `Assessment submission failed: ${message}`);
  }
}
