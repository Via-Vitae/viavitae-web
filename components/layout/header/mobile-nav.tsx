'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { GLOBAL_NAV, NAV_CTAS, CHURCH_RIBBON } from '@/lib/navigation';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Hamburger drawer with a focus trap, ESC-to-close and focus restoration.
// Locale-aware: all links go through the next-intl <Link>.
export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
}

export function MobileNav({ open, onClose, labelledBy }: MobileNavProps) {
  const t = useTranslations();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const activeEl = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (activeEl === first || activeEl === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      returnFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-surface-overlay/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-surface-raised p-4 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <span id={labelledBy} className="text-body-md font-semibold text-text-primary">
            {t('nav.menu')}
          </span>
          <button type="button" onClick={onClose} aria-label={t('nav.closeMenu')} className="p-2 text-text-secondary">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav aria-label={t('nav.globalLabel')}>
          <ul className="flex flex-col gap-1">
            {GLOBAL_NAV.map((item) => (
              <li key={item.id}>
                <Link href={item.href} onClick={onClose} className="block rounded-sm px-2 py-2 text-body-md text-text-primary hover:bg-surface-sunken">
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('nav.ribbonLabel')}>
          <p className="mb-1 px-2 text-body-sm font-semibold uppercase tracking-wide text-text-muted">{t('nav.products')}</p>
          <ul className="flex flex-col gap-1">
            {CHURCH_RIBBON.map((item) => (
              <li key={item.id}>
                <Link href={item.href} onClick={onClose} className="block rounded-sm px-2 py-1.5 text-body-sm text-text-secondary hover:bg-surface-sunken">
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-border-divider pt-4">
          <Link href={NAV_CTAS.startFree.href} onClick={onClose} className="rounded-sm bg-gold-500 px-4 py-2 text-center text-body-md font-medium text-text-on-gold">
            {t(NAV_CTAS.startFree.labelKey)}
          </Link>
          <Link href={NAV_CTAS.login.href} onClick={onClose} className="rounded-sm border border-border px-4 py-2 text-center text-body-md font-medium text-text-primary">
            {t(NAV_CTAS.login.labelKey)}
          </Link>
          <LanguageSwitcher className="justify-center pt-2" />
        </div>
      </div>
    </div>
  );
}
