import gaDomain from "./greenautarky_domain.json";

/**
 * The single source of truth for every GreenAutarky URL this app talks to.
 *
 * The wizard bundle built from this repo is vendored into the
 * `greenautarky_site` integration and served BY that component, so these
 * paths are a contract with it, not a local choice:
 *
 *   - assets are mounted at its `URL_BASE`  -> `/<domain>_static`
 *   - every view registers                  -> `/api/<domain>/<endpoint>`
 *
 * Both are derived from the one domain below, exactly the way the component
 * derives them, so the two can only ever be renamed together. The value lives
 * in a .json file because the gulp build needs it too (plain Node, no TS
 * transpile) — one definition, two readers, no copy to drift.
 *
 * Guarded by test/panels/greenautarky-setup/path-prefix-consistency.test.ts.
 */
export const GA_DOMAIN = gaDomain.domain;

/** Base for every GA REST call, e.g. `${GA_API_BASE}/status`. */
export const GA_API_BASE = `/api/${GA_DOMAIN}`;

/** Mount point the component serves the wizard's own chunks from. */
export const GA_STATIC_ROOT = `/${GA_DOMAIN}_static`;
