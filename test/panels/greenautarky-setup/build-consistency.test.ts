import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Tests that the greenautarky-setup build pipeline is correctly configured.
 * Ensures that the Lit panel (not a static HTML page) will be served on devices.
 */

const ROOT = path.resolve(__dirname, "../../..");

describe("greenautarky-setup build pipeline", () => {
  it("webpack entrypoint exists", () => {
    const entrypoint = path.join(ROOT, "src/entrypoints/greenautarky-setup.ts");
    expect(fs.existsSync(entrypoint)).toBe(true);
  });

  it("HTML template exists", () => {
    const template = path.join(
      ROOT,
      "src/html/greenautarky-setup.html.template"
    );
    expect(fs.existsSync(template)).toBe(true);
  });

  it("HTML template loads the Lit panel component", () => {
    const template = fs.readFileSync(
      path.join(ROOT, "src/html/greenautarky-setup.html.template"),
      "utf-8"
    );
    expect(template).toContain("<ha-panel-greenautarky-setup>");
    expect(template).toContain("_script_loader.html.template");
  });

  it("entrypoint is registered in bundle.cjs", () => {
    const bundle = fs.readFileSync(
      path.join(ROOT, "build-scripts/bundle.cjs"),
      "utf-8"
    );
    expect(bundle).toContain('"greenautarky-setup"');
    expect(bundle).toContain("./src/entrypoints/greenautarky-setup.ts");
  });

  it("HTML page is registered in APP_PAGE_ENTRIES (entry-html.js)", () => {
    const entryHtml = fs.readFileSync(
      path.join(ROOT, "build-scripts/gulp/entry-html.js"),
      "utf-8"
    );
    expect(entryHtml).toContain('"greenautarky-setup.html"');
    expect(entryHtml).toContain('["greenautarky-setup"]');
  });

  it("HTML page is included in compression (compress.js)", () => {
    const compress = fs.readFileSync(
      path.join(ROOT, "build-scripts/gulp/compress.js"),
      "utf-8"
    );
    expect(compress).toContain("greenautarky-setup");
  });

  it("__GIT_HASH__ is defined in bundle.cjs", () => {
    const bundle = fs.readFileSync(
      path.join(ROOT, "build-scripts/bundle.cjs"),
      "utf-8"
    );
    expect(bundle).toContain("__GIT_HASH__");
  });

  it("__GIT_HASH__ is declared in types.ts", () => {
    const types = fs.readFileSync(path.join(ROOT, "src/types.ts"), "utf-8");
    expect(types).toContain("__GIT_HASH__");
  });
});

