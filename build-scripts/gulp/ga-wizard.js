// GA #512: self-contained wizard build.
//
// The onboarding component vendors the wizard bundle as COMMITTED bytes and
// serves it from its own static paths on a STOCK Core. The stock Core's
// /frontend_latest belongs to the ha-frontend PyPI package, so any dynamic
// import() chunk the wizard entry emits under that URL 404s on devices
// (ha-form's field renderers never load — the account step renders no
// inputs).
//
// This task builds ONLY the greenautarky-setup entry as its own compilation
// with the publicPath moved to the onboarding component's static mount
// (/greenautarky_onboarding_static/...). The compilation's output dirs then
// contain exactly the wizard's chunk set — vendoring the WHOLE dirs is
// complete by construction, and the URLs can never collide with the stock
// Core's /frontend_latest again.
//
// (A LimitChunkCountPlugin single-chunk variant was tried first and
// OOM-killed 7-16 GB hosts — merging the wizard graph into one chunk is a
// memory bomb. Keeping normal code-splitting has the same completeness
// guarantee at the app build's proven memory profile.)

import gulp from "gulp";
import rspack from "@rspack/core";
import env from "../env.cjs";
import { createAppConfig } from "../rspack.cjs";
import "./clean.js";
import "./entry-html.js";
import "./gather-static.js";
import "./gen-icons-json.js";
import "./locale-data.js";
import "./translations.js";

// The component's aiohttp static mount (see onboarding __init__.URL_BASE).
const GA_STATIC_ROOT = "/greenautarky_onboarding_static";

const wizardConfig = (params) => {
  const conf = createAppConfig(params);
  conf.entry = {
    "greenautarky-setup": "./src/entrypoints/greenautarky-setup.ts",
  };
  conf.output = {
    ...conf.output,
    publicPath: `${GA_STATIC_ROOT}/frontend_${params.latestBuild ? "latest" : "es5"}/`,
  };
  return conf;
};

const doneHandler = (done) => (err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  if (stats.hasErrors() || stats.hasWarnings()) {
    console.log(stats.toString("minimal"));
  }
  if (done) {
    done();
  }
};

// Flavors build SEQUENTIALLY on purpose: maxChunks(1) merges the whole
// wizard module graph into one chunk per flavor, and compiling/minifying
// both flavors concurrently OOM-kills 7-16 GB hosts (observed on the
// GitHub runner AND a 16 GB laptop). One at a time fits comfortably.
gulp.task("rspack-prod-ga-wizard", async () => {
  for (const latestBuild of [true, false]) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      rspack(
        wizardConfig({
          isProdBuild: true,
          latestBuild,
          isStatsBuild: env.isStatsBuild(),
          isTestBuild: env.isTestBuild(),
        }),
        doneHandler(resolve)
      );
    });
  }
});

gulp.task(
  "build-ga-wizard",
  gulp.series(
    async function setEnv() {
      process.env.NODE_ENV = "production";
    },
    "clean",
    gulp.parallel("gen-icons-json", "build-translations", "build-locale-data"),
    "copy-static-app",
    "rspack-prod-ga-wizard",
    "gen-pages-ga-wizard-prod"
  )
);
