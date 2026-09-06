import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// ADR-WEB-002 (docs/decisions/ADR-WEB-002-security-headers-split.md):
// next.config.ts sets STATIC security headers only. The per-request,
// nonce-bearing Content-Security-Policy is set in middleware.ts. The two must
// never both set CSP; scripts/check-header-split.mjs enforces this in CI.
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

// Static headers. These do not vary per request, so they are safe to declare
// here and are applied to every response, including static assets.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output keeps the runtime image small (see Dockerfile).
  output: 'standalone',
  images: {
    // Launch-gated: demo.viavitae.com thumbnails are embedded via <iframe>
    // (demo-embed.tsx), not next/image. Remote patterns are declared here for
    // product/OG imagery served from the ViaVitae CDN once it is provisioned.
    remotePatterns: [
      { protocol: 'https', hostname: 'demo.viavitae.com' },
      { protocol: 'https', hostname: 'cdn.viavitae.com' },
      { protocol: 'https', hostname: 'status.viavitae.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
