import { useTranslations } from 'next-intl';
import { siteConfig } from '@/lib/config';

// Embeds a live demo from demo.viavitae.com/<type> in an <iframe>, with an
// accessible title and a text fallback link (WCAG: the iframe must be titled, and
// a non-embedded alternative must exist). CSP frame-src allows the demo origin
// (middleware.ts); the demo side must send a matching frame-ancestors.
export interface DemoEmbedProps {
  /** Demo path segment, e.g. "parish" -> https://demo.viavitae.com/parish. */
  demoType: string;
  /** Accessible title describing the embedded demo. */
  title: string;
  aspectClassName?: string;
}

export function DemoEmbed({ demoType, title, aspectClassName = 'aspect-video' }: DemoEmbedProps) {
  const t = useTranslations('demo');
  const src = `${siteConfig.demoBase}/${demoType}`;
  return (
    <figure className="not-prose">
      <div className={`overflow-hidden rounded-md border border-border bg-surface-sunken ${aspectClassName}`}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      <figcaption className="mt-2 text-body-sm text-text-secondary">
        <a href={src} className="text-text-link underline" target="_blank" rel="noopener noreferrer">
          {t('openFull')}
        </a>
        {' · '}
        {t('fallbackNote')}
      </figcaption>
    </figure>
  );
}
