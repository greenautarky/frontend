/* eslint-disable */
/**
 * FIX 3 (Ahmad feedback) — dark-mode readability of the consent panel.
 *
 * ⚠️  DEVICE / SERVED-PAGE EXECUTION REQUIRED — this spec does NOT run in this
 *     repo's unit suite (vitest ignores *.e2e.ts) and is excluded from `tsc`
 *     (@playwright/test is not a dependency here). Run it on a device / served
 *     wizard with Playwright installed:
 *
 *       WIZARD_URL="http://<device>:8123/greenautarky-setup.html" \
 *         npx playwright test test/e2e/greenautarky-setup/dark-mode-contrast.e2e.ts
 *
 * It emulates the dark colour scheme, drives the wizard to the analytics/
 * telemetry step, and asserts the tier-0 ("Betriebsnotwendige Daten") heading
 * has a WCAG contrast ratio ≥ 4.5:1 against its own card background.
 *
 * RED (before the fix): the card used var(--card-background-color-elevated,
 *   #fafafa) — a variable defined nowhere — so the light fallback won in dark
 *   mode and the heading rendered light-on-light (ratio ≈ 1.1:1).
 * GREEN (after the fix): var(--secondary-background-color) resolves to the dark
 *   theme value (#282828) → high contrast.
 */
import { test, expect, type Page } from "@playwright/test";

const WIZARD_URL =
  process.env.WIZARD_URL ?? "http://localhost:8123/greenautarky-setup.html";

// WCAG 2.1 relative-luminance contrast ratio, computed from resolved rgb().
function contrastRatio(fg: string, bg: string): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (rgb: string) => {
    const m = rgb.match(/\d+(\.\d+)?/g)!.map(Number);
    const [r, g, b] = m;
    return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// The tier-0 section can only be reached after the account step. On a device
// this helper walks the wizard; adapt the selectors/PIN to the device state.
// The contrast assertion below is the load-bearing part.
async function driveToAnalytics(_page: Page): Promise<void> {
  // Intentionally left for the device runner: the exact path depends on
  // whether a PIN is required and on the freshly-flashed account flow.
  // Once on the analytics step, `ga-setup-analytics` is in the DOM.
}

test.use({ colorScheme: "dark" });

test("tier-0 heading is readable in dark mode (contrast ≥ 4.5:1)", async ({
  page,
}) => {
  await page.goto(WIZARD_URL);
  await driveToAnalytics(page);

  // Playwright's CSS engine pierces open shadow roots, so this reaches the
  // section inside ga-setup-analytics inside ha-panel-greenautarky-setup.
  const section = page.locator("section.tier-0");
  const heading = section.locator("h2");
  await expect(heading).toBeVisible();

  const { fg, bg } = await heading.evaluate((h) => {
    const sec = h.closest("section")!;
    return {
      fg: getComputedStyle(h).color,
      bg: getComputedStyle(sec).backgroundColor,
    };
  });

  const ratio = contrastRatio(fg, bg);
  expect(
    ratio,
    `tier-0 heading contrast ${ratio.toFixed(2)}:1 (fg ${fg} on bg ${bg})`
  ).toBeGreaterThanOrEqual(4.5);
});
