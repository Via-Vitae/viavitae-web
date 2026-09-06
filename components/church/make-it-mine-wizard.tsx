'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n';
import { DemoEmbed } from './demo-embed';
import { Button } from '@/components/ui/button';
import { CATALOG } from '@/lib/constants';
import type { ProductId } from '@/types/catalog';

// "Make it mine" wizard: pick a demo to preview, then jump into the assessment funnel
// prefilled with the matching organization type / goal. The prefill travels as query
// parameters to /start-for-free, which is the entry point shared with the demos repo.
const DEMO_TO_ORG: Partial<Record<ProductId, string>> = {
  basilica: 'basilica',
  cathedral: 'cathedral',
  diocese: 'diocese',
  deaneries: 'deanery',
  'parish-church': 'parish_church',
  'funeral-services': 'funeral_services',
  'cemetery-services': 'cemetery_services',
  'online-store': 'online_store',
  marketplace: 'marketplace_vendor',
};

export function MakeItMineWizard() {
  const t = useTranslations('wizard');
  const router = useRouter();
  const [selected, setSelected] = useState<ProductId>('parish-church');
  const product = CATALOG.find((item) => item.id === selected)!;

  const startPrefilled = () => {
    const params = new URLSearchParams();
    const org = DEMO_TO_ORG[selected];
    if (org) params.set('org', org);
    params.set('product', selected);
    router.push(`/start-for-free?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('chooseDemo')}>
        {CATALOG.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={item.id === selected ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={item.id === selected}
            onClick={() => setSelected(item.id)}
          >
            {t(`products.${item.id}`)}
          </Button>
        ))}
      </div>

      <DemoEmbed demoType={product.demoType} title={t('demoTitle', { product: t(`products.${selected}`) })} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-body-md text-text-secondary">{t('prompt')}</p>
        <Button type="button" variant="primary" onClick={startPrefilled}>{t('makeItMine')}</Button>
      </div>
    </div>
  );
}
