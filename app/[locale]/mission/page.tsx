import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/lib/i18n";
import type { Locale } from "@/lib/routing";

const PATH = "/mission";
const NS = "mission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: PATH, locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const body = t.raw(`${NS}.body`) as string[];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <Breadcrumbs
        label={t("nav.breadcrumb")}
        crumbs={[
          { name: t("nav.home"), path: "/" },
          { name: t(`${NS}.title`), path: PATH },
        ]}
      />
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t(`${NS}.title`)}</h1>
        <p className="mt-3 text-body-lg text-text-secondary">{t(`${NS}.lead`)}</p>
      </header>
      <div className="flex flex-col gap-4">
        {body.map((paragraph, index) => (
          <p key={index} className="text-body-md text-text-secondary">
            {paragraph}
          </p>
        ))}
      </div>
      <div>
        <Link
          href="/start-for-free"
          className="inline-block rounded-sm bg-gold-500 px-6 py-3 text-body-md font-medium text-text-on-gold hover:bg-gold-600"
        >
          {t("nav.startFree")}
        </Link>
      </div>
    </div>
  );
}
