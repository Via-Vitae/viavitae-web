import { Link } from "@/lib/i18n";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/jsonld";
import type { Crumb } from "@/components/seo/jsonld";

// Breadcrumb trail + matching BreadcrumbList JSON-LD. The last crumb is the
// current page (aria-current="page", not a link). `crumbs` paths are canonical and
// locale-less; <Link> adds the locale prefix.

export interface BreadcrumbsProps {
  /** Ordered trail from root to the current page; the last entry is current. */
  crumbs: readonly Crumb[];
  /** Accessible label for the nav landmark (translated by the caller). */
  label: string;
}

export function Breadcrumbs({ crumbs, label }: BreadcrumbsProps) {
  if (crumbs.length === 0) return null;
  return (
    <>
      <nav aria-label={label} className="text-body-sm text-text-secondary">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1">
                {isLast ? (
                  <span aria-current="page" className="text-text-primary">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className="text-text-link hover:underline">
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
