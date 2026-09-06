'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { GLOBAL_NAV, NAV_CTAS } from '@/lib/navigation';
import { siteConfig } from '@/lib/config';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ProductMenu } from './product-menu';
import { MobileNav } from './mobile-nav';

// Desktop + mobile global navigation row. Owns the open state for the product
// mega-menu and the mobile drawer, closes on ESC and on outside click.
export function GlobalNav() {
  const t = useTranslations();
  const uid = useId();
  const productPanelId = `${uid}-product-menu`;
  const mobileLabelId = `${uid}-mobile-nav`;
  const productButtonId = `${uid}-product-button`;
  const [productOpen, setProductOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProductOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const menu = document.getElementById(productPanelId);
      const button = document.getElementById(productButtonId);
      if (menu && !menu.contains(target) && button && !button.contains(target)) {
        setProductOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [productPanelId, productButtonId]);

  return (
    <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
      <Link href="/" className="font-display text-heading-4 text-text-primary" aria-label={siteConfig.name}>
        {siteConfig.name}
      </Link>

      <nav aria-label={t('nav.globalLabel')} className="ml-4 hidden items-center gap-1 md:flex">
        <button
          id={productButtonId}
          type="button"
          aria-expanded={productOpen}
          aria-controls={productPanelId}
          onClick={() => setProductOpen((open) => !open)}
          className="rounded-sm px-3 py-2 text-body-md font-medium text-text-primary hover:bg-surface-sunken"
        >
          {t('nav.product')}
        </button>
        {GLOBAL_NAV.filter((item) => item.id !== 'product').map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-sm px-3 py-2 text-body-md font-medium text-text-primary hover:bg-surface-sunken"
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-3 md:flex">
        <LanguageSwitcher />
        <Link href={NAV_CTAS.login.href} className="text-body-md font-medium text-text-primary hover:underline">
          {t(NAV_CTAS.login.labelKey)}
        </Link>
        <Link
          href={NAV_CTAS.startFree.href}
          className="rounded-sm bg-gold-500 px-4 py-2 text-body-md font-medium text-text-on-gold hover:bg-gold-600"
        >
          {t(NAV_CTAS.startFree.labelKey)}
        </Link>
      </div>

      <button
        type="button"
        className="ml-auto rounded-sm p-2 text-text-primary md:hidden"
        aria-expanded={mobileOpen}
        aria-controls={mobileLabelId}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="vv-sr-only">{t('nav.menu')}</span>
        <span aria-hidden="true" className="block h-0.5 w-6 bg-current" />
        <span aria-hidden="true" className="mt-1 block h-0.5 w-6 bg-current" />
        <span aria-hidden="true" className="mt-1 block h-0.5 w-6 bg-current" />
      </button>

      <ProductMenu open={productOpen} onClose={() => setProductOpen(false)} panelId={productPanelId} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} labelledBy={mobileLabelId} />
    </div>
  );
}
