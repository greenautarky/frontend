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

describe("GA app-flow redirect (authorize ↔ setup)", () => {
  const ENTRYPOINTS_DIR = path.resolve(__dirname, "../../../src/entrypoints");
  const PANEL_DIR = path.resolve(
    __dirname,
    "../../../src/panels/greenautarky-setup"
  );

  // ── authorize.ts pre-check ────────────────────────────────────────────────

  it("authorize.ts fetches the GA onboarding status endpoint", () => {
    const source = fs.readFileSync(
      path.join(ENTRYPOINTS_DIR, "authorize.ts"),
      "utf-8"
    );
    expect(source).toContain("/api/greenautarky_onboarding/status");
  });

  it("authorize.ts stores the auth URL in sessionStorage before redirecting", () => {
    const source = fs.readFileSync(
      path.join(ENTRYPOINTS_DIR, "authorize.ts"),
      "utf-8"
    );
    expect(source).toContain('sessionStorage.setItem("ga_auth_redirect"');
  });

  it("authorize.ts redirects to greenautarky-setup.html when not complete", () => {
    const source = fs.readFileSync(
      path.join(ENTRYPOINTS_DIR, "authorize.ts"),
      "utf-8"
    );
    expect(source).toContain("greenautarky-setup.html");
  });

  it("authorize.ts skips redirect when ga_bypass=1 is present (admin escape hatch)", () => {
    const source = fs.readFileSync(
      path.join(ENTRYPOINTS_DIR, "authorize.ts"),
      "utf-8"
    );
    expect(source).toContain("ga_bypass");
  });

  // ── Panel completion redirect ─────────────────────────────────────────────

  it("panel reads ga_auth_redirect from sessionStorage on completion (app flow)", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    expect(source).toContain('sessionStorage.getItem("ga_auth_redirect")');
  });

  it("panel removes ga_auth_redirect from sessionStorage after redirect", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    expect(source).toContain('sessionStorage.removeItem("ga_auth_redirect")');
  });

  it("panel falls back to / when no ga_auth_redirect (browser flow)", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    // Both branches must exist: redirect to authRedirect AND fallback to /
    expect(source).toContain("document.location.assign(authRedirect)");
    expect(source).toContain('document.location.assign("/")');
  });

  // ── Admin-Login escape hatch ──────────────────────────────────────────────

  it("panel renders Admin-Login link for app-flow escape hatch", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    expect(source).toContain("admin-login");
    expect(source).toContain("Admin-Login");
  });

  it("Admin-Login link appends ga_bypass=1 to the stored auth URL", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    expect(source).toContain("ga_bypass=1");
  });

  it("panel reads _authRedirect in firstUpdated (not computed each render)", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    // _authRedirect must be a @state() property (reactive, avoids sessionStorage on every render)
    expect(source).toContain("_authRedirect");
    expect(source).toContain("firstUpdated");
  });

  // ── Build-id click → /admin (URL-change escape hatch) ─────────────────────

  it("build-id is rendered as a clickable anchor (not a plain span)", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    // Anchor with class="build-id" must exist
    expect(source).toMatch(/<a class="build-id"[^>]*href=/);
    // The previous plain <span class="build-id"> wrapper must be gone —
    // otherwise clicking the version number does nothing.
    expect(source).not.toMatch(/<span class="build-id">/);
  });

  it("build-id anchor links to /admin (server-side admin shortcut)", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    // The href must be the /admin route registered by the core integration —
    // the server resolves origin + redirect_uri server-side so the link
    // works even if the panel is loaded under a non-default origin.
    expect(source).toMatch(/<a class="build-id"[^>]*href="\/admin"/);
  });

  it("build-id still embeds __VERSION__ and __GIT_HASH__", () => {
    const source = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    // The visual version-id in the wizard footer must remain present so
    // the reader can still see which build is running (it's also the click
    // target now). The literal ${...} chars are part of a Lit template,
    // not a JS template literal in this test file.
    // eslint-disable-next-line no-template-curly-in-string
    expect(source).toContain("${__VERSION__}-${__GIT_HASH__}");
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

describe("sub-user join flow (ADR-0006)", () => {
  const PANEL_DIR = path.resolve(
    __dirname,
    "../../../src/panels/greenautarky-setup"
  );
  const joinNext = (step: string): string => (step === "pin" ? "user" : "done");

  it("join flow is pin(invite) → user → done (skips gdpr/info/analytics/ethernet)", () => {
    let cur = "pin";
    const visited = [cur];
    while (cur !== "done") {
      cur = joinNext(cur);
      visited.push(cur);
    }
    expect(visited).toEqual(["pin", "user", "done"]);
  });

  it("panel detects join mode and starts at the PIN step", () => {
    const src = fs.readFileSync(
      path.join(PANEL_DIR, "ha-panel-greenautarky-setup.ts"),
      "utf-8"
    );
    expect(src).toContain("_joinMode");
    expect(src).toContain("greenautarky-join");
    expect(src).toContain('this._currentStep = "pin"');
  });

  it("PIN step carries the invite PIN in join mode (no device verify)", () => {
    const src = fs.readFileSync(
      path.join(PANEL_DIR, "ga-setup-pin.ts"),
      "utf-8"
    );
    expect(src).toContain("joinMode");
    expect(src).toContain("pin }");
  });

  it("create-user calls the join endpoint with the invite PIN in join mode", () => {
    const src = fs.readFileSync(
      path.join(PANEL_DIR, "ga-setup-create-user.ts"),
      "utf-8"
    );
    expect(src).toContain("joinGASubUser");
    expect(src).toContain("invitePin");
  });

  it("data module posts to the sub_user/join endpoint", () => {
    const src = fs.readFileSync(
      path.join(PANEL_DIR, "../../data/greenautarky_setup.ts"),
      "utf-8"
    );
    expect(src).toContain("/api/greenautarky_onboarding/sub_user/join");
  });
});
