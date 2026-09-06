import type { MetadataRoute } from 'next';

// Web app manifest. Colours are the real brand tokens (navy-900 #0e1b3d,
// ivory-50 #fefdfc from @via-vitae/brand), not invented values. start_url points
// at the default locale (LT) because routing uses localePrefix: 'always'.
//
// PNG icons (icon-192.png, icon-512.png, apple-icon.png, favicon.ico) are
// LAUNCH-GATED binary assets: they must be exported from the brand kit rather
// than fabricated here (QODER rule 4 / F-fix). The vector icon.svg is authored
// and ships now; add the raster sizes before go-live.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ViaVitae',
    short_name: 'ViaVitae',
    description:
      'Digital presence, donations and cemetery-services software for churches, dioceses and faith organisations in the EU.',
    start_url: '/lt',
    scope: '/',
    display: 'standalone',
    background_color: '#fefdfc',
    theme_color: '#0e1b3d',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
