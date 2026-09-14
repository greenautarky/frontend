import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  GA_DOMAIN,
  GA_API_BASE,
  GA_STATIC_ROOT,
} from "../../../src/data/greenautarky_paths";

/**
 * GUARD: the GreenAutarky URL prefix must be written in exactly ONE place.
 *
 * The wizard bundle is built here and VENDORED into the greenautarky_site
 * integration, which serves it. Every URL the bundle bakes in — the rspack
 * publicPath for its own chunks, and every /api/... it fetches — has to match
 * the paths that component actually mounts:
 *
 *     URL_BASE = "/greenautarky_site_static"     (static assets)
 *     url      = "/api/greenautarky_site/..."    (every view)
 *
 * The component was renamed greenautarky_onboarding -> greenautarky_site.
 * The producer side (this repo) kept the OLD prefix in nine separate literals,
 * so every rebuild re-emitted a bundle whose asset URLs and API calls all
 * 404 — a blank wizard page, because the panel's own chunks never load.
 *
 * Two independent failure modes, so two independent halves below:
 *
 *   1. CONTRACT PIN — the one constant must equal the value the consumer
 *      serves. EXPECTED_DOMAIN is a pinned literal on purpose: deriving it
 *      from the file under test would make any wrong value self-consistent
 *      and therefore green.
 *   2. CONSISTENCY SWEEP — no source file may spell a GA path itself. This is
 *      what makes a HALF-landed rename impossible: eight call sites moving
 *      while a ninth stays put is exactly how this shipped.
 *
 * The sweep reads the LIVE tree on every run and never re-declares a copy of
 * what it checks; if the walk or the patterns stop matching anything, it
 * FAILS rather than passing over an empty set.
 */

const ROOT = path.resolve(__dirname, "../../..");

// Pinned against the consumer: `DOMAIN` / `URL_BASE` in the greenautarky_site
// integration (greenautarky-onboarding repo, src/greenautarky_site/). Change
// this only together with a released component that serves the new paths.
const EXPECTED_DOMAIN = "greenautarky_site";

// Any GA integration domain, not just the two we know about — a future
// rename to a third name has to trip this too.
const API_PATH_RE = /\/api\/(greenautarky_[a-z0-9_]+)\//g;
const STATIC_PATH_RE = /\/(greenautarky_[a-z0-9_]+)_static\b/g;

const SCAN_DIRS = ["src", "build-scripts"];
const SCAN_EXT = new Set([".ts", ".js", ".cjs", ".mjs", ".template", ".html"]);

// The one file that is ALLOWED to spell the domain: the source of truth.
const SOURCE_OF_TRUTH = path.join("src", "data", "greenautarky_domain.json");

interface Hit {
  file: string;
  domain: string;
  line: number;
  text: string;
}

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full, acc);
    } else if (entry.isFile() && SCAN_EXT.has(path.extname(entry.name))) {
      acc.push(full);
    }
  }
  return acc;
};

const scanned: string[] = [];
for (const dir of SCAN_DIRS) {
  walk(path.join(ROOT, dir), scanned);
}

const hits: Hit[] = [];
for (const file of scanned) {
  const rel = path.relative(ROOT, file);
  if (rel === SOURCE_OF_TRUTH) continue;
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((text, i) => {
    for (const re of [API_PATH_RE, STATIC_PATH_RE]) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        hits.push({ file: rel, domain: m[1], line: i + 1, text: text.trim() });
      }
    }
  });
}

describe("GreenAutarky path prefix — contract pin", () => {
  it("the single constant matches the domain the component serves", () => {
    expect(GA_DOMAIN).toBe(EXPECTED_DOMAIN);
  });

  it("derives the API base and the static root from that one domain", () => {
    expect(GA_API_BASE).toBe(`/api/${EXPECTED_DOMAIN}`);
    expect(GA_STATIC_ROOT).toBe(`/${EXPECTED_DOMAIN}_static`);
  });
});

describe("GreenAutarky path prefix — consistency sweep", () => {
  it("actually inspected the tree (coverage guard)", () => {
    // A sweep that runs over zero files is a failure, not a pass. The floor is
    // deliberately well below the real count and well above zero, so a broken
    // walk or a renamed directory goes red instead of silently green.
    expect(scanned.length, "scanned no files at all").toBeGreaterThan(100);
    expect(
      scanned.some((f) => f.endsWith(path.join("gulp", "ga-wizard.js"))),
      "the wizard build script was not among the scanned files"
    ).toBe(true);
    expect(
      scanned.some((f) =>
        f.endsWith(path.join("data", "greenautarky_setup.ts"))
      ),
      "the wizard API layer was not among the scanned files"
    ).toBe(true);
  });

  it("no source file hardcodes a GA path prefix of its own", () => {
    const offenders = hits.map(
      (h) => `${h.file}:${h.line}  (${h.domain})  ${h.text}`
    );
    expect(
      offenders,
      `GA URL prefixes must come from src/data/greenautarky_paths.ts, not be ` +
        `spelled out. Offending literals:\n  ${offenders.join("\n  ")}`
    ).toEqual([]);
  });
});