describe("greenautarky-setup panel requirements", () => {
  it("panel orchestrator exists and has all step imports", () => {
    const panel = fs.readFileSync(
      path.join(
        ROOT,
        "src/panels/greenautarky-setup/ha-panel-greenautarky-setup.ts"
      ),
      "utf-8"
    );
    // All step components must be imported
    expect(panel).toContain("./ga-setup-welcome");
    expect(panel).toContain("./ga-setup-gdpr");
    expect(panel).toContain("./ga-setup-create-user");
    expect(panel).toContain("./ga-setup-info-pages");
    expect(panel).toContain("./ga-setup-analytics");
  });

  it("STEP_ORDER (setup-flow.ts) defines the full step flow", () => {
    // The canonical step order lives in the shared setup-flow module (the
    // panel imports it), so both the panel and the back-navigation reducer
    // read one source of truth.
    const flow = fs.readFileSync(
      path.join(ROOT, "src/panels/greenautarky-setup/setup-flow.ts"),
      "utf-8"
    );
    const stepsMatch = flow.match(/const STEP_ORDER[^=]*=\s*\[([\s\S]*?)\]/);
    expect(stepsMatch).not.toBeNull();
    const stepsContent = stepsMatch![1];
    for (const step of [
      "welcome",
      "pin",
      "gdpr",
      "user",
      "info_pages",
      "analytics",
      "ethernet",
    ]) {
      expect(stepsContent, `STEP_ORDER missing "${step}"`).toContain(
        `"${step}"`
      );
    }
    // The panel must consume the shared order, not re-declare its own.
    const panel = fs.readFileSync(
      path.join(
        ROOT,
        "src/panels/greenautarky-setup/ha-panel-greenautarky-setup.ts"
      ),
      "utf-8"
    );
    expect(panel).toMatch(/from ["']\.\/setup-flow["']/);
  });

  it("user step calls createGASetupUser (not create_tenant)", () => {
    const createUser = fs.readFileSync(
      path.join(ROOT, "src/panels/greenautarky-setup/ga-setup-create-user.ts"),
      "utf-8"
    );
    expect(createUser).toContain("createGASetupUser");
    expect(createUser).not.toContain("create_tenant");
  });

  it("API data layer uses create_user endpoint (not create_tenant)", () => {
    const api = fs.readFileSync(
      path.join(ROOT, "src/data/greenautarky_setup.ts"),
      "utf-8"
    );
    expect(api).toContain("${GA_API_BASE}/create_user");
    expect(api).not.toContain("create_tenant");
  });

  it("panel shows build version in footer", () => {
    const panel = fs.readFileSync(
      path.join(
        ROOT,
        "src/panels/greenautarky-setup/ha-panel-greenautarky-setup.ts"
      ),
      "utf-8"
    );
    expect(panel).toContain("__VERSION__");
    expect(panel).toContain("__GIT_HASH__");
    expect(panel).toContain("build-id");
  });

  it("all step component files exist", () => {
    const dir = path.join(ROOT, "src/panels/greenautarky-setup");
    const required = [
      "ha-panel-greenautarky-setup.ts",
      "ga-setup-welcome.ts",
      "ga-setup-gdpr.ts",
      "ga-setup-create-user.ts",
      "ga-setup-info-pages.ts",
      "ga-setup-analytics.ts",
      "password-strength.ts",
    ];
    for (const file of required) {
      expect(fs.existsSync(path.join(dir, file)), `Missing: ${file}`).toBe(
        true
      );
    }
  });
});

describe("authorize.ts app-flow integration", () => {
  it("authorize.ts entrypoint exists", () => {
    expect(fs.existsSync(path.join(ROOT, "src/entrypoints/authorize.ts"))).toBe(
      true
    );
  });

  it("authorize.html.template exists and contains ha-authorize", () => {
    const template = path.join(ROOT, "src/html/authorize.html.template");
    expect(fs.existsSync(template)).toBe(true);
    expect(fs.readFileSync(template, "utf-8")).toContain("<ha-authorize>");
  });

  it("authorize is registered in bundle.cjs", () => {
    const bundle = fs.readFileSync(
      path.join(ROOT, "build-scripts/bundle.cjs"),
      "utf-8"
    );
    // Key is unquoted in the object literal: `authorize: "./src/..."`
    expect(bundle).toContain("authorize:");
    expect(bundle).toContain("./src/entrypoints/authorize.ts");
  });

  it("authorize.html is registered in APP_PAGE_ENTRIES (entry-html.js)", () => {
    const entryHtml = fs.readFileSync(
      path.join(ROOT, "build-scripts/gulp/entry-html.js"),
      "utf-8"
    );
    expect(entryHtml).toContain('"authorize.html"');
  });

  it("authorize.ts contains GA onboarding pre-check (not just ha-authorize import)", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "src/entrypoints/authorize.ts"),
      "utf-8"
    );
    expect(source).toContain("${GA_API_BASE}/status");
    expect(source).toContain("ga_auth_redirect");
    expect(source).toContain("ga_bypass");
  });
});

describe("frontend version is CI-managed (not hardcoded)", () => {
  it("pyproject.toml uses 0.0.0.dev0 placeholder — real version is injected by CI", () => {
    const pyproject = fs.readFileSync(
      path.join(ROOT, "pyproject.toml"),
      "utf-8"
    );
    // The version must be the placeholder. If this fails, someone committed a
    // hardcoded version. The real version is computed and injected by build-ga-core.yml.
    expect(pyproject).toContain('version      = "0.0.0.dev0"');
  });
});

