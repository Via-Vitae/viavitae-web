import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { JsonLd, organizationJsonLd } from "@/components/seo/jsonld";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CONTACT_CHANNELS, SUPPORT_SLA } from "@/lib/constants";
import type { Locale } from "@/lib/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/contact-support", locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16">
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumbs
        label={t("nav.breadcrumb")}
        crumbs={[
          { name: t("nav.home"), path: "/" },
          { name: t("contact.title"), path: "/contact-support" },
        ]}
      />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t("contact.title")}</h1>
        <p className="mt-3 text-body-lg text-text-secondary">{t("contact.lead")}</p>
      </header>

      <section aria-labelledby="channels-heading">
        <h2 id="channels-heading" className="text-heading-3 text-text-primary">
          {t("contact.channelsHeading")}
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {CONTACT_CHANNELS.map((channel) => (
            <li key={channel.id} className="flex items-center gap-3 text-body-md">
              <span className="min-w-24 text-text-muted">{t(channel.labelKey)}</span>
              {channel.kind === "email" && (
                <a className="text-text-link underline" href={`mailto:${channel.value}`}>
                  {channel.value}
                </a>
              )}
              {channel.kind === "phone" && (
                <a
                  className="text-text-link underline"
                  href={`tel:${channel.value.replace(/\s/g, "")}`}
                >
                  {channel.value}
                </a>
              )}
              {channel.kind === "url" && (
                <a
                  className="text-text-link underline"
                  href={channel.value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {channel.value}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sla-heading">
        <h2 id="sla-heading" className="text-heading-3 text-text-primary">
          {t("contact.slaHeading")}
        </h2>
        <table className="mt-4 w-full border-collapse text-body-md">
          <caption className="vv-sr-only">{t("contact.slaCaption")}</caption>
          <thead>
            <tr className="bg-surface-raised">
              <th scope="col" className="border-b border-border p-3 text-left">
                {t("contact.slaTier")}
              </th>
              <th scope="col" className="border-b border-border p-3 text-left">
                {t("contact.slaResponse")}
              </th>
              <th scope="col" className="border-b border-border p-3 text-left">
                {t("contact.slaUpdate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {SUPPORT_SLA.map((row) => (
              <tr key={row.tierKey}>
                <th
                  scope="row"
                  className="border-b border-border-divider p-3 text-left font-normal"
                >
                  {t(row.tierKey)}
                </th>
                <td className="border-b border-border-divider p-3">{t(row.responseKey)}</td>
                <td className="border-b border-border-divider p-3">{t(row.updateKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
