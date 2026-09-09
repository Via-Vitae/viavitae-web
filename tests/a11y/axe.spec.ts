import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Accessibility gate (WCAG 2.2 AA is a launch gate — QODER rule 7). Tagged @a11y so
// CI can run it alone (`pnpm test:a11y`). Scans the key rendered pages and fails on
// critical/serious violations; moderate/minor are reported for triage. The full AA
// pass over real content is a launch gate (see docs/DPIA-template.md, README).
const KEY_PAGES = [
  "/en",
  "/en/pricing",
  "/en/product/parish-church",
  "/en/start-for-free",
  "/en/contact-support",
  "/en/resources/blog",
  "/en/legal/privacy",
];

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const path of KEY_PAGES) {
  test(`@a11y ${path} has no critical or serious WCAG AA violations`, async ({ page }) => {
    await page.goto(path);

    // Dismiss the cookie banner so it does not overlay the scanned content.
    const rejectAll = page.getByRole("button", { name: "Reject all" });
    if (await rejectAll.isVisible().catch(() => false)) await rejectAll.click();

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      blocking,
      JSON.stringify(
        blocking.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}
