'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { CATALOG } from '@/lib/constants';

// Mega-menu listing every catalogue product. Thumbnails are a launch-gated asset
// (public/images/products); until they exist each tile shows the product name on a
// brand-tinted panel, so no broken images ship and no asset is fabricated.
export interface ProductMenuProps {
  open: boolean;
  onClose: () => void;
  panelId: string;
}

export function ProductMenu({ open, onClose, panelId }: ProductMenuProps) {
  const t = useTranslations();
  if (!open) return null;
  return (
    <div
      id={panelId}
      className="absolute inset-x-0 top-full z-40 border-b border-border bg-surface-raised shadow-lg"
      onMouseLeave={onClose}
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="mb-4 text-body-sm font-semibold uppercase tracking-wide text-text-muted">
          {t('nav.productMenuHeading')}
        </p>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {CATALOG.map((product) => (
            <li key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="flex flex-col gap-2 rounded-md border border-border p-3 transition-colors hover:border-gold-300 hover:bg-gold-50 motion-reduce:transition-none"
              >
                <span
                  aria-hidden="true"
                  className="h-16 w-full rounded-sm bg-navy-800"
                />
                <span className="text-body-sm font-medium text-text-primary">
                  {t(product.shortNameKey)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
