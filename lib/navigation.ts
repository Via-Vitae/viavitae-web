import { CATALOG } from './constants';

// Single source of truth for navigation structure (menus are rendered FROM data,
// never hardcoded in components). Paths are canonical and locale-less; the
// locale-aware <Link> from lib/i18n.ts adds the prefix at render time.

export interface NavItem {
  readonly id: string;
  /** i18n message key for the visible label (nav.*). */
  readonly labelKey: string;
  /** Canonical href, no locale prefix. */
  readonly href: string;
}

/** Primary global navigation (header top row). "Product" opens the mega-menu. */
export const GLOBAL_NAV: readonly NavItem[] = [
  { id: 'product', labelKey: 'nav.product', href: '/product/parish-church' },
  { id: 'pricing', labelKey: 'nav.pricing', href: '/pricing' },
  { id: 'resources', labelKey: 'nav.resources', href: '/resources/blog' },
  { id: 'solutions', labelKey: 'nav.solutions', href: '/solutions' },
  { id: 'integrations', labelKey: 'nav.integrations', href: '/integrations' },
  { id: 'partners', labelKey: 'nav.partners', href: '/partners' },
  { id: 'why', labelKey: 'nav.why', href: '/why' },
] as const;

/** Header calls to action. */
export const NAV_CTAS = {
  startFree: { id: 'start-free', labelKey: 'nav.startFree', href: '/start-for-free' },
  login: { id: 'login', labelKey: 'nav.login', href: '/login' },
} as const;

/**
 * The church ribbon / product mega-menu: all 15 catalogue products, derived from
 * CATALOG so the ribbon, mega-menu, sitemap and SEO matrix never drift.
 */
export const CHURCH_RIBBON: readonly NavItem[] = CATALOG.map((product) => ({
  id: product.id,
  labelKey: product.shortNameKey,
  href: `/product/${product.slug}`,
}));

export interface FooterColumn {
  readonly id: string;
  readonly headingKey: string;
  readonly items: readonly NavItem[];
}

/** Four footer columns. Legal column links to the launch-gated legal pages. */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    id: 'products',
    headingKey: 'footer.products',
    items: [
      { id: 'parish', labelKey: 'products.parishChurch.short', href: '/product/parish-church' },
      { id: 'diocese', labelKey: 'products.diocese.short', href: '/product/diocese' },
      { id: 'donations', labelKey: 'products.donationFlow.short', href: '/product/donation-flow' },
      { id: 'store', labelKey: 'products.onlineStore.short', href: '/product/online-store' },
      { id: 'pricing', labelKey: 'nav.pricing', href: '/pricing' },
    ],
  },
  {
    id: 'company',
    headingKey: 'footer.company',
    items: [
      { id: 'about', labelKey: 'nav.about', href: '/about' },
      { id: 'mission', labelKey: 'nav.mission', href: '/mission' },
      { id: 'partners', labelKey: 'nav.partners', href: '/partners' },
      { id: 'why', labelKey: 'nav.why', href: '/why' },
      { id: 'contact', labelKey: 'nav.contact', href: '/contact-support' },
    ],
  },
  {
    id: 'resources',
    headingKey: 'footer.resources',
    items: [
      { id: 'blog', labelKey: 'nav.blog', href: '/resources/blog' },
      { id: 'news', labelKey: 'nav.news', href: '/resources/news' },
      { id: 'guides', labelKey: 'nav.guides', href: '/resources/guides' },
      { id: 'onboarding', labelKey: 'nav.onboarding', href: '/resources/onboarding-training' },
      { id: 'compliance', labelKey: 'nav.legalCompliance', href: '/resources/legal-compliance' },
    ],
  },
  {
    id: 'legal',
    headingKey: 'footer.legal',
    items: [
      { id: 'privacy', labelKey: 'legal.privacy', href: '/legal/privacy' },
      { id: 'terms', labelKey: 'legal.terms', href: '/legal/terms' },
      { id: 'cookies', labelKey: 'legal.cookies', href: '/legal/cookies' },
      { id: 'impressum', labelKey: 'legal.impressum', href: '/legal/impressum' },
    ],
  },
] as const;
