import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { JsonLd, productJsonLd, faqJsonLd } from "@/components/seo/jsonld";
import type { FaqItem } from "@/components/seo/jsonld";
import { ProductHero } from "@/components/church/product-hero";
import { TierTable } from "@/components/church/tier-table";
import { DemoEmbed } from "@/components/church/demo-embed";
import { AssessmentForm } from "@/components/church/assessment-form";
import { Accordion } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CATALOG_BY_ID } from "@/lib/constants";
import type { Locale } from "@/lib/routing";
import type { ProductId } from "@/types/catalog";

const PRODUCT_ID: ProductId = "parish-church";
const CANONICAL_PATH = `/product/${PRODUCT_ID}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: CANONICAL_PATH, locale: locale as Locale });
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const product = CATALOG_BY_ID[PRODUCT_ID];
  if (!product) notFound();

  const t = await getTranslations({ locale });
  const name = t(product.nameKey);
  const subtitle = t("product.heroSubtitle", { product: name });
  const features = t.raw("product.features") as string[];
  const faq = (
    t.has(`product.faq.${PRODUCT_ID}`) ? (t.raw(`product.faq.${PRODUCT_ID}`) as FaqItem[]) : []
  ) satisfies FaqItem[];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            product,
            name,
            description: subtitle,
            tierName: (id) => t("tiers." + id + ".name"),
          }),
          ...(faq.length ? [faqJsonLd(faq)] : []),
        ]}
      />
      <ProductHero eyebrow={t("product.eyebrow")} title={name} subtitle={subtitle} />
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
        <Breadcrumbs
          label={t("nav.breadcrumb")}
          crumbs={[
            { name: t("nav.home"), path: "/" },
            { name: t("nav.products"), path: "/product/parish-church" },
            { name, path: CANONICAL_PATH },
          ]}
        />

        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-heading-2 text-text-primary">
            {t("product.featuresHeading")}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-body-md text-text-secondary">
                <span aria-hidden="true" className="text-state-success">
                  &#10003;
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-heading-2 text-text-primary">
            {t("product.demoHeading")}
          </h2>
          <div className="mt-4">
            <DemoEmbed
              demoType={product.demoType}
              title={t("product.demoTitle", { product: name })}
            />
          </div>
        </section>

        <section aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="text-heading-2 text-text-primary">
            {t("product.pricingHeading")}
          </h2>
          <div className="mt-4">
            <TierTable />
          </div>
        </section>

        {faq.length > 0 && (
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-heading-2 text-text-primary">
              {t("product.faqHeading")}
            </h2>
            <div className="mt-4">
              <Accordion items={faq} labelledBy="faq-heading" />
            </div>
          </section>
        )}

        <section
          aria-labelledby="cta-heading"
          className="rounded-md border border-border bg-surface-raised p-6"
        >
          <h2 id="cta-heading" className="text-heading-3 text-text-primary">
            {t("product.ctaHeading")}
          </h2>
          <p className="mt-1 text-body-md text-text-secondary">{t("product.ctaBody")}</p>
          <div className="mt-6">
            <AssessmentForm defaultOrganizationType={undefined} />
          </div>
        </section>
      </div>
    </>
  );
}
