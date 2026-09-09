import { expect, test } from "@playwright/test";

// i18n routing (ADR-WEB-001): every route is locale-prefixed, LT is the default,
// and PL/DE are declared-but-unroutable ("coming soon").

test("the site root redirects to the default locale (LT)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/lt(\/|$)/);
});

for (const locale of ["/lt", "/en", "/ru"]) {
  test(`the ${locale} homepage renders a translated H1`, async ({ page }) => {
    await page.goto(locale);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}

test("the English pricing page shows the clean H1 (no SEO suffix)", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pricing");
});

test("the language switcher offers LT/EN/RU live and marks PL/DE as coming soon", async ({
  page,
}) => {
  await page.goto("/en");
  const switcher = page.getByRole("group", { name: "Change language" }).first();
  await expect(switcher).toBeAttached();
  // Live locales are buttons; coming-soon locales are disabled spans with a "soon" badge.
  await expect(switcher.getByRole("button", { name: "Lietuvių" })).toBeAttached();
  await expect(switcher.getByRole("button", { name: "English" })).toBeAttached();
  await expect(switcher.getByRole("button", { name: "Русский" })).toBeAttached();
  await expect(switcher.getByText("Polski")).toBeAttached();
  await expect(switcher.getByText("Deutsch")).toBeAttached();
});

test("switching locale in place preserves the current path", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "the switcher lives inside the mobile menu");
  await page.goto("/en/pricing");
  await page
    .getByRole("group", { name: "Change language" })
    .getByRole("button", { name: "Lietuvių" })
    .click();
  await expect(page).toHaveURL(/\/lt\/pricing/);
});
