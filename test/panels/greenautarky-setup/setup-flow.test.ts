import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Tests for the greenautarky setup flow step ordering and logic.
 * These test the step sequence and transition rules.
 */

const STEPS = ["welcome", "gdpr", "user", "info_pages", "analytics"] as const;
type StepType = (typeof STEPS)[number];

/**
 * Simulates the step transition logic from ha-panel-greenautarky-setup.ts.
 * Returns the next step given a completed step type.
 */
function getNextStep(completedStep: StepType): StepType | "done" {
  const transitions: Record<StepType, StepType | "done"> = {
    welcome: "gdpr",
    gdpr: "user",
    user: "info_pages",
    info_pages: "analytics",
    analytics: "done",
  };
  return transitions[completedStep];
}

/**
 * Simulates progress calculation from the panel.
 */
function calculateProgress(completedStep: StepType): number {
  const currentIndex = STEPS.indexOf(completedStep);
  return (currentIndex + 1) / STEPS.length;
}

describe("GA setup step flow", () => {
  it("defines exactly 5 steps in order", () => {
    expect(STEPS).toEqual([
      "welcome",
      "gdpr",
      "user",
      "info_pages",
      "analytics",
    ]);
    expect(STEPS).toHaveLength(5);
  });

  it("transitions through all steps in order", () => {
    let current: StepType | "done" = "welcome";
    const visited: string[] = [current];

    while (current !== "done") {
      current = getNextStep(current as StepType);
      visited.push(current);
    }

    expect(visited).toEqual([
      "welcome",
      "gdpr",
      "user",
      "info_pages",
      "analytics",
      "done",
    ]);
  });

  it("welcome leads to gdpr (not directly to user)", () => {
    expect(getNextStep("welcome")).toBe("gdpr");
  });

  it("user step comes after gdpr (GDPR must be accepted before account creation)", () => {
    expect(getNextStep("gdpr")).toBe("user");
  });

  it("info_pages comes after user (user must be authenticated first)", () => {
    expect(getNextStep("user")).toBe("info_pages");
  });

  it("analytics is the last step before completion", () => {
    expect(getNextStep("analytics")).toBe("done");
  });

  it("calculates progress correctly", () => {
    expect(calculateProgress("welcome")).toBeCloseTo(0.2);
    expect(calculateProgress("gdpr")).toBeCloseTo(0.4);
    expect(calculateProgress("user")).toBeCloseTo(0.6);
    expect(calculateProgress("info_pages")).toBeCloseTo(0.8);
    expect(calculateProgress("analytics")).toBeCloseTo(1.0);
  });
});

describe("GA setup step requirements", () => {
  it("user step requires authentication — comes after unauthenticated steps", () => {
    const userIndex = STEPS.indexOf("user");
    const unauthSteps = STEPS.slice(0, userIndex);
    // welcome and gdpr don't need hass connection
    expect(unauthSteps).toEqual(["welcome", "gdpr"]);
  });

  it("analytics step requires hass — comes after user authentication", () => {
    const analyticsIndex = STEPS.indexOf("analytics");
    const userIndex = STEPS.indexOf("user");
    expect(analyticsIndex).toBeGreaterThan(userIndex);
  });
});

describe("GA setup source verification", () => {
  const PANEL_DIR = path.resolve(
    __dirname,
    "../../../src/panels/greenautarky-setup"
  );

  it("analytics step calls GA telemetry", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ga-setup-analytics.ts"),
      "utf-8"
    );
    // HA system analytics was removed (requires admin) — only GA telemetry
    expect(source).not.toContain("setAnalyticsPreferences");
    expect(source).toContain("setGATelemetryPreferences");
  });

  it("GDPR step requires acceptance before continue", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ga-setup-gdpr.ts"),
      "utf-8"
    );
    // The _continue method must guard on _accepted
    expect(source).toContain("if (!this._accepted)");
  });
});
