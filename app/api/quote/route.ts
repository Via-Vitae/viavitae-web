import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { siteConfig } from '@/lib/config';
import { apiServiceToken } from '@/lib/bitrix24';
import { ADDONS, CATALOG } from '@/lib/constants';

// Server-side proxy that turns a quote configuration into a priced PDF. The
// authoritative price is computed by viavitae-api (POST {apiBase}/quotes) — the
// client never fabricates a per-page or per-add-on figure (QODER rule 4). The
// request shape mirrors docs/contracts/quotes.openapi.yaml; the product and
// add-on enums are derived from lib/constants so they cannot drift from the
// catalogue (tests/contract asserts parity against the spec).
export const runtime = 'nodejs';

const productEnum = CATALOG.map((product) => product.id) as [string, ...string[]];
const addonEnum = ADDONS.map((addon) => addon.id) as [string, ...string[]];

const quoteRequestSchema = z
  .object({
    product: z.enum(productEnum),
    tier: z.enum(['economy', 'normal', 'vip']),
    pages: z.number().int().min(1).max(500),
    languages: z.number().int().min(1).max(5),
    addons: z.array(z.enum(addonEnum)).max(5).default([]),
    organization_name: z.string().min(2).max(200).optional().or(z.literal('')),
    contact_name: z.string().min(2).max(120).optional().or(z.literal('')),
    contact_email: z.string().email().max(254),
    // DPIA-001 R7: the quote funnel collects an email, so the exact consent
    // notice version the submitter agreed to is recorded (mirrors /assessment).
    consent_privacy: z.literal(true),
    consent_notice_version: z.string().min(1).max(40),
    locale: z.enum(['lt', 'en', 'ru']),
  })
  .strict();

function errorBody(code: string, message: string, fields?: Record<string, string>) {
  return { error: { code, message, ...(fields ? { fields } : {}) } };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(errorBody('invalid_json', 'Request body must be valid JSON.'), {
      status: 400,
    });
  }

  const parsed = quoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (key) fields[key] = issue.message;
    }
    return NextResponse.json(
      errorBody('validation_error', 'The quote request failed validation.', fields),
      { status: 400 },
    );
  }

  let token: string;
  try {
    token = apiServiceToken();
  } catch (error) {
    // Fail closed: without a service token we must not call the API.
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(errorBody('service_unavailable', message), { status: 500 });
  }

  // Normalise optional-empty strings to undefined so JSON.stringify omits them
  // and the contract's additionalProperties:false / maxLength rules are respected.
  const payload = {
    ...parsed.data,
    organization_name: parsed.data.organization_name || undefined,
    contact_name: parsed.data.contact_name || undefined,
  };

  try {
    const upstream = await fetch(`${siteConfig.apiBase}/quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (upstream.ok) {
      const pdf = await upstream.arrayBuffer();
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') ?? 'application/pdf',
          'Content-Disposition':
            upstream.headers.get('Content-Disposition') ??
            'attachment; filename="viavitae-quote.pdf"',
          'Cache-Control': 'no-store',
        },
      });
    }

    if (upstream.status === 400 || upstream.status === 422 || upstream.status === 429) {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const retryAfter = upstream.headers.get('Retry-After');
      if (retryAfter) headers.set('Retry-After', retryAfter);
      const detail = (await upstream.json().catch(() => null)) as unknown;
      return NextResponse.json(
        detail ?? errorBody('upstream_error', 'The quote service rejected the request.'),
        { status: upstream.status, headers },
      );
    }

    return NextResponse.json(
      errorBody('upstream_error', 'The quote service returned an unexpected response.'),
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      errorBody('service_unavailable', 'Could not reach the quote service.'),
      { status: 502 },
    );
  }
}
