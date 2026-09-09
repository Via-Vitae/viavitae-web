import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { JsonLd } from "@/components/seo/jsonld";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { Locale } from "@/lib/routing";

// Integration cards. Each named processor is subject to a DPA + EEA residency check
// (QODER rule 7); the compliance status is surfaced per card from messages.
const INTEGRATIONS = ["bitrix24", "stripe", "paysera", "matomo", "calcom"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/integrations", locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const itemList = INTEGRATIONS.map((id, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: t(`integrations.${id}.name`),
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16">
      <Breadcrumbs
        label={t("nav.breadcrumb")}
        crumbs={[
          { name: t("nav.home"), path: "/" },
          { name: t("nav.integrations"), path: "/integrations" },
        ]}
      />
      <JsonLd
        data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: itemList }}
      />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t("integrations.title")}</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-text-secondary">{t("integrations.lead")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((id) => (
          <li
            key={id}
            className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-5"
          >
            <span className="text-body-lg font-semibold text-text-primary">
              {t(`integrations.${id}.name`)}
            </span>
            <span className="text-body-md text-text-secondary">
              {t(`integrations.${id}.description`)}
            </span>
            <span className="mt-2 text-body-sm text-text-muted">
              {t(`integrations.${id}.compliance`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
