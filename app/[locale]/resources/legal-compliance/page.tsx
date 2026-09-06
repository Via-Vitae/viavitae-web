import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMetadata } from '@/components/seo/metadata-builder';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Link } from '@/lib/i18n';
import type { Locale } from '@/lib/routing';

const PATH = '/resources/legal-compliance';
const NS = 'legalCompliance';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: PATH, locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const body = t.raw(`${NS}.body`) as string[];
  const links = (t.has(`${NS}.links`) ? (t.raw(`${NS}.links`) as Array<{ label: string; href: string }>) : []);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs label={t('nav.breadcrumb')} crumbs={[{ name: t('nav.home'), path: '/' }, { name: t('nav.resources'), path: '/resources/blog' }, { name: t(`${NS}.title`), path: PATH }]} />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t(`${NS}.title`)}</h1>
        <p className="mt-3 text-body-lg text-text-secondary">{t(`${NS}.lead`)}</p>
      </header>
      <div className="flex flex-col gap-4">
        {body.map((paragraph, index) => (<p key={index} className="text-body-md text-text-secondary">{paragraph}</p>))}
      </div>
      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.href}><Link href={link.href} className="text-body-md text-text-link underline">{link.label}</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
