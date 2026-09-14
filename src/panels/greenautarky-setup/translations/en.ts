// GreenAutarky setup wizard — English strings.
//
// Must keep EXACT key parity with de.ts (guarded by setup-flow tests).
//
// LEGAL STRINGS ARE NOT MACHINE-TRANSLATED. Every key listed in
// EN_LEGAL_REVIEW_PENDING below (GDPR / DSGVO Art. 6 legal-basis lines, consent
// wording, and data-retention statements) intentionally still holds the GERMAN
// text, verbatim from de.ts, until a lawyer signs off an English version. A
// test asserts en === de for exactly those keys, so none can be silently
// "translated" without also being taken off the pending list on purpose.

/* eslint-disable @typescript-eslint/naming-convention */
export const messages: Record<string, string> = {
  // Shared
  "ui.panel.greenautarky_setup.common.next": "Next",
  "ui.panel.greenautarky_setup.common.back": "Back",

  // Welcome
  "ui.panel.greenautarky_setup.welcome.tagline":
    "GreenAutarky KI-Butler, powered by Home Assistant",
  "ui.panel.greenautarky_setup.welcome.header": "Welcome to your KI-Butler",
  "ui.panel.greenautarky_setup.welcome.intro":
    "Let us set up your smart home. It only takes a few minutes.",
  "ui.panel.greenautarky_setup.welcome.cta": "Set up my KI-Butler",

  // PIN
  "ui.panel.greenautarky_setup.pin.title_device": "Enter device PIN",
  "ui.panel.greenautarky_setup.pin.title_invite": "Enter invitation PIN",
  "ui.panel.greenautarky_setup.pin.description_device":
    "Please enter the 6-digit code printed on the sticker of your device.",
  "ui.panel.greenautarky_setup.pin.description_invite":
    "Please enter the 6-digit invitation PIN you received.",
  "ui.panel.greenautarky_setup.pin.checking": "Checking…",
  "ui.panel.greenautarky_setup.pin.retry_after": "Next attempt in {seconds}s",
  "ui.panel.greenautarky_setup.pin.error_locked": "Too many failed attempts.",
  "ui.panel.greenautarky_setup.pin.error_wrong":
    "Wrong code. Please check the sticker.",
  "ui.panel.greenautarky_setup.pin.error_connection":
    "Connection error. Please try again.",

  // GDPR / Data protection
  "ui.panel.greenautarky_setup.gdpr.title": "Data protection",
  "ui.panel.greenautarky_setup.gdpr.intro_lead": "Please read the",
  "ui.panel.greenautarky_setup.gdpr.privacy_policy": "privacy policy",
  // LEGAL — still German, see EN_LEGAL_REVIEW_PENDING
  "ui.panel.greenautarky_setup.gdpr.intro_tail":
    "für den {product} und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen.",
  "ui.panel.greenautarky_setup.gdpr.processing_heading": "Data processing",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.gdpr.processing_body":
    "Ihr {product} verarbeitet Daten lokal auf Ihrem Gerät. Persönliche Daten wie Ihr Benutzername und Ihre Konfiguration werden ausschließlich auf diesem Gerät gespeichert und nicht an externe Server übertragen, es sei denn, Sie aktivieren ausdrücklich Cloud-Dienste oder Analysen.",
  "ui.panel.greenautarky_setup.gdpr.rights_heading": "Your rights",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.gdpr.right_1":
    "Alle Daten werden lokal auf Ihrem Gerät gespeichert",
  "ui.panel.greenautarky_setup.gdpr.right_2":
    "Sie können Ihre Daten jederzeit exportieren oder löschen",
  "ui.panel.greenautarky_setup.gdpr.right_3":
    "Analysen und Diagnosen sind optional und standardmäßig deaktiviert",
  "ui.panel.greenautarky_setup.gdpr.right_4":
    "Drittanbieter-Integrationen teilen Daten nur bei ausdrücklicher Konfiguration",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.gdpr.accept_label":
    "Ich akzeptiere die Datenschutzerklärung",
  "ui.panel.greenautarky_setup.gdpr.error": "Error: {message}",

  // Create user
  "ui.panel.greenautarky_setup.user.title": "Create user account",
  "ui.panel.greenautarky_setup.user.subtitle":
    "Create a user account to manage your KI-Butler.",
  "ui.panel.greenautarky_setup.user.subtitle_join":
    "Create your account with the invitation PIN.",
  "ui.panel.greenautarky_setup.user.field_email": "Email address",
  "ui.panel.greenautarky_setup.user.field_username": "Username",
  "ui.panel.greenautarky_setup.user.field_name": "Display name",
  "ui.panel.greenautarky_setup.user.field_password": "Password",
  "ui.panel.greenautarky_setup.user.field_password_confirm": "Confirm password",
  "ui.panel.greenautarky_setup.user.password_helper":
    "Choose a secure password. Remember it well so you do not forget it.",
  "ui.panel.greenautarky_setup.user.toggle_no_email":
    "I do not have an email address",
  "ui.panel.greenautarky_setup.user.toggle_use_email": "Use an email address",
  "ui.panel.greenautarky_setup.user.password_mismatch":
    "Passwords do not match",
  "ui.panel.greenautarky_setup.user.consent_lead": "Please read the",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.user.consent_tail":
    "und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen. Für Ihr Konto wird ein Profil ohne Standortdaten angelegt.",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.user.consent_label":
    "Ich akzeptiere die Datenschutzerklärung",
  "ui.panel.greenautarky_setup.user.submit": "Create account",
  "ui.panel.greenautarky_setup.user.pw_strength_0": "Too weak",
  "ui.panel.greenautarky_setup.user.pw_strength_1": "Weak",
  "ui.panel.greenautarky_setup.user.pw_strength_2": "Acceptable",
  "ui.panel.greenautarky_setup.user.pw_strength_3": "Good",
  "ui.panel.greenautarky_setup.user.pw_strength_4": "Strong",
  "ui.panel.greenautarky_setup.user.pw_rule_0": "At least {count} characters",
  "ui.panel.greenautarky_setup.user.pw_rule_1": "Upper- and lowercase letters",
  "ui.panel.greenautarky_setup.user.pw_rule_2": "At least one digit",
  "ui.panel.greenautarky_setup.user.pw_rule_3":
    "At least one special character",

  // Info pages
  "ui.panel.greenautarky_setup.info_pages.header": "Your KI-Butler",

  // Analytics / Telemetry
  "ui.panel.greenautarky_setup.analytics.title": "GreenAutarky telemetry",
  "ui.panel.greenautarky_setup.analytics.stale_banner_strong":
    "Privacy notice updated.",
  "ui.panel.greenautarky_setup.analytics.stale_banner_text":
    "Please review your settings — the tier descriptions or legal bases have changed since your last consent.",
  "ui.panel.greenautarky_setup.analytics.intro":
    "We group telemetry data into three tiers with different legal bases. You decide, per tier, whether we may process it.",
  "ui.panel.greenautarky_setup.analytics.more": "Learn more",
  "ui.panel.greenautarky_setup.analytics.done": "Done",

  "ui.panel.greenautarky_setup.analytics.tier0_title": "Operationally required data",
  "ui.panel.greenautarky_setup.analytics.tier0_badge": "always on",
  "ui.panel.greenautarky_setup.analytics.tier0_desc":
    "Data we need to maintain your device and close critical security holes — e.g. OTA update status, kernel panics, failed authentications.",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier0_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + lit. f DSGVO (berechtigtes Interesse — IT-Sicherheit).",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_1":
    "Device ID (pseudonymized), firmware and Core version",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_2":
    "RAUC update status (slot, last update, roll-back events)",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_3":
    "Kernel panics and watchdog resets",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_4":
    "Failed SSH/web logins (counted, without plaintext)",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_5":
    "Supervisor errors when starting add-ons",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier0_footnote":
    "Diese Stufe lässt sich nicht abschalten, weil ohne sie keine Updates und kein Security-Patching möglich sind. Aufbewahrung: 365 Tage in der Sicherheits-Audit-Pipeline.",

  "ui.panel.greenautarky_setup.analytics.tier1_title":
    "Error reports (recommended)",
  "ui.panel.greenautarky_setup.analytics.tier1_aria": "Error reports",
  "ui.panel.greenautarky_setup.analytics.tier1_desc":
    "Anonymous error and warning logs from Home Assistant and add-ons. They help us find and fix bugs quickly.",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier1_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse). Sie können dies jederzeit deaktivieren.",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_1":
    "Stack traces from Home Assistant crashes",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_2":
    "Add-on conflicts and configuration errors",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_3":
    "Integration setup failures (without credentials)",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_4":
    "Z-Wave/Zigbee driver errors",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier1_footnote":
    "Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 90 Tage. Sie können die Verarbeitung jederzeit mit Wirkung für die Zukunft widerrufen.",

  "ui.panel.greenautarky_setup.analytics.tier2_title":
    "Detailed performance data",
  "ui.panel.greenautarky_setup.analytics.tier2_aria":
    "Detailed performance data",
  "ui.panel.greenautarky_setup.analytics.tier2_desc":
    "Performance metrics such as CPU load, memory usage and network latency over time. They help us spot inefficient configurations early.",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier2_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) — bitte aktiv zustimmen.",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_1":
    "CPU and RAM usage (minute snapshots)",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_2":
    "Disk I/O and eMMC wear indicators",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_3":
    "Network latency to the internet and to local hubs",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_4":
    "Add-on performance (container restart counter)",
  // LEGAL — still German
  "ui.panel.greenautarky_setup.analytics.tier2_footnote":
    "Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 30 Tage. Wir verkaufen diese Daten nicht und nutzen sie nicht für Werbung.",

  "ui.panel.greenautarky_setup.analytics.policy_prefix": "Full text:",
  "ui.panel.greenautarky_setup.analytics.policy_link":
    "GreenAutarky privacy policy",
  "ui.panel.greenautarky_setup.analytics.policy_suffix":
    "You can change these settings at any time under {path}.",
  "ui.panel.greenautarky_setup.analytics.policy_settings_path":
    "Settings → Privacy",

  // Ethernet
  "ui.panel.greenautarky_setup.ethernet.header": "Network settings",
  "ui.panel.greenautarky_setup.ethernet.intro":
    "By default your device is only reachable over WiFi and VPN. Would you like to enable the Ethernet connection as well?",
  "ui.panel.greenautarky_setup.ethernet.warning":
    "Note: Ethernet allows access over the local network.",
  "ui.panel.greenautarky_setup.ethernet.toggle_heading":
    "Enable Ethernet connection",
  "ui.panel.greenautarky_setup.ethernet.toggle_description":
    "Make the device reachable over Ethernet on the local network",

  // Panel-level
  "ui.panel.greenautarky_setup.panel.error_retry":
    "Something went wrong. Please try again.",
};

