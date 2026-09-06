import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/components/seo/metadata-builder';
import { Link } from '@/lib/i18n';
import { getDoc, listSlugs } from '@/components/mdx/content-loader';
import type { BlogFrontMatter } from '@/types/content';
import type { Locale } from '@/lib/routing';

const PAGE_SIZE = 9;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: '/resources/blog', locale: locale as Locale });
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const loc = locale as Locale;

  const slugs = await listSlugs('blog', loc);
  const docs = (
    await Promise.all(slugs.map((slug) => getDoc<BlogFrontMatter>('blog', loc, slug)))
  )
    .filter((doc): doc is { frontMatter: BlogFrontMatter; body: string } => Boolean(doc && !doc.frontMatter.draft))
    .filter((doc) => !query.category || doc.frontMatter.category === query.category)
    .sort((a, b) => b.frontMatter.publishedAt.localeCompare(a.frontMatter.publishedAt));

  const categories = Array.from(new Set((await Promise.all(slugs.map((s) => getDoc<BlogFrontMatter>('blog', loc, s))))
    .map((d) => d?.frontMatter.category)
    .filter((c): c is string => Boolean(c)))).sort();

  const page = Math.max(1, Number(query.page ?? '1') || 1);
  const pageCount = Math.max(1, Math.ceil(docs.length / PAGE_SIZE));
  const visible = docs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hrefFor = (nextPage: number, category?: string) => {
    const sp = new URLSearchParams();
    if (nextPage > 1) sp.set('page', String(nextPage));
    if (category) sp.set('category', category);
    const qs = sp.toString();
    return `/resources/blog${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t('blog.title')}</h1>
        <p className="mt-2 text-body-lg text-text-secondary">{t('blog.lead')}</p>
      </header>

      {categories.length > 0 && (
        <nav aria-label={t('blog.categoryFilter')} className="flex flex-wrap gap-2">
          <Link href={hrefFor(1)} className="rounded-sm border border-border px-3 py-1 text-body-sm">{t('blog.allCategories')}</Link>
          {categories.map((category) => (
            <Link key={category} href={hrefFor(1, category)} className="rounded-sm border border-border px-3 py-1 text-body-sm" aria-current={query.category === category ? 'true' : undefined}>
              {category}
            </Link>
          ))}
        </nav>
      )}

      {visible.length === 0 ? (
        <p className="rounded-md border border-border bg-surface-sunken p-6 text-body-md text-text-secondary">{t('blog.empty')}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((doc) => (
            <li key={doc.frontMatter.slug}>
              <Link href={`/resources/blog/${doc.frontMatter.slug}`} className="flex h-full flex-col gap-2 rounded-md border border-border bg-surface-raised p-5 hover:shadow-md motion-reduce:transition-none">
                <span className="text-body-sm text-text-muted"><time dateTime={doc.frontMatter.publishedAt}>{doc.frontMatter.publishedAt}</time></span>
                <span className="text-body-lg font-semibold text-text-primary">{doc.frontMatter.title}</span>
                <span className="text-body-sm text-text-secondary">{doc.frontMatter.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label={t('blog.pagination')} className="flex items-center gap-3">
          {page > 1 && <Link href={hrefFor(page - 1, query.category)} className="text-body-md text-text-link underline">{t('blog.prev')}</Link>}
          <span className="text-body-sm text-text-muted">{t('blog.pageOf', { page, pageCount })}</span>
          {page < pageCount && <Link href={hrefFor(page + 1, query.category)} className="text-body-md text-text-link underline">{t('blog.next')}</Link>}
        </nav>
      )}
    </div>
  );
}
