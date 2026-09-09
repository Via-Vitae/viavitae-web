import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import matrix from "@/docs/seo/meta-matrix.json";
import { siteConfig } from "@/lib/config";
import { routing, localizedPath } from "@/lib/routing";
import type { Locale } from "@/lib/routing";
import { absoluteUrl } from "@/lib/utils";

// Centralised title / description / canonical / Open Graph logic. Every page calls
// buildMetadata() so metadata is consistent and driven by docs/seo/meta-matrix.json
// (the single source of truth checked by scripts/check-seo-matrix.ts).

interface PageEntry {
  path: string;
  titleKey: string;
  descriptionKey: string;
  index: boolean;
  jsonld: string[];
  priority?: string;
  changefreq?: string;
}

const PAGES = matrix.pages as PageEntry[];

/** Look up the SEO matrix entry for a canonical (locale-less) path. */
export function findSeoEntry(path: string): PageEntry | undefined {
  return PAGES.find((page) => page.path === path);
}

/** All indexable matrix entries — consumed by app/sitemap.ts. */
export function indexableEntries(): PageEntry[] {
  return PAGES.filter((page) => page.index);
}

function buildAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(siteConfig.url, localizedPath(locale, path));
  }
  // x-default points at the default locale (LT — pilot market); see hreflang-map.md.
  languages["x-default"] = absoluteUrl(
    siteConfig.url,
    localizedPath(routing.defaultLocale as Locale, path),
  );
  return {
    canonical: absoluteUrl(siteConfig.url, path),
    languages,
  };
}

export interface BuildMetadataInput {
  /** Canonical, locale-less path, e.g. "/product/diocese". */
  path: string;
  locale: Locale;
  /** Optional OG image path under /public; defaults to the per-locale OG image. */
  ogImage?: string;
}

/**
 * Build a Next Metadata object for a page from the SEO matrix and the localised
 * message bundle. Titles/descriptions are message keys (never hardcoded copy).
 */
export async function buildMetadata({
  path,
  locale,
  ogImage,
}: BuildMetadataInput): Promise<Metadata> {
  const entry = findSeoEntry(path);
  const t = await getTranslations({ locale });

  // If a page has no matrix entry, fail loudly in development; check-seo-matrix
  // makes this a CI failure, so this branch should be unreachable in practice.
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[seo] no meta-matrix entry for path "${path}"`);
    }
    return { title: siteConfig.name };
  }

  const title = t(entry.titleKey);
  const description = t(entry.descriptionKey);
  const canonical = absoluteUrl(siteConfig.url, localizedPath(locale, path));
  const image = ogImage ?? `/og/${locale}.png`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: buildAlternates(path),
    robots: entry.index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.name,
      title,
      description,
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
