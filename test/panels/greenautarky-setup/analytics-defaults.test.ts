import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

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
    expect(ANALYTICS_SOURCE).toMatch(/Art\.?\s*6.*\(?f\)?/i);
    // Tier 2 → Art. 6 (a) — Einwilligung
    expect(ANALYTICS_SOURCE).toMatch(/Art\.?\s*6.*\(?a\)?/i);
  });

  it("Tier 1 toggle is labeled 'recommended' to encourage opt-in default", () => {
    expect(ANALYTICS_SOURCE.toLowerCase()).toContain("empfohlen");
  });

  it("Stale-consent banner is wired up (Phase E)", () => {
    // The panel must read the backend's consent_is_stale flag and surface
    // a banner so users get re-asked after a policy bump.
    expect(ANALYTICS_SOURCE).toMatch(/_consentIsStale/);
    expect(ANALYTICS_SOURCE).toMatch(/stale-consent-banner/);
    expect(ANALYTICS_SOURCE).toMatch(/getGATelemetryPreferences/);
  });
});
