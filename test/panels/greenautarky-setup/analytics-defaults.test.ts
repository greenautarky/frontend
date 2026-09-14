import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
// FIX 1: user-facing tier text now lives in the bundled translation tables, so
// text assertions read the LIVE German table; structural assertions (defaults,
// section markup, no-toggle-in-tier-0) still read the component source.
import { messages as de } from "../../../src/panels/greenautarky-setup/translations/de";

/**
 * Tier-model regression tests for the ga-setup-analytics consent panel.
 *
 * These guard against drift from the documented privacy tier defaults
 * (ga-ihost-docs/PRIVACY_TIERS.md):
 *   Tier 1 (error_logs) default ON  — Art. 6 (f) DSGVO berechtigtes Interesse
 *   Tier 2 (metrics)    default OFF — Art. 6 (a) DSGVO Einwilligung
 *
 * Any commit that flips the defaults must touch this test deliberately,
 * forcing reviewer + lawyer attention.
 */

const ANALYTICS_SOURCE = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../../src/panels/greenautarky-setup/ga-setup-analytics.ts"
  ),
  "utf-8"
);

describe("ga-setup-analytics privacy tier defaults", () => {
  it("Tier 1 (error_logs) defaults to true (berechtigtes Interesse)", () => {
    // Match the initial state assignment regardless of whitespace
    expect(ANALYTICS_SOURCE).toMatch(/error_logs:\s*true\b/);
  });

  it("Tier 2 (metrics) defaults to false (Einwilligung required)", () => {
    expect(ANALYTICS_SOURCE).toMatch(/metrics:\s*false\b/);
  });

  it("Component comments reference the canonical privacy doc", () => {
    expect(ANALYTICS_SOURCE).toContain("PRIVACY_TIERS.md");
  });

  it("UI text cites the DSGVO legal basis per tier", () => {
    // Tier 1 → Art. 6 (f) — berechtigtes Interesse
    expect(de["ui.panel.greenautarky_setup.analytics.tier1_legal"]).toMatch(
      /Art\.?\s*6.*\(?f\)?|lit\.\s*f/i
    );
    // Tier 2 → Art. 6 (a) — Einwilligung
    expect(de["ui.panel.greenautarky_setup.analytics.tier2_legal"]).toMatch(
      /Art\.?\s*6.*\(?a\)?|lit\.\s*a/i
    );
  });

  it("Tier 1 toggle is labeled 'recommended' to encourage opt-in default", () => {
    expect(
      de["ui.panel.greenautarky_setup.analytics.tier1_title"].toLowerCase()
    ).toContain("empfohlen");
  });

  it("Stale-consent banner is wired up (Phase E)", () => {
    // The panel must read the backend's consent_is_stale flag and surface
    // a banner so users get re-asked after a policy bump.
    expect(ANALYTICS_SOURCE).toMatch(/_consentIsStale/);
    expect(ANALYTICS_SOURCE).toMatch(/stale-consent-banner/);
    expect(ANALYTICS_SOURCE).toMatch(/getGATelemetryPreferences/);
  });

  // ---------------------------------------------------------------------
  // Phase F — redesigned consent UI with three explicit tier sections.
  // ---------------------------------------------------------------------

  it("Tier 0 has an info-only section without a toggle (Phase F)", () => {
    // Structure lives in the source: a labeled tier-0 section with NO ha-switch.
    expect(ANALYTICS_SOURCE).toMatch(/class="tier tier-0"/);
    const tier0Match = ANALYTICS_SOURCE.match(
      /<section class="tier tier-0">([\s\S]*?)<\/section>/
    );
    expect(tier0Match, "tier-0 section must exist").not.toBeNull();
    expect(tier0Match![1]).not.toContain("ha-switch");
    // Its label + always-on badge text live in the translation table.
    expect(de["ui.panel.greenautarky_setup.analytics.tier0_title"]).toMatch(
      /Betriebsnotwendige\s+Daten/
    );
    expect(de["ui.panel.greenautarky_setup.analytics.tier0_badge"]).toMatch(
      /immer\s+aktiv/
    );
  });

  it("Tier 0 cites Art. 6 (b) Vertragserfüllung as the legal basis (Phase F)", () => {
    const legal = de["ui.panel.greenautarky_setup.analytics.tier0_legal"];
    expect(legal).toMatch(/Art\.?\s*6.*\(?b\)?|lit\.\s*b/i);
    expect(legal.toLowerCase()).toContain("vertragserf");
  });

  it("Each tier section has a 'Mehr erfahren' expandable detail (Phase F)", () => {
    // Three <details> blocks — one per tier — in the source markup.
    const detailsBlocks = ANALYTICS_SOURCE.match(
      /<details>[\s\S]*?<\/details>/g
    );
    expect(detailsBlocks).not.toBeNull();
    expect(detailsBlocks!.length).toBeGreaterThanOrEqual(3);
    // Each renders the shared "more" disclosure label from the table.
    for (const block of detailsBlocks!) {
      expect(block).toContain("ui.panel.greenautarky_setup.analytics.more");
    }
    expect(de["ui.panel.greenautarky_setup.analytics.more"]).toBe(
      "Mehr erfahren"
    );
  });

  it("Tier 2 label rebranded to 'Detaillierte Leistungsdaten' (Phase F)", () => {
    // Acceptance criterion: the Tier 2 heading is the plain-language label.
    expect(de["ui.panel.greenautarky_setup.analytics.tier2_title"]).toMatch(
      /Detaillierte\s+Leistungsdaten/
    );
  });

  it("Footer carries a link to the full versioned privacy policy (Phase F)", () => {
    expect(ANALYTICS_SOURCE).toMatch(/class="policy-link"/);
    expect(ANALYTICS_SOURCE).toMatch(
      /href="https:\/\/greenautarky\.com\/datenschutz"/
    );
  });
});
