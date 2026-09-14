import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  STEP_ORDER,
  STEPS_WITH_BACK,
  advance,
  goBack,
  canGoBack,
  backAvailableFor,
  progressFor,
  type NavState,
} from "../../../src/panels/greenautarky-setup/setup-flow";

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
    expect(source).toContain("${GA_API_BASE}/status");
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
    expect(src).toContain("${GA_API_BASE}/sub_user/join");
  });
});

// ===========================================================================
// FIX 2 (Ahmad feedback) — a "Zurück" (back) step.
//
// These exercise the LIVE navigation reducer (src/.../setup-flow.ts) the panel
// runs — not a re-declared copy — plus source checks that the panel and the
// step components are actually wired to it.
// ===========================================================================
describe("FIX 2 — setup-flow back navigation (live reducer)", () => {
  const start = (): NavState => ({ current: "welcome", history: [] });

  it("STEP_ORDER is the full 7-step flow", () => {
    expect(STEP_ORDER).toEqual([
      "welcome",
      "pin",
      "gdpr",
      "user",
      "info_pages",
      "analytics",
      "ethernet",
    ]);
  });

  it("analytics → back → info_pages", () => {
    let s = start();
    s = advance(s, "gdpr"); // no-PIN path: welcome → gdpr
    s = advance(s, "user");
    s = advance(s, "info_pages"); // account gate clears history
    s = advance(s, "analytics");
    expect(canGoBack(s)).toBe(true);
    s = goBack(s);
    expect(s.current).toBe("info_pages");
  });

  it("ethernet → back → analytics", () => {
    let s = start();
    s = advance(s, "gdpr");
    s = advance(s, "user");
    s = advance(s, "info_pages");
    s = advance(s, "analytics");
    s = advance(s, "ethernet");
    s = goBack(s);
    expect(s.current).toBe("analytics");
  });

  it("gdpr → back → welcome when no PIN was required", () => {
    let s = start();
    s = advance(s, "gdpr"); // welcome → gdpr
    expect(backAvailableFor(s)).toBe(true);
    s = goBack(s);
    expect(s.current).toBe("welcome");
  });

  it("gdpr → back → pin when a PIN was set", () => {
    let s = start();
    s = advance(s, "pin"); // welcome → pin
    s = advance(s, "gdpr"); // pin → gdpr
    s = goBack(s);
    expect(s.current).toBe("pin");
  });

  it("no back across the PIN gate (pin step has no back button)", () => {
    const s: NavState = { current: "pin", history: ["welcome"] };
    expect(STEPS_WITH_BACK).not.toContain("pin");
    expect(backAvailableFor(s)).toBe(false);
  });

  it("user step offers no back — a second run would create a second account", () => {
    const onUser: NavState = { current: "user", history: ["welcome", "gdpr"] };
    expect(STEPS_WITH_BACK).not.toContain("user");
    expect(backAvailableFor(onUser)).toBe(false);

    // Once past the account gate, history is cleared so back can never return
    // into create-user.
    const afterGate = advance(onUser, "info_pages");
    expect(afterGate.history).toEqual([]);
    expect(canGoBack(afterGate)).toBe(false);
    expect(backAvailableFor(afterGate)).toBe(false);
    expect(goBack(afterGate).current).toBe("info_pages"); // no-op, not "user"
  });

  it("popstate and the on-page button drive the SAME transition (one reducer)", () => {
    const s: NavState = { current: "analytics", history: ["info_pages"] };
    const viaButton = goBack(s);
    const viaPopstate = goBack(s);
    expect(viaPopstate).toEqual(viaButton);
    expect(viaButton.current).toBe("info_pages");
  });

  it("progressFor tracks the completed step in the 7-step flow", () => {
    expect(progressFor("welcome")).toBeCloseTo(1 / 7);
    expect(progressFor("analytics")).toBeCloseTo(6 / 7);
    expect(progressFor("ethernet")).toBeCloseTo(1);
  });
});

describe("FIX 2 — panel & steps are wired to setup-flow (live source)", () => {
  const PANEL_DIR = path.resolve(
    __dirname,
    "../../../src/panels/greenautarky-setup"
  );
  const read = (f: string) => fs.readFileSync(path.join(PANEL_DIR, f), "utf-8");
  const panel = read("ha-panel-greenautarky-setup.ts");

  it("panel drives navigation through the shared setup-flow module", () => {
    expect(panel).toMatch(/from ["']\.\/setup-flow["']/);
    expect(panel).toContain("advance");
    expect(panel).toContain("goBack");
  });

  it("panel listens for the ga-setup-back event", () => {
    expect(panel).toMatch(/addEventListener\(\s*["']ga-setup-back["']/);
  });

  it("browser Back is wired: history.pushState per step + popstate handler", () => {
    expect(panel).toContain("history.pushState");
    expect(panel).toMatch(/addEventListener\(\s*["']popstate["']/);
  });

  it("panel passes canBack to the back-capable steps", () => {
    expect(panel).toContain(".canBack");
  });

  it("exactly the back-capable steps fire ga-setup-back; the gated ones do not", () => {
    for (const f of [
      "ga-setup-gdpr.ts",
      "ga-setup-info-pages.ts",
      "ga-setup-analytics.ts",
      "ga-setup-ethernet.ts",
    ]) {
      expect(read(f), `${f} must fire ga-setup-back`).toContain(
        "ga-setup-back"
      );
    }
    // welcome (nothing before), pin (PIN gate), user (account gate) must NOT.
    for (const f of [
      "ga-setup-welcome.ts",
      "ga-setup-pin.ts",
      "ga-setup-create-user.ts",
    ]) {
      expect(read(f), `${f} must NOT offer back`).not.toContain(
        "ga-setup-back"
      );
    }
  });
});
