import { expect, test } from "@playwright/test";

// Assessment funnel E2E. The server proxy (/api/assessment) forwards to viavitae-api,
// which is not part of this repo's test runtime, so the proxy is mocked to make the
// funnel deterministic. This still exercises the real client validation, the four
// steps, and the DPIA-001 consent gate end-to-end in the browser.
const ACCEPTED = {
  assessment_id: "11111111-2222-4333-8444-555555555555",
  status: "accepted",
  next_steps: { confirmation_email_sent: true, booking_url: null },
};

test.describe("assessment funnel", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/assessment", (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify(ACCEPTED),
      }),
    );
    await page.goto("/en/start-for-free");
    const rejectAll = page.getByRole("button", { name: "Reject all" });
    if (await rejectAll.isVisible().catch(() => false)) await rejectAll.click();
  });

  test("walks all four steps and shows the success state on submit", async ({ page }) => {
    // organisation -> site -> goals -> contact
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.getByLabel("Contact email").fill("secretary@parish.lt");
    await page
      .getByRole("checkbox", { name: /I agree to the processing of my contact details/ })
      .check();
    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(page.getByRole("status")).toContainText("Thank you");
  });

  test("blocks submit without explicit privacy consent (DPIA-001 R7)", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.getByLabel("Contact email").fill("secretary@parish.lt");
    // Consent deliberately left unchecked.
    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(page.getByText("Please confirm the privacy consent")).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("rejects an invalid email with a field-level error", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.getByLabel("Contact email").fill("not-an-email");
    await page
      .getByRole("checkbox", { name: /I agree to the processing of my contact details/ })
      .check();
    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});
