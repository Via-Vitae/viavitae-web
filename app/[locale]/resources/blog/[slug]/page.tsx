import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDoc, listSlugs } from '@/components/mdx/content-loader';
import { mdxComponents } from '@/components/mdx/mdx-components';
import { JsonLd, articleJsonLd } from '@/components/seo/jsonld';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { siteConfig } from '@/lib/config';
import { routing } from '@/lib/routing';
import type { BlogFrontMatter } from '@/types/content';
import type { Locale } from '@/lib/routing';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const locales = routing.locales as readonly Locale[];
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const slugs = await listSlugs('blog', locale);
      return slugs.map((slug) => ({ locale, slug }));
    }),
  );
  return entries.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = await getDoc<BlogFrontMatter>('blog', locale as Locale, slug);
  if (!doc) return {};
  const url = `${siteConfig.url}/${locale}/resources/blog/${slug}`;
  return {
    title: doc.frontMatter.title,
    description: doc.frontMatter.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: doc.frontMatter.title,
      description: doc.frontMatter.description,
      publishedTime: doc.frontMatter.publishedAt,
      modifiedTime: doc.frontMatter.updatedAt,
      authors: [doc.frontMatter.author],
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const doc = await getDoc<BlogFrontMatter>('blog', locale as Locale, slug);
  if (!doc) notFound();
  const t = await getTranslations({ locale });
  const fm = doc.frontMatter;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <JsonLd
        data={articleJsonLd({
          headline: fm.title,
          description: fm.description,
          author: fm.author,
          datePublished: fm.publishedAt,
          dateModified: fm.updatedAt,
          image: fm.image ? `${siteConfig.url}${fm.image}` : undefined,
          url: `${siteConfig.url}/${locale}/resources/blog/${fm.slug}`,
          inLanguage: locale,
        })}
      />
      <Breadcrumbs
        label={t('nav.breadcrumb')}
        crumbs={[
          { name: t('nav.home'), path: '/' },
          { name: t('nav.blog'), path: '/resources/blog' },
          { name: fm.title, path: `/resources/blog/${fm.slug}` },
        ]}
      />
      <header className="flex flex-col gap-2">
        <h1 className="text-fluid-display-md text-text-primary">{fm.title}</h1>
        <p className="text-body-sm text-text-muted">
          {t('blog.byAuthor', { author: fm.author })} · <time dateTime={fm.publishedAt}>{fm.publishedAt}</time>
        </p>
      </header>
      <div className="vv-prose flex flex-col gap-4 text-body-lg text-text-secondary">
        <MDXRemote source={doc.body} components={mdxComponents} />
      </div>
    </article>
  );
}
