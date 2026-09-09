import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/components/seo/jsonld";
import { ProductHero } from "@/components/church/product-hero";
import { Link } from "@/lib/i18n";
import { CATALOG } from "@/lib/constants";
import type { Locale } from "@/lib/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/", locale: locale as Locale });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <ProductHero
        eyebrow={t("home.eyebrow")}
        title={t("home.title")}
        subtitle={t("home.subtitle")}
      >
        <Link
          href="/start-for-free"
          className="rounded-sm bg-gold-500 px-6 py-3 text-body-md font-medium text-text-on-gold hover:bg-gold-600"
        >
          {t("nav.startFree")}
        </Link>
        <Link
          href="/pricing"
          className="rounded-sm border border-ivory-100 px-6 py-3 text-body-md font-medium text-ivory-100 hover:bg-navy-800"
        >
          {t("nav.pricing")}
        </Link>
      </ProductHero>

      <section aria-labelledby="products-heading" className="mx-auto max-w-7xl px-4 py-16">
        <h2 id="products-heading" className="text-heading-2 text-text-primary">
          {t("home.productsHeading")}
        </h2>
        <p className="mt-2 max-w-2xl text-body-lg text-text-secondary">
          {t("home.productsSubheading")}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((product) => (
            <li key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                className="flex h-full flex-col gap-2 rounded-md border border-border bg-surface-raised p-5 transition-shadow hover:shadow-md motion-reduce:transition-none"
              >
                <span className="text-body-lg font-semibold text-text-primary">
                  {t(product.nameKey)}
                </span>
                <span className="text-body-sm text-text-secondary">{t(product.shortNameKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cta-heading" className="bg-navy-900 text-ivory-100">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-16">
          <h2 id="cta-heading" className="text-heading-2">
            {t("home.ctaHeading")}
          </h2>
          <p className="text-body-lg text-navy-200">{t("home.ctaBody")}</p>
          <Link
            href="/start-for-free"
            className="mt-2 rounded-sm bg-gold-500 px-6 py-3 text-body-md font-medium text-text-on-gold hover:bg-gold-600"
          >
            {t("nav.startFree")}
          </Link>
        </div>
      </section>
    </>
  );
}
