import "../auth/ha-authorize";

import("../resources/append-ha-style");

// GA onboarding pre-check: redirect to setup wizard if not yet complete.
// Admin bypass: ?ga_bypass=1 skips this check.
(async () => {
  if (new URLSearchParams(location.search).get("ga_bypass") === "1") return;
  try {
    const r = await fetch("/api/greenautarky_onboarding/status", {
      credentials: "include",
    });
    if (r.ok) {
      const d = await r.json();
      if (!d.completed) {
        try {
          sessionStorage.setItem("ga_auth_redirect", location.href);
        } catch (_) {
          // sessionStorage not available
        }
        location.replace("/greenautarky-setup.html");
      }
    }
  } catch (_) {
    // GA onboarding integration not installed — show normal auth
  }
})();