// Keys whose English value is deliberately still the German original, pending a
// lawyer's review. Enforced by a test (en === de for each) so legal text is
// never silently machine-translated. Listed in the PR body for legal sign-off.
export const EN_LEGAL_REVIEW_PENDING: string[] = [
  "ui.panel.greenautarky_setup.gdpr.intro_tail",
  "ui.panel.greenautarky_setup.gdpr.processing_body",
  "ui.panel.greenautarky_setup.gdpr.right_1",
  "ui.panel.greenautarky_setup.gdpr.right_2",
  "ui.panel.greenautarky_setup.gdpr.right_3",
  "ui.panel.greenautarky_setup.gdpr.right_4",
  "ui.panel.greenautarky_setup.gdpr.accept_label",
  "ui.panel.greenautarky_setup.user.consent_tail",
  "ui.panel.greenautarky_setup.user.consent_label",
  "ui.panel.greenautarky_setup.analytics.tier0_legal",
  "ui.panel.greenautarky_setup.analytics.tier0_footnote",
  "ui.panel.greenautarky_setup.analytics.tier1_legal",
  "ui.panel.greenautarky_setup.analytics.tier1_footnote",
  "ui.panel.greenautarky_setup.analytics.tier2_legal",
  "ui.panel.greenautarky_setup.analytics.tier2_footnote",
];
