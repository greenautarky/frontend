import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Tests for the greenautarky telemetry API layer.
 * Verifies WebSocket command types and interface shape match the backend.
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

  it("GATelemetryPreferences interface has error_logs and metrics fields", () => {
    expect(TELEMETRY_SOURCE).toContain("error_logs: boolean");
    expect(TELEMETRY_SOURCE).toContain("metrics: boolean");
  });
});
