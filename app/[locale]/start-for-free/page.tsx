import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AssessmentForm } from "@/components/church/assessment-form";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import type { OrganizationType } from "@/lib/constants";
import type { Locale } from "@/lib/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/start-for-free", locale: locale as Locale });
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ org?: string; product?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  // Prefill only when the query value is a valid contract organization type.
  const org = (ORGANIZATION_TYPES as readonly string[]).includes(query.org ?? "")
    ? (query.org as OrganizationType)
    : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <Breadcrumbs
        label={t("nav.breadcrumb")}
        crumbs={[
          { name: t("nav.home"), path: "/" },
          { name: t("startForFree.title"), path: "/start-for-free" },
        ]}
      />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t("startForFree.title")}</h1>
        <p className="mt-3 text-body-lg text-text-secondary">{t("startForFree.lead")}</p>
      </header>
      <div className="rounded-md border border-border bg-surface-raised p-6">
        <AssessmentForm defaultOrganizationType={org} />
      </div>
    </div>
  );
}
