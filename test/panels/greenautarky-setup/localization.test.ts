import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { messages as de } from "../../../src/panels/greenautarky-setup/translations/de";
import {
  messages as en,
  EN_LEGAL_REVIEW_PENDING,
} from "../../../src/panels/greenautarky-setup/translations/en";
import { buildGaLocalize } from "../../../src/panels/greenautarky-setup/ga-localize";

/**
 * FIX 1 (Ahmad feedback) — real DE/EN localisation of the setup wizard.
 *
 * The wizard was hard-coded German: all 7 step components had 0 localize()
 * calls and every visible string was a German literal, so the language picker
 * changed nothing visible. These tests read the LIVE step sources and the LIVE
 * bundled translation tables — never a copy.
 */

const PANEL_DIR = path.resolve(
  __dirname,
  "../../../src/panels/greenautarky-setup"
);

// The 7 step components the task requires to be localised.
const STEP_FILES = [
  "ga-setup-welcome.ts",
  "ga-setup-pin.ts",
  "ga-setup-gdpr.ts",
  "ga-setup-create-user.ts",
  "ga-setup-info-pages.ts",
  "ga-setup-analytics.ts",
  "ga-setup-ethernet.ts",
];

// Strip comments so German in explanatory comments is not mistaken for a
// user-facing literal. The line-comment rule keeps `https://` intact.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const readStep = (f: string) =>
  fs.readFileSync(path.join(PANEL_DIR, f), "utf-8");

describe("FIX 1 — translation tables have DE/EN key parity", () => {
  it("de.ts and en.ts define the same keys (and are non-empty)", () => {
    const deKeys = Object.keys(de).sort();
    const enKeys = Object.keys(en).sort();
    expect(deKeys.length, "de.ts has no keys").toBeGreaterThan(0);
    // Report the asymmetric differences explicitly if they diverge.
    const missingInEn = deKeys.filter((k) => !(k in en));
    const missingInDe = enKeys.filter((k) => !(k in de));
    expect(missingInEn, `keys missing in en.ts: ${missingInEn}`).toEqual([]);
    expect(missingInDe, `keys missing in de.ts: ${missingInDe}`).toEqual([]);
  });

  it("no translation value is empty in either language", () => {
    for (const [k, v] of Object.entries(de)) {
      expect(v.trim().length, `de value empty: ${k}`).toBeGreaterThan(0);
    }
    for (const [k, v] of Object.entries(en)) {
      expect(v.trim().length, `en value empty: ${k}`).toBeGreaterThan(0);
    }
  });
});

describe("FIX 1 — legal strings are NOT silently machine-translated", () => {
  it("every EN legal-review-pending key is still the German original", () => {
    expect(
      EN_LEGAL_REVIEW_PENDING.length,
      "the legal-review-pending list is empty"
    ).toBeGreaterThan(0);
    for (const key of EN_LEGAL_REVIEW_PENDING) {
      expect(key in de, `pending key not in de.ts: ${key}`).toBe(true);
      expect(key in en, `pending key not in en.ts: ${key}`).toBe(true);
      // Still German (verbatim) until a lawyer signs off an English version.
      expect(en[key], `legal key silently translated: ${key}`).toBe(de[key]);
    }
  });
});

describe("FIX 1 — every step is localised (regression guard)", () => {
  it("each step component calls this.localize()", () => {
    // RED before the fix: all 7 had 0 localize() calls.
    for (const f of STEP_FILES) {
      const src = readStep(f);
      expect(
        (src.match(/this\.localize\(/g) || []).length,
        `${f} has no this.localize() calls`
      ).toBeGreaterThan(0);
    }
  });

  it("no step template still contains a German literal", () => {
    // Diacritics catch most; the word list catches the diacritic-free German
    // that is present today (e.g. welcome's "Meinen KI-Butler einrichten").
    const banned =
      /[äöüÄÖÜß]|\b(Weiter|Fertig|Zurück|Willkommen|Meinen|einrichten|erstellen|eingeben|verwenden|Benutzerkonto)\b/;
    for (const f of STEP_FILES) {
      const src = stripComments(readStep(f));
      const m = src.match(banned);
      expect(m, `${f} still contains a German literal: ${m?.[0]}`).toBeNull();
    }
  });
});

describe("FIX 1 — localize keys resolve against the tables (coverage guard)", () => {
  // Extract every this.localize("literal-key" ...) key from the LIVE steps.
  // Capture every full "ui.panel.greenautarky_setup.<...>" key literal used in
  // the steps — whether passed directly to this.localize(...) or held in a
  // key map/array the component resolves. (No template-literal keys exist, so
  // there are no ${...} partials to trip over.)
  const usedKeys = new Set<string>();
  for (const f of STEP_FILES) {
    const src = readStep(f);
    for (const m of src.matchAll(
      /["'`](ui\.panel\.greenautarky_setup\.[A-Za-z0-9_.]+)["'`]/g
    )) {
      usedKeys.add(m[1]);
    }
  }

  it("extraction finds localize keys (fail closed on zero)", () => {
    // If the steps declare no keys, the extraction or the wiring broke — FAIL,
    // do not pass vacuously.
    expect(usedKeys.size, "no this.localize(<literal>) keys extracted").toBeGreaterThan(
      0
    );
  });

  it("every key used in a step exists in BOTH de.ts and en.ts", () => {
    const missing = [...usedKeys].filter((k) => !(k in de) || !(k in en));
    expect(missing, `keys used in steps but missing from tables: ${missing}`).toEqual(
      []
    );
  });
});

describe("FIX 1 — language switch produces different rendered strings", () => {
  it("welcome header is German for de and English for en", async () => {
    const el = document.createElement("div");
    const localizeDe = await buildGaLocalize(el, "de");
    const localizeEn = await buildGaLocalize(el, "en");
    const key = "ui.panel.greenautarky_setup.welcome.header";
    expect(localizeDe(key)).toBe("Willkommen bei Ihrem KI-Butler");
    expect(localizeEn(key)).toBe("Welcome to your KI-Butler");
    expect(localizeDe(key)).not.toBe(localizeEn(key));
  });

  it("an unknown language falls back to German (the wizard default)", async () => {
    const el = document.createElement("div");
    const localize = await buildGaLocalize(el, "fr");
    expect(localize("ui.panel.greenautarky_setup.common.next")).toBe("Weiter");
  });
});
