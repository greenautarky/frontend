import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Contract tests for the greenautarky telemetry API layer.
 *
 * Validates the TypeScript source against:
 * - WebSocket command types (must match HA Core component)
 * - Privacy Tier model (canonical tier1/tier2 keys plus legacy aliases)
 * - v2 response shape (with policy_version + accepted_at per tier)
 *
 * Backend reference:
 *   ha-core/homeassistant/components/greenautarky_telemetry/__init__.py
 *
 * Canonical doc:
 *   ga-ihost-docs/PRIVACY_TIERS.md
 */

const TELEMETRY_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../../src/data/greenautarky_telemetry.ts"),
  "utf-8"
);

describe("greenautarky telemetry API contract", () => {
  it("getGATelemetryPreferences uses correct WS type", () => {
    expect(TELEMETRY_SOURCE).toContain('"greenautarky_telemetry/get"');
  });

  it("setGATelemetryPreferences uses correct WS type", () => {
    expect(TELEMETRY_SOURCE).toContain('"greenautarky_telemetry/set"');
  });

  it("GATelemetryPreferences interface retains legacy error_logs + metrics keys", () => {
    expect(TELEMETRY_SOURCE).toContain("error_logs: boolean");
    expect(TELEMETRY_SOURCE).toContain("metrics: boolean");
  });

  it("Interface adds canonical tier1 + tier2 keys (optional)", () => {
    expect(TELEMETRY_SOURCE).toContain("tier1?: boolean");
    expect(TELEMETRY_SOURCE).toContain("tier2?: boolean");
  });

  it("Per-tier metadata record type exists", () => {
    expect(TELEMETRY_SOURCE).toContain("GATierConsentRecord");
    expect(TELEMETRY_SOURCE).toContain("accepted_at: string");
    expect(TELEMETRY_SOURCE).toContain("policy_version: number");
  });

  it("Full response type exposes policy version + per-tier records", () => {
    expect(TELEMETRY_SOURCE).toContain("GATelemetryFullResponse");
    expect(TELEMETRY_SOURCE).toContain("policy_version_accepted");
    expect(TELEMETRY_SOURCE).toContain("current_policy_version");
    expect(TELEMETRY_SOURCE).toContain("tiers?");
  });

  it("Full response type carries the derived consent_is_stale flag (Phase E)", () => {
    expect(TELEMETRY_SOURCE).toMatch(/consent_is_stale\?:\s*boolean/);
  });
});
