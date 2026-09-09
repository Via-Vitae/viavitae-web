import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n";
import { CHURCH_RIBBON } from "@/lib/navigation";

// Product-section layout: an in-section ChurchNav ribbon above every product page.
// The global header ribbon (components/layout/header/church-ribbon.tsx) is site-wide;
// this one keeps product navigation in reach while browsing the catalogue.
export default async function ProductLayout({
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
    <div className="flex flex-col">
      <nav
        aria-label={t("nav.productSectionLabel")}
        className="border-b border-border-divider bg-surface-sunken"
      >
        <ul className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-2">
          {CHURCH_RIBBON.map((item) => (
            <li key={item.id} className="shrink-0">
              <Link
                href={item.href}
                className="whitespace-nowrap text-body-sm text-text-secondary hover:text-text-brand"
              >
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
