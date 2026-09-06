import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/lib/i18n';

const HUB = [
  { href: '/resources/blog', key: 'nav.blog' },
  { href: '/resources/news', key: 'nav.news' },
  { href: '/resources/guides', key: 'nav.guides' },
  { href: '/resources/legal-compliance', key: 'nav.legalCompliance' },
  { href: '/resources/onboarding-training', key: 'nav.onboarding' },
] as const;

export default async function ResourcesLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label={t('resources.hubLabel')} className="mb-8 border-b border-border-divider">
        <ul className="flex flex-wrap gap-4">
          {HUB.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-body-md font-medium text-text-secondary hover:text-text-brand">
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
