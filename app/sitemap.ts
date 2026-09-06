import type { MetadataRoute } from 'next';
import { indexableEntries } from '@/components/seo/metadata-builder';
import { getDoc, listSlugs } from '@/components/mdx/content-loader';
import { siteConfig } from '@/lib/config';
import { routing, localizedPath, type Locale } from '@/lib/routing';
import { absoluteUrl } from '@/lib/utils';
import type { BlogFrontMatter } from '@/types/content';

// Sitemap is generated from the SAME SEO matrix that drives page metadata
// (docs/seo/meta-matrix.json via metadata-builder.indexableEntries), so the set of
// indexable URLs can never drift from the set of pages that declare themselves
// indexable. Every URL is emitted once per locale with hreflang alternates
// (docs/seo/hreflang-map.md). Blog articles are expanded from published content.

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

const LOCALES = routing.locales as readonly Locale[];

function alternatesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = absoluteUrl(siteConfig.url, localizedPath(locale, path));
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = indexableEntries().flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(siteConfig.url, localizedPath(locale, entry.path)),
      lastModified: new Date(),
      changeFrequency: (entry.changefreq ?? 'monthly') as ChangeFrequency,
      priority: entry.priority ? Number(entry.priority) : 0.6,
      alternates: { languages: alternatesFor(entry.path) },
    })),
  );

  // Published blog articles (drafts excluded), expanded per locale.
  const perLocale = await Promise.all(
    LOCALES.map(async (locale) => {
      const slugs = await listSlugs('blog', locale);
      const docs = await Promise.all(slugs.map((slug) => getDoc<BlogFrontMatter>('blog', locale, slug)));
      return docs
        .filter((doc): doc is { frontMatter: BlogFrontMatter; body: string } => Boolean(doc && !doc.frontMatter.draft))
        .map((doc) => {
          const path = `/resources/blog/${doc.frontMatter.slug}`;
          return {
            url: absoluteUrl(siteConfig.url, localizedPath(locale, path)),
            lastModified: new Date(doc.frontMatter.updatedAt ?? doc.frontMatter.publishedAt),
            changeFrequency: 'monthly' as ChangeFrequency,
            priority: 0.6,
            alternates: { languages: alternatesFor(path) },
          };
        });
    }),
  );

  return [...staticEntries, ...perLocale.flat()];
}
