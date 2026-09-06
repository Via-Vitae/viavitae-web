import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n';
import { CHURCH_RIBBON } from '@/lib/navigation';

// Apple-store-style horizontal strip of every catalogue product. Rendered from
// CHURCH_RIBBON (lib/navigation.ts) so it can never drift from the mega-menu,
// sitemap or SEO matrix. Server component: the links are in the initial HTML for
// crawlers, and the strip scrolls horizontally on small screens.
export async function ChurchRibbon() {
  const t = await getTranslations();
  return (
    <nav aria-label={t('nav.ribbonLabel')} className="border-b border-border-divider bg-surface-raised">
      <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 [scrollbar-width:thin]">
        {CHURCH_RIBBON.map((item) => (
          <li key={item.id} className="shrink-0">
            <Link
              href={item.href}
              className="whitespace-nowrap text-body-sm text-text-secondary transition-colors hover:text-text-brand motion-reduce:transition-none"
            >
              {t(item.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
