import { siteConfig } from '@/lib/config';
import { CONTACT_CHANNELS, TIERS, TIER_ORDER } from '@/lib/constants';
import type { Product, TierId } from '@/types/catalog';

// Server-side JSON-LD renderers. Each builder returns a plain object that the
// <JsonLd> component serialises into a <script type="application/ld+json"> tag.
// Values come from verified config/catalog data; empty values are omitted rather
// than fabricated (docs/seo/jsonld-catalog.md).

type Json = Record<string, unknown>;

/** Render one or more JSON-LD graphs. Server Component only. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  const graphs = Array.isArray(data) ? data : [data];
  return (
    <>
      {graphs.map((graph, index) => (
        <script
          // eslint-disable-next-line react/no-array-index-key -- static, ordered, never reordered
          key={index}
          type="application/ld+json"
          // Values are structured data we construct, not user input; JSON.stringify
          // output is escaped for a script context by replacing the closing tag.
          dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }}
        />
      ))}
    </>
  );
}

/** Serialise JSON-LD, escaping sequences that could break out of the <script>. */
function safeJsonLd(graph: Json): string {
  return JSON.stringify(graph)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function organizationJsonLd(): Json {
  const contactPoints = CONTACT_CHANNELS.filter((channel) => channel.kind === 'email').map(
    (channel) => ({
      '@type': 'ContactPoint',
      contactType: channel.id,
      email: channel.value,
      availableLanguage: ['lt', 'en', 'ru'],
    }),
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    legalName: siteConfig.legalEntity,
    url: siteConfig.url,
    ...(contactPoints.length ? { contactPoint: contactPoints } : {}),
  };
}

export function websiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export interface ProductJsonLdInput {
  product: Product;
  name: string;
  description: string;
  /**
   * Resolves a tier id to its LOCALISED display name. Structured data must carry
   * human-readable text, never an i18n message key, so the caller (which owns the
   * translator) supplies this. Passing `TIERS[id].nameKey` directly would leak the
   * raw key (e.g. "tiers.economy.name") into the Offer name.
   */
  tierName: (tierId: TierId) => string;
  /** ISO 4217 currency; EUR across the EU site. */
  currency?: string;
  availability?: string;
}

/** Product + one Offer per tier (net EUR price; VAT shown in UI copy, not here). */
export function productJsonLd({
  product,
  name,
  description,
  tierName,
  currency = 'EUR',
  availability = 'https://schema.org/PreOrder',
}: ProductJsonLdInput): Json {
  const offers = product.tiers.map((tierId) => ({
    '@type': 'Offer',
    name: tierName(tierId),
    price: TIERS[tierId].priceEur.toFixed(2),
    priceCurrency: currency,
    availability,
    url: `${siteConfig.url}/product/${product.slug}`,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: { '@type': 'Brand', name: siteConfig.name },
    offers: { '@type': 'AggregateOffer', lowPrice: TIERS[TIER_ORDER[0]!].priceEur, highPrice: TIERS[TIER_ORDER[TIER_ORDER.length - 1]!].priceEur, priceCurrency: currency, offerCount: offers.length, offers },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: readonly FaqItem[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export interface ArticleJsonLdInput {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  inLanguage: string;
}

export function articleJsonLd(input: ArticleJsonLdInput): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    author: { '@type': 'Organization', name: input.author },
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.image ? { image: input.image } : {}),
    url: input.url,
    inLanguage: input.inLanguage,
    publisher: { '@type': 'Organization', name: siteConfig.name },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

function absolute(path: string): string {
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}
