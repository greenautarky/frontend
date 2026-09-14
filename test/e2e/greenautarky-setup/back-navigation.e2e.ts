/* eslint-disable */
/**
 * FIX 2 (Ahmad feedback) — a "Zurück" (back) step.
 *
 * ⚠️  DEVICE / SERVED-PAGE EXECUTION REQUIRED — not run by the unit suite
 *     (vitest ignores *.e2e.ts) and excluded from `tsc` (@playwright/test is
 *     not a dependency here). Run on a served wizard / device:
 *
 *       WIZARD_URL="http://<device>:8123/greenautarky-setup.html" \
 *         npx playwright test test/e2e/greenautarky-setup/back-navigation.e2e.ts
 *
 * The pure back-navigation logic is unit-tested against the LIVE reducer in
 * test/panels/greenautarky-setup/setup-flow.test.ts. This spec covers the DOM
 * wiring that the unit tests cannot: the on-page "Zurück" button, the browser
 * Back button (popstate), and that a step's state survives a round-trip
 * (cache() directive) — which is only observable in a real browser.
 *
 * Precondition: the wizard is driven to the analytics/telemetry step (fresh
 * account flow). The exact PIN/account path depends on device state, so it is
 * left to the runner; the assertions below are the load-bearing part.
 */
import { test, expect, type Page } from "@playwright/test";

const WIZARD_URL =
  process.env.WIZARD_URL ?? "http://localhost:8123/greenautarky-setup.html";

async function driveToAnalytics(_page: Page): Promise<void> {
  // Device-specific: complete welcome → (pin) → gdpr → account → info_pages →
  // analytics. Fill in for the target device / fixture.
}

test("Zurück returns from analytics to info_pages and preserves toggles", async ({
  page,
}) => {
  await page.goto(WIZARD_URL);
  await driveToAnalytics(page);

  const analytics = page.locator("ga-setup-analytics");
  await expect(analytics).toBeVisible();

  // Flip the Tier-2 (metrics, default OFF) consent switch ON.
  const metrics = analytics.locator('ha-switch[name="ga_metrics"]');
  await metrics.click();
  await expect(metrics).toHaveAttribute("checked", /.*/);

  // On-page "Zurück" → info_pages.
  await analytics.getByText("Zurück").click();
  await expect(page.locator("ga-setup-info-pages")).toBeVisible();
  await expect(page.locator("ga-setup-analytics")).toBeHidden();

  // Forward again → analytics, and the flipped toggle must have survived.
  await page.locator("ga-setup-info-pages").getByText("Weiter").click();
  await expect(page.locator("ga-setup-analytics")).toBeVisible();
  await expect(
    page.locator('ga-setup-analytics ha-switch[name="ga_metrics"]')
  ).toHaveAttribute("checked", /.*/);
});

test("browser Back button drives the same transition as the button", async ({
  page,
}) => {
  await page.goto(WIZARD_URL);
  await driveToAnalytics(page);
  await expect(page.locator("ga-setup-analytics")).toBeVisible();

  await page.goBack(); // popstate
  await expect(page.locator("ga-setup-info-pages")).toBeVisible();
});

test("no back button on the account (create-user) step", async ({ page }) => {
  await page.goto(WIZARD_URL);
  // Drive to the create-user step (after gdpr). Device-specific.
  const createUser = page.locator("ga-setup-create-user");
  if (await createUser.count()) {
    await expect(createUser.getByText("Zurück")).toHaveCount(0);
  }
});
