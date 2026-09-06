import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { buildMetadata } from '@/components/seo/metadata-builder';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { getDoc } from '@/components/mdx/content-loader';
import { mdxComponents } from '@/components/mdx/mdx-components';
import type { LegalFrontMatter } from '@/types/content';
import type { Locale } from '@/lib/routing';

// Legal document page. Content is authored per locale under content/legal/<locale>/
// and NEVER falls back to another locale (ADR-WEB-003): a legal text in the wrong
// language/jurisdiction is worse than none. When the document is not yet authored,
// a launch-gate notice is shown instead of fabricated legal text — real content from
// Legal (and the LT imprint for /legal/impressum) is a go-live requirement.
const DOC = 'privacy';
const PATH = `/legal/${DOC}`;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: PATH, locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const doc = await getDoc<LegalFrontMatter>('legal', locale as Locale, DOC);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ name: t('nav.home'), path: '/' }, { name: t(`legal.${DOC}`), path: PATH }]} />
      <h1 className="text-fluid-display-md text-text-primary">{t(`legal.${DOC}`)}</h1>
      {doc ? (
        <>
          <p className="text-body-sm text-text-muted">
            {t('legal.version', { version: doc.frontMatter.version })} · {t('legal.effective', { date: doc.frontMatter.effectiveDate })}
          </p>
          <div className="vv-prose flex flex-col gap-4 text-body-md text-text-secondary">
            <MDXRemote source={doc.body} components={mdxComponents} />
          </div>
        </>
      ) : (
        <p role="note" className="rounded-md border border-state-warning bg-state-warning-tint p-6 text-body-md text-text-primary">
          {t('legal.pendingNotice')}
        </p>
      )}
    </div>
  );
}
