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
    const entrypoint = path.join(
      ROOT,
      "src/entrypoints/greenautarky-setup.ts"
    );
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
    expect(bundle).toContain(
      "./src/entrypoints/greenautarky-setup.ts"
    );
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
    const types = fs.readFileSync(
      path.join(ROOT, "src/types.ts"),
      "utf-8"
    );
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

  it("panel defines all 5 steps including user creation", () => {
    const panel = fs.readFileSync(
      path.join(
        ROOT,
        "src/panels/greenautarky-setup/ha-panel-greenautarky-setup.ts"
      ),
      "utf-8"
    );
    // Extract STEPS array
    const stepsMatch = panel.match(
      /const STEPS[^=]*=\s*\[([\s\S]*?)\]/
    );
    expect(stepsMatch).not.toBeNull();
    const stepsContent = stepsMatch![1];
    expect(stepsContent).toContain('"welcome"');
    expect(stepsContent).toContain('"gdpr"');
    expect(stepsContent).toContain('"user"');
    expect(stepsContent).toContain('"info_pages"');
    expect(stepsContent).toContain('"analytics"');
  });

  it("user step calls createGASetupUser (not create_tenant)", () => {
    const createUser = fs.readFileSync(
      path.join(
        ROOT,
        "src/panels/greenautarky-setup/ga-setup-create-user.ts"
      ),
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
    expect(api).toContain("/api/greenautarky_onboarding/create_user");
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
      expect(
        fs.existsSync(path.join(dir, file)),
        `Missing: ${file}`
      ).toBe(true);
    }
  });
});

describe("greenautarky-setup backend consistency (core repo)", () => {
  const coreRoot = path.resolve(ROOT, "../homeassisant_core");
  const coreExists = fs.existsSync(coreRoot);

  it.skipIf(!coreExists)(
    "frontend/__init__.py registers greenautarky-setup.html as static path",
    () => {
      const init = fs.readFileSync(
        path.join(
          coreRoot,
          "homeassistant/components/frontend/__init__.py"
        ),
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
