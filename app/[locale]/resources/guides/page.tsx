import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { getDoc, listSlugs } from "@/components/mdx/content-loader";
import { mdxComponents } from "@/components/mdx/mdx-components";
import type { GuideFrontMatter } from "@/types/content";
import type { Locale } from "@/lib/routing";

// Guides hub. No guides/[slug] detail route exists in the tree, so each guide's MDX
// body is rendered inline inside a collapsible <details> — self-contained, no dead
// links, and keyboard-accessible via the native summary control.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/resources/guides", locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const loc = locale as Locale;

  const slugs = await listSlugs("guides", loc);
  const docs = (
    await Promise.all(slugs.map((slug) => getDoc<GuideFrontMatter>("guides", loc, slug)))
  )
    .filter((doc): doc is { frontMatter: GuideFrontMatter; body: string } =>
      Boolean(doc && !doc.frontMatter.draft),
    )
    .sort((a, b) => a.frontMatter.title.localeCompare(b.frontMatter.title));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t("guides.title")}</h1>
        <p className="mt-2 text-body-lg text-text-secondary">{t("guides.lead")}</p>
      </header>
      {docs.length === 0 ? (
        <p className="rounded-md border border-border bg-surface-sunken p-6 text-body-md text-text-secondary">
          {t("guides.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <details
              key={doc.frontMatter.slug}
              className="rounded-md border border-border bg-surface-raised p-5"
            >
              <summary className="cursor-pointer text-body-lg font-semibold text-text-primary">
                {doc.frontMatter.title}
                <span className="ml-2 text-body-sm font-normal text-text-muted">
                  {doc.frontMatter.topic}
                </span>
              </summary>
              <div className="vv-prose mt-3 flex flex-col gap-3 text-body-md text-text-secondary">
                <MDXRemote source={doc.body} components={mdxComponents} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
