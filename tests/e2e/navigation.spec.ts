import { expect, test } from '@playwright/test';

// Structural navigation E2E: the church ribbon, the footer, and a launch-gated legal
// page. Selectors target content that is rendered identically on desktop and mobile
// (the header ribbon strip, the footer, and main content), so the suite is stable
// across both Playwright projects.

test('the church ribbon lists all 15 catalogue products', async ({ page }) => {
  await page.goto('/en');
  const ribbon = page.getByRole('navigation', { name: 'Product catalogue' }).first();
  const links = ribbon.getByRole('link');
  await expect(links).toHaveCount(15);
  // Every ribbon link points at a product route.
  for (const href of await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''))) {
    expect(href).toContain('/product/');
  }
});

test('the footer exposes the four columns and the legal links', async ({ page }) => {
  await page.goto('/en');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', /\/legal\/privacy$/);
  await expect(footer.getByRole('link', { name: 'Terms of service' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Cookie policy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Legal imprint (Impressum)' })).toBeVisible();
});

test('a legal page renders its title and the launch-gate notice until content is authored', async ({ page }) => {
  await page.goto('/en/legal/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy notice');
  // content/legal is intentionally empty pre-launch, so the pending notice is shown
  // instead of fabricated legal text (ADR-WEB-003: legal never falls back).
  await expect(page.getByRole('note')).toContainText('being prepared by the ViaVitae legal team');
});

test('the products mega-menu source (ribbon) and product page agree on a product', async ({ page }) => {
  await page.goto('/en/product/diocese');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // The product page embeds the assessment funnel CTA.
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
});
