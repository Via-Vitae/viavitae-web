import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Build-time OG image generator. Produces a 1200x630 SVG master per locale from the
// localised home title + footer tagline, using the real brand tokens (navy-900
// #0e1b3d, gold-500 #c9a227, navy-200 #c9d1e6, ivory-50 #fefdfc). No binary is
// fabricated (QODER rule 4 / F-fix): SVG is text and is generated from real content.
//
// LAUNCH GATE: components/seo/metadata-builder.ts references /og/<locale>.png.
// Social crawlers require PNG/JPEG, so before go-live these SVG masters must be
// rasterised to 1200x630 PNG (e.g. @resvg/resvg-js or sharp — add as a devDependency)
// and committed/exported to public/og/. This script is not wired into `prebuild`;
// run it manually: node scripts/generate-og.mjs

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const LOCALES = ["lt", "en", "ru"];
const outDir = join(root, "public", "og");
mkdirSync(outDir, { recursive: true });

const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

for (const locale of LOCALES) {
  const messages = JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
  const title = messages?.home?.title ?? "ViaVitae";
  const tagline = messages?.footer?.tagline ?? "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(title)}">
  <rect width="1200" height="630" fill="#0e1b3d"/>
  <rect width="1200" height="10" fill="#c9a227"/>
  <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#fefdfc">ViaVitae</text>
  <text x="80" y="340" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#fefdfc">${esc(title)}</text>
  <text x="80" y="430" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#c9d1e6">${esc(tagline)}</text>
</svg>
`;
  writeFileSync(join(outDir, `${locale}.svg`), svg);
  console.log(`wrote public/og/${locale}.svg`);
}

console.log("\nOG masters generated. Rasterise to public/og/<locale>.png (1200x630) before launch");
console.log("(metadata-builder.ts references the .png); see the LAUNCH GATE note in this script.");
