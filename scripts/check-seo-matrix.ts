import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../lib/constants";
import { CHURCH_RIBBON, FOOTER_COLUMNS, GLOBAL_NAV, NAV_CTAS } from "../lib/navigation";

// CI gate (pnpm check:seo): docs/seo/meta-matrix.json is the single source of truth
// for page metadata (components/seo/metadata-builder.ts) and the sitemap. This
// enforces: (1) no duplicate paths, (2) every catalogue product has a /product/<slug>
// entry, (3) every navigation href has an entry, (4) every titleKey/descriptionKey
// resolves in messages/en.json, (5) the homepage is present. Importing CATALOG and
// the nav structures means the matrix cannot silently drift from the real routes.

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

interface PageEntry {
  path: string;
  titleKey: string;
  descriptionKey: string;
  index: boolean;
}

const matrix = JSON.parse(readFileSync(join(root, "docs/seo/meta-matrix.json"), "utf8")) as {
  pages: PageEntry[];
};
const en = JSON.parse(readFileSync(join(root, "messages/en.json"), "utf8")) as Record<
  string,
  unknown
>;

function hasKey(obj: unknown, dotted: string): boolean {
  let current: unknown = obj;
  for (const segment of dotted.split(".")) {
    if (current === null || typeof current !== "object") return false;
    current = (current as Record<string, unknown>)[segment];
    if (current === undefined) return false;
  }
  return true;
}

const problems: string[] = [];
const paths = new Set<string>();

for (const page of matrix.pages) {
  if (paths.has(page.path)) problems.push(`duplicate matrix path: ${page.path}`);
  paths.add(page.path);
}

for (const product of CATALOG) {
  const productPath = `/product/${product.slug}`;
  if (!paths.has(productPath))
    problems.push(`missing matrix entry for catalogue product: ${productPath}`);
}

const navHrefs = new Set<string>();
for (const item of GLOBAL_NAV) navHrefs.add(item.href);
navHrefs.add(NAV_CTAS.startFree.href);
navHrefs.add(NAV_CTAS.login.href);
for (const item of CHURCH_RIBBON) navHrefs.add(item.href);
for (const column of FOOTER_COLUMNS) for (const item of column.items) navHrefs.add(item.href);
for (const href of navHrefs) {
  if (!paths.has(href)) problems.push(`navigation href without a matrix entry: ${href}`);
}

for (const page of matrix.pages) {
  if (!hasKey(en, page.titleKey))
    problems.push(`${page.path}: titleKey "${page.titleKey}" missing in messages/en.json`);
  if (!hasKey(en, page.descriptionKey)) {
    problems.push(
      `${page.path}: descriptionKey "${page.descriptionKey}" missing in messages/en.json`,
    );
  }
}

if (!paths.has("/")) problems.push('matrix is missing the homepage "/"');

if (problems.length) {
  console.error(`SEO matrix check FAILED (${problems.length} problem(s)):`);
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}
console.log(
  `SEO matrix OK: ${matrix.pages.length} entries, ${navHrefs.size} nav hrefs covered, all title/description keys resolve.`,
);
