import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n';
import { FOOTER_COLUMNS } from '@/lib/navigation';
import { siteConfig } from '@/lib/config';

// Four-column footer + trust badges + legal line. The newsletter signup is a
// LAUNCH GATE: enabling it requires a same-origin /api/newsletter route (CSP
// form-action is 'self'), a double-opt-in provider and a DPIA update, so it is
// rendered disabled with an accessible "coming soon" note rather than as a dead
// or cross-origin form.
export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-navy-900 text-ivory-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-1">
          <p className="font-display text-heading-4">{siteConfig.name}</p>
          <p className="mt-2 text-body-sm text-navy-200">{t('footer.tagline')}</p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label={t('footer.trustBadges')}>
            <span className="rounded-sm border border-navy-700 px-2 py-1 text-body-sm">GDPR</span>
            <span className="rounded-sm border border-navy-700 px-2 py-1 text-body-sm">WCAG 2.2 AA</span>
            <span className="rounded-sm border border-navy-700 px-2 py-1 text-body-sm">EU hosted</span>
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.id} aria-label={t(column.headingKey)}>
            <p className="mb-3 text-body-md font-semibold text-ivory-100">{t(column.headingKey)}</p>
            <ul className="flex flex-col gap-2">
              {column.items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="text-body-sm text-navy-200 hover:text-ivory-100">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-navy-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-body-sm text-navy-200 md:flex-row md:items-center md:justify-between">
          <p>
            {t('footer.copyright', { year, entity: siteConfig.legalEntity })}
          </p>
          <p>{t('footer.newsletterComingSoon')}</p>
        </div>
      </div>
    </footer>
  );
}
