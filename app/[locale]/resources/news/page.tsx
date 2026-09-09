import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/components/seo/metadata-builder";
import { getDoc, listSlugs } from "@/components/mdx/content-loader";
import type { NewsFrontMatter } from "@/types/content";
import type { Locale } from "@/lib/routing";

// News hub. The tree defines no news/[slug] detail route, so items are rendered
// inline (title, date, description) and link OUT to the original source when the
// front-matter provides one — never to a non-existent internal detail page.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ path: "/resources/news", locale: locale as Locale });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const loc = locale as Locale;

  const slugs = await listSlugs("news", loc);
  const docs = (await Promise.all(slugs.map((slug) => getDoc<NewsFrontMatter>("news", loc, slug))))
    .filter((doc): doc is { frontMatter: NewsFrontMatter; body: string } =>
      Boolean(doc && !doc.frontMatter.draft),
    )
    .sort((a, b) => b.frontMatter.publishedAt.localeCompare(a.frontMatter.publishedAt));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-fluid-display-md text-text-primary">{t("news.title")}</h1>
        <p className="mt-2 text-body-lg text-text-secondary">{t("news.lead")}</p>
      </header>
      {docs.length === 0 ? (
        <p className="rounded-md border border-border bg-surface-sunken p-6 text-body-md text-text-secondary">
          {t("news.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {docs.map((doc) => (
            <li
              key={doc.frontMatter.slug}
              className="flex flex-col gap-1 rounded-md border border-border bg-surface-raised p-5"
            >
              <span className="text-body-sm text-text-muted">
                <time dateTime={doc.frontMatter.publishedAt}>{doc.frontMatter.publishedAt}</time>
              </span>
              <span className="text-body-lg font-semibold text-text-primary">
                {doc.frontMatter.title}
              </span>
              <span className="text-body-md text-text-secondary">
                {doc.frontMatter.description}
              </span>
              {doc.frontMatter.source && (
                <a
                  href={doc.frontMatter.source}
                  className="mt-1 text-body-sm text-text-link underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("news.readSource")}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
