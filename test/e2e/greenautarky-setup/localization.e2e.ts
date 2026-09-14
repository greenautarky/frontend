/* eslint-disable */
/**
 * FIX 1 (Ahmad feedback) — real DE/EN localisation.
 *
 * ⚠️  DEVICE / SERVED-PAGE EXECUTION REQUIRED — not run by the unit suite
 *     (vitest ignores *.e2e.ts) and excluded from `tsc` (@playwright/test is
 *     not a dependency here). Run on a served wizard / device:
 *
 *       WIZARD_URL="http://<device>:8123/greenautarky-setup.html" \
 *         npx playwright test test/e2e/greenautarky-setup/localization.e2e.ts
 *
 * The key parity, resolution and "language changes the string" logic is
 * unit-tested against the LIVE tables in
 * test/panels/greenautarky-setup/localization.test.ts. This spec covers the one
 * thing only a browser shows: switching the on-page language picker actually
 * re-renders the visible German → English (previously the picker changed
 * this.language + reloaded HA-core translations that no step read, so nothing
 * visible changed).
 */
import { test, expect } from "@playwright/test";

const WIZARD_URL =
  process.env.WIZARD_URL ?? "http://localhost:8123/greenautarky-setup.html";

test("switching the picker to English re-renders the welcome CTA", async ({
  page,
}) => {
  await page.goto(WIZARD_URL);

  const cta = page.locator("ga-setup-welcome ha-button.start");
  // Default is German.
  await expect(cta).toContainText("Meinen KI-Butler einrichten");

  // Switch the footer language picker to English.
  const picker = page.locator("ha-language-picker");
  await expect(picker).toBeVisible();
  await picker.click();
  await page.getByRole("option", { name: /english/i }).click();

  // The visible CTA must now be English — the regression this fix targets.
  await expect(cta).toContainText("Set up my KI-Butler");
  await expect(cta).not.toContainText("Meinen KI-Butler einrichten");
});

test("the language picker only offers German and English", async ({ page }) => {
  await page.goto(WIZARD_URL);
  await page.locator("ha-language-picker").click();
  const options = page.getByRole("option");
  await expect(options).toHaveCount(2);
});