describe("greenautarky-setup backend consistency (core repo)", () => {
  const coreRoot = path.resolve(ROOT, "../homeassisant_core");
  const coreExists = fs.existsSync(coreRoot);

  it.skipIf(!coreExists)(
    "frontend/__init__.py registers greenautarky-setup.html as static path",
    () => {
      const init = fs.readFileSync(
        path.join(coreRoot, "homeassistant/components/frontend/__init__.py"),
        "utf-8"
      );
      expect(init).toContain("greenautarky-setup.html");
    }
  );

  it.skipIf(!coreExists)(
    "old page.html no longer exists (replaced by built frontend)",
    () => {
      expect(
        fs.existsSync(
          path.join(
            coreRoot,
            "homeassistant/components/greenautarky_onboarding/page.html"
          )
        )
      ).toBe(false);
    }
  );

  it.skipIf(!coreExists)(
    "GAOnboardingPageView redirects to .html (does not serve inline HTML)",
    () => {
      const http = fs.readFileSync(
        path.join(
          coreRoot,
          "homeassistant/components/greenautarky_onboarding/http.py"
        ),
        "utf-8"
      );
      expect(http).toContain("greenautarky-setup.html");
      expect(http).not.toContain("_PAGE_HTML");
    }
  );

  it.skipIf(!coreExists)(
    "http.py uses create_user endpoint (not create_tenant)",
    () => {
      const http = fs.readFileSync(
        path.join(
          coreRoot,
          "homeassistant/components/greenautarky_onboarding/http.py"
        ),
        "utf-8"
      );
      expect(http).toContain("create_user");
      expect(http).not.toContain("create_tenant");
    }
  );

  it.skipIf(!coreExists)(
    "iframe panel points to .html (not /greenautarky-setup)",
    () => {
      const entrypoint = fs.readFileSync(
        path.join(
          coreRoot,
          "homeassistant/components/greenautarky_onboarding/panel/dist/entrypoint.js"
        ),
        "utf-8"
      );
      expect(entrypoint).toContain("greenautarky-setup.html");
    }
  );
});

// ---------------------------------------------------------------------------
// FIX 3 (Ahmad feedback) — dark-mode readability of the consent panel.
//
// Every CSS custom property the wizard panels CONSUME via var(--x) must be
// DEFINED in the theme (src/resources/theme/**) or the page template. An
// undefined var silently falls back to its hardcoded literal — a LIGHT colour
// — which then wins in the dark theme too, producing light-on-light text
// (the "Betriebsnotwendige Daten" / tier-0 card was unreadable in dark mode
// because it used var(--card-background-color-elevated, #fafafa), a variable
// defined nowhere).
//
// This self-test reads the LIVE panel sources, the LIVE theme files and the
// LIVE template on every run — never a re-declared copy — so it cannot rot
// into agreement with a broken panel.
// ---------------------------------------------------------------------------
describe("greenautarky-setup CSS variables are themeable (dark-mode safe)", () => {
  const PANEL_DIR = path.join(ROOT, "src/panels/greenautarky-setup");
  const THEME_DIR = path.join(ROOT, "src/resources/theme");
  const TEMPLATE = path.join(ROOT, "src/html/greenautarky-setup.html.template");

  const readAllFiles = (dir: string): string => {
    let out = "";
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out += readAllFiles(full);
      } else if (entry.isFile()) {
        out += fs.readFileSync(full, "utf-8") + "\n";
      }
    }
    return out;
  };

  const panelFiles = fs.readdirSync(PANEL_DIR).filter((f) => f.endsWith(".ts"));
  const panelSource = panelFiles
    .map((f) => fs.readFileSync(path.join(PANEL_DIR, f), "utf-8"))
    .join("\n");
  // "defined" = anything the running theme or the served page provides.
  const definitionSource =
    readAllFiles(THEME_DIR) + "\n" + fs.readFileSync(TEMPLATE, "utf-8");

  const usedVars = new Set<string>();
  for (const m of panelSource.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    usedVars.add(m[1]);
  }

  const definedVars = new Set<string>();
  for (const m of definitionSource.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
    definedVars.add(m[1]);
  }

  it("extracts CSS variables from the LIVE sources (coverage guard)", () => {
    // A tool that inspects zero items is a failure, not a pass. If the file
    // layout or the extraction regex drifts, FAIL loudly rather than green.
    expect(panelFiles.length, "no panel .ts files found").toBeGreaterThan(0);
    expect(usedVars.size, "no var(--x) usages extracted").toBeGreaterThan(0);
    expect(
      definedVars.size,
      "no --x: definitions extracted from theme/template"
    ).toBeGreaterThan(0);
  });

  it("every var() consumed by the wizard panels is defined in theme or template", () => {
    const undefinedVars = [...usedVars].filter((v) => !definedVars.has(v));
    expect(
      undefinedVars,
      `Undefined CSS custom properties (their light fallback wins in dark mode → unreadable): ${undefinedVars.join(
        ", "
      )}`
    ).toEqual([]);
  });
});
