import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/components/seo/metadata-builder';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { TierTable } from '@/components/church/tier-table';
import { QuoteCalculator } from '@/components/church/quote-calculator';
import type { Locale } from '@/lib/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: '/pricing', locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16">
      <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ name: t('nav.home'), path: '/' }, { name: t('nav.pricing'), path: '/pricing' }]} />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t('pricing.title')}</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-text-secondary">{t('pricing.lead')}</p>
      </header>
      <section aria-labelledby="tiers-heading">
        <h2 id="tiers-heading" className="text-heading-2 text-text-primary">{t('pricing.tiersHeading')}</h2>
        <div className="mt-6"><TierTable /></div>
      </section>
      <section aria-labelledby="calc-heading">
        <h2 id="calc-heading" className="text-heading-2 text-text-primary">{t('pricing.calculatorHeading')}</h2>
        <div className="mt-6"><QuoteCalculator /></div>
      </section>
    </div>
  );
}
