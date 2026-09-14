import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

/**
 * Verifies that the frontend version in pyproject.toml matches
 * all version pins in the core repo. This prevents build failures
 * caused by version mismatches across repositories.
 *
 * The frontend version must be identical in 5 locations:
 *   1. homeassistant_frontend/pyproject.toml
 *   2. homeassisant_core/homeassistant/components/frontend/manifest.json
 *   3. homeassisant_core/homeassistant/package_constraints.txt
 *   4. homeassisant_core/requirements_all.txt
 *   5. homeassisant_core/requirements_test_all.txt
 */

const FRONTEND_ROOT = resolve(__dirname, "../..");
const CORE_ROOT = resolve(FRONTEND_ROOT, "../homeassisant_core");

// The core repo is a SIBLING checkout that exists on a developer machine and
// never on a CI runner, so the cross-repo pins below can only be checked
// locally. They are skipped — visibly — rather than silently asserted against
// files that are not there.
const coreExists = existsSync(CORE_ROOT);

function getFrontendVersion(): string {
  const content = readFileSync(
    resolve(FRONTEND_ROOT, "pyproject.toml"),
    "utf-8"
  );
  const match = content.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("Could not parse version from pyproject.toml");
  }
  return match[1];
}

function extractVersionFromRequirement(line: string): string | null {
  const match = line.match(/home-assistant-frontend==(.+)/);
  return match ? match[1].trim() : null;
}

describe("frontend version consistency", () => {
  const frontendVersion = getFrontendVersion();

  it("pyproject.toml has a valid version", () => {
    // Either the committed placeholder — build-ga-core.yml injects the real
    // calver at build time, and build-consistency.test.ts asserts the
    // placeholder is what is committed — or an already-injected calver.
    // Demanding the calver alone made this assertion unpassable on every
    // checkout of this repo.
    expect(frontendVersion).toMatch(/^(?:0\.0\.0\.dev0|\d{8}\.\d+)$/);
  });

  it.skipIf(!coreExists)("matches manifest.json in core", () => {
    const content = readFileSync(
      resolve(CORE_ROOT, "homeassistant/components/frontend/manifest.json"),
      "utf-8"
    );
    const manifest = JSON.parse(content);
    const req = manifest.requirements.find((r: string) =>
      r.startsWith("home-assistant-frontend==")
    );
    expect(req).toBeDefined();
    const version = extractVersionFromRequirement(req);
    expect(version).toBe(frontendVersion);
  });

  it.skipIf(!coreExists)("matches package_constraints.txt in core", () => {
    const content = readFileSync(
      resolve(CORE_ROOT, "homeassistant/package_constraints.txt"),
      "utf-8"
    );
    const line = content
      .split("\n")
      .find((l) => l.startsWith("home-assistant-frontend=="));
    expect(line).toBeDefined();
    const version = extractVersionFromRequirement(line!);
    expect(version).toBe(frontendVersion);
  });

  it.skipIf(!coreExists)("matches requirements_all.txt in core", () => {
    const content = readFileSync(
      resolve(CORE_ROOT, "requirements_all.txt"),
      "utf-8"
    );
    const line = content
      .split("\n")
      .find((l) => l.startsWith("home-assistant-frontend=="));
    expect(line).toBeDefined();
    const version = extractVersionFromRequirement(line!);
    expect(version).toBe(frontendVersion);
  });

  it.skipIf(!coreExists)("matches requirements_test_all.txt in core", () => {
    const content = readFileSync(
      resolve(CORE_ROOT, "requirements_test_all.txt"),
      "utf-8"
    );
    const line = content
      .split("\n")
      .find((l) => l.startsWith("home-assistant-frontend=="));
    expect(line).toBeDefined();
    const version = extractVersionFromRequirement(line!);
    expect(version).toBe(frontendVersion);
  });
});
