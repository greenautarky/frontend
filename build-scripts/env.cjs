const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const paths = require("./paths.cjs");

const isTrue = (value) => value === "1" || value?.toLowerCase() === "true";

module.exports = {
  isProdBuild() {
    return (
      process.env.NODE_ENV === "production" || module.exports.isStatsBuild()
    );
  },
  isStatsBuild() {
    return isTrue(process.env.STATS);
  },
  isTestBuild() {
    return isTrue(process.env.IS_TEST);
  },
  isNetlify() {
    return isTrue(process.env.NETLIFY);
  },
  version() {
    const text = fs.readFileSync(
      path.resolve(paths.root_dir, "pyproject.toml"),
      "utf8"
    );
    const calver = text.match(/version\W+=\W"(\d{8}\.\d(?:\.dev)?)"/);
    if (calver) {
      return calver[1];
    }
    // Fall back to the un-injected dev placeholder. build-ga-core.yml
    // rewrites pyproject.toml's "0.0.0.dev0" to a real CalVer version
    // before building; local dev / lint-staged runs against the
    // unsubstituted file and should not crash here.
    if (/version\W+=\W"0\.0\.0\.dev0"/.test(text)) {
      return "0.0.0.dev0";
    }
    throw Error("Version not found");
  },
  isDevContainer() {
    return isTrue(process.env.DEV_CONTAINER);
  },
  gitHash() {
    try {
      return execSync("git rev-parse --short HEAD", {
        encoding: "utf-8",
      }).trim();
    } catch {
      return "unknown";
    }
  },
};
