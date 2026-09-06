// CI guard for ADR-WEB-002 (security-header split).
//   - next.config.ts owns STATIC headers only and MUST NOT define a Content-Security-Policy.
//   - middleware.ts owns the DYNAMIC, nonce-bearing CSP and MUST NOT set static headers.
// Overlapping ownership would let one layer silently override the other, so any
// violation fails the contract-check job. Pure Node (no dependencies).
//
// Patterns match CODE (a `{ key: '...' }` header definition or a `headers.set('...')`
// call), never prose, so explanatory comments mentioning a header do not trip it.
import { readFileSync } from 'node:fs';

const NEXT_CONFIG = 'next.config.ts';
const MIDDLEWARE = 'middleware.ts';

const STATIC_HEADERS = [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
];

const errors = [];
const read = (file) => {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    errors.push(`cannot read ${file}`);
    return '';
  }
};

const nextConfig = read(NEXT_CONFIG);
const middleware = read(MIDDLEWARE);

// A header DEFINED in next.config.ts looks like: { key: 'Header-Name', value: '...' }
const definesHeader = (source, header) =>
  new RegExp(`key:\\s*['"]${header}['"]`, 'i').test(source);
// A header SET in middleware.ts looks like: headers.set('Header-Name', ...)
const setsHeader = (source, header) =>
  new RegExp(`headers\\.set\\(\\s*['"]${header}['"]`, 'i').test(source);

// 1. next.config.ts must NOT define a CSP (the static layer cannot carry a per-request nonce).
if (definesHeader(nextConfig, 'Content-Security-Policy')) {
  errors.push(`${NEXT_CONFIG} defines a Content-Security-Policy header; CSP must live only in ${MIDDLEWARE} (ADR-WEB-002).`);
}

// 2. next.config.ts SHOULD define the static headers (it owns them).
const declaredStatic = STATIC_HEADERS.filter((header) => definesHeader(nextConfig, header));
if (declaredStatic.length === 0) {
  errors.push(`${NEXT_CONFIG} defines no static security headers; expected HSTS, X-Content-Type-Options, etc.`);
}

// 3. middleware.ts MUST set the CSP.
if (!setsHeader(middleware, 'Content-Security-Policy')) {
  errors.push(`${MIDDLEWARE} does not set Content-Security-Policy; the nonce-bearing CSP must be set here (ADR-WEB-002).`);
}

// 4. middleware.ts must NOT set any static header (no overlap with next.config.ts).
for (const header of STATIC_HEADERS) {
  if (setsHeader(middleware, header)) {
    errors.push(`${MIDDLEWARE} sets static header "${header}"; static headers belong in ${NEXT_CONFIG} (ADR-WEB-002).`);
  }
}

if (errors.length) {
  console.error('Header-split check FAILED (ADR-WEB-002):');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(
  `Header-split OK: ${NEXT_CONFIG} defines ${declaredStatic.length} static header(s) and no CSP; ` +
    `${MIDDLEWARE} sets the CSP and no static headers.`,
);
