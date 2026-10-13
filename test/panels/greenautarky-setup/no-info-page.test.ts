import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { messages as de } from "../../../src/panels/greenautarky-setup/translations/de";
import { messages as en } from "../../../src/panels/greenautarky-setup/translations/en";
import {
  STEP_ORDER,
  STEPS_WITH_BACK,
  advance,
  progressFor,
} from "../../../src/panels/greenautarky-setup/setup-flow";

// Decision 2026-10-13: the info page "Ihr KI-Butler" ("Über Ihren
// GreenAutarky KI-Butler", Erste Schritte, Hilfe benötigt) is removed. The
// wizard goes from account creation straight to the telemetry step. Every
// assertion reads the LIVE source, not a restated copy.
const ROOT = path.resolve(__dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf-8");

describe("info page (Ihr KI-Butler) is removed", () => {
  it("is not a step in the flow", () => {
    expect(STEP_ORDER).not.toContain("info_pages" as never);
    expect(STEPS_WITH_BACK).not.toContain("info_pages" as never);
    expect(STEP_ORDER).toEqual([
      "welcome",
      "pin",
      "gdpr",
      "user",
      "analytics",
      "ethernet",
    ]);
  });

  it("account creation leads straight to analytics (telemetry)", () => {
    const i = STEP_ORDER.indexOf("user");
    expect(STEP_ORDER[i + 1]).toBe("analytics");
    expect(
      advance({ current: "user", history: ["welcome", "gdpr"] }, "analytics")
    ).toEqual({ current: "analytics", history: [] });
  });

  it("progress is spread over the remaining 6 steps", () => {
    expect(progressFor("user")).toBeCloseTo(4 / 6);
    expect(progressFor("ethernet")).toBeCloseTo(1);
  });

  it("the component and the page content are gone", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "src/panels/greenautarky-setup/ga-setup-info-pages.ts")
      )
    ).toBe(false);
    expect(
      fs.existsSync(path.join(ROOT, "src/onboarding/custom-pages/page-info.ts"))
    ).toBe(false);
  });

  it("the panel neither imports, renders nor routes it", () => {
    const panel = read(
      "src/panels/greenautarky-setup/ha-panel-greenautarky-setup.ts"
    );
    expect(panel).not.toContain("info_pages");
    expect(panel).not.toContain("ga-setup-info-pages");
  });

  it("no translation key or text of the page remains (DE and EN)", () => {
    for (const [name, table] of [
      ["de", de],
      ["en", en],
    ] as const) {
      const keys = Object.keys(table).filter((k) => k.includes("info_pages"));
      expect(keys, `${name} still has info_pages keys`).toEqual([]);
    }
    for (const f of [
      "src/panels/greenautarky-setup/translations/de.ts",
      "src/panels/greenautarky-setup/translations/en.ts",
    ]) {
      expect(read(f)).not.toContain("info_pages");
    }
  });
});
