// GreenAutarky setup wizard — German strings (PRIMARY / authored).
//
// The wizard is German-first and self-contained (#512): it does NOT fetch a
// runtime translation fragment (stock Core would 404 it), so these tables are
// bundled into the wizard and drive the localize() function the panel passes to
// every step. Keys use the ui.panel.greenautarky_setup.<step>.<key> namespace.
//
// German is the source of truth; en.ts must keep exact key parity (guarded by
// setup-flow tests). Values may use IntlMessageFormat placeholders like {count}.

/* eslint-disable @typescript-eslint/naming-convention */
export const messages: Record<string, string> = {
  // Shared
  "ui.panel.greenautarky_setup.common.next": "Weiter",
  "ui.panel.greenautarky_setup.common.back": "Zurück",

  // Welcome
  "ui.panel.greenautarky_setup.welcome.tagline":
    "GreenAutarky KI-Butler, powered by Home Assistant",
  "ui.panel.greenautarky_setup.welcome.header":
    "Willkommen bei Ihrem KI-Butler",
  "ui.panel.greenautarky_setup.welcome.intro":
    "Lassen Sie uns Ihr Smart Home einrichten. Das dauert nur wenige Minuten.",
  "ui.panel.greenautarky_setup.welcome.cta": "Meinen KI-Butler einrichten",

  // PIN
  "ui.panel.greenautarky_setup.pin.title_device": "Geräte-PIN eingeben",
  "ui.panel.greenautarky_setup.pin.title_invite": "Einladungs-PIN eingeben",
  "ui.panel.greenautarky_setup.pin.description_device":
    "Bitte geben Sie den 6-stelligen Code ein, der auf dem Aufkleber Ihres Geräts steht.",
  "ui.panel.greenautarky_setup.pin.description_invite":
    "Bitte gib den 6-stelligen Einladungs-PIN ein, den du erhalten hast.",
  "ui.panel.greenautarky_setup.pin.checking": "Wird geprüft…",
  "ui.panel.greenautarky_setup.pin.retry_after":
    "Nächster Versuch in {seconds}s",
  "ui.panel.greenautarky_setup.pin.error_locked": "Zu viele Fehlversuche.",
  "ui.panel.greenautarky_setup.pin.error_wrong":
    "Falscher Code. Bitte prüfen Sie den Aufkleber.",
  "ui.panel.greenautarky_setup.pin.error_connection":
    "Verbindungsfehler. Bitte erneut versuchen.",

  // GDPR / Datenschutz
  "ui.panel.greenautarky_setup.gdpr.title": "Datenschutz",
  "ui.panel.greenautarky_setup.gdpr.intro_lead": "Bitte lesen Sie die",
  "ui.panel.greenautarky_setup.gdpr.privacy_policy": "Datenschutzerklärung",
  "ui.panel.greenautarky_setup.gdpr.intro_tail":
    "für den {product} und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen.",
  "ui.panel.greenautarky_setup.gdpr.processing_heading": "Datenverarbeitung",
  "ui.panel.greenautarky_setup.gdpr.processing_body":
    "Ihr {product} verarbeitet Daten lokal auf Ihrem Gerät. Persönliche Daten wie Ihr Benutzername und Ihre Konfiguration werden ausschließlich auf diesem Gerät gespeichert und nicht an externe Server übertragen, es sei denn, Sie aktivieren ausdrücklich Cloud-Dienste oder Analysen.",
  "ui.panel.greenautarky_setup.gdpr.rights_heading": "Ihre Rechte",
  "ui.panel.greenautarky_setup.gdpr.right_1":
    "Alle Daten werden lokal auf Ihrem Gerät gespeichert",
  "ui.panel.greenautarky_setup.gdpr.right_2":
    "Sie können Ihre Daten jederzeit exportieren oder löschen",
  "ui.panel.greenautarky_setup.gdpr.right_3":
    "Analysen und Diagnosen sind optional und standardmäßig deaktiviert",
  "ui.panel.greenautarky_setup.gdpr.right_4":
    "Drittanbieter-Integrationen teilen Daten nur bei ausdrücklicher Konfiguration",
  "ui.panel.greenautarky_setup.gdpr.accept_label":
    "Ich akzeptiere die Datenschutzerklärung",
  "ui.panel.greenautarky_setup.gdpr.error": "Fehler: {message}",

  // Create user
  "ui.panel.greenautarky_setup.user.title": "Benutzerkonto erstellen",
  "ui.panel.greenautarky_setup.user.subtitle":
    "Erstellen Sie ein Benutzerkonto, um Ihren KI-Butler zu verwalten.",
  "ui.panel.greenautarky_setup.user.subtitle_join":
    "Legen Sie Ihr Konto mit dem Einladungs-PIN an.",
  "ui.panel.greenautarky_setup.user.field_email": "E-Mail-Adresse",
  "ui.panel.greenautarky_setup.user.field_username": "Benutzername",
  "ui.panel.greenautarky_setup.user.field_name": "Anzeigename",
  "ui.panel.greenautarky_setup.user.field_password": "Passwort",
  "ui.panel.greenautarky_setup.user.field_password_confirm":
    "Passwort bestätigen",
  "ui.panel.greenautarky_setup.user.password_helper":
    "Wählen Sie ein sicheres Passwort. Merken Sie es sich gut, damit Sie es nicht vergessen.",
  "ui.panel.greenautarky_setup.user.toggle_no_email":
    "Ich habe keine E-Mail-Adresse",
  "ui.panel.greenautarky_setup.user.toggle_use_email":
    "E-Mail-Adresse verwenden",
  "ui.panel.greenautarky_setup.user.password_mismatch":
    "Passwörter stimmen nicht überein",
  "ui.panel.greenautarky_setup.user.consent_lead": "Bitte lesen Sie die",
  "ui.panel.greenautarky_setup.user.consent_tail":
    "und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen. Für Ihr Konto wird ein Profil ohne Standortdaten angelegt.",
  "ui.panel.greenautarky_setup.user.consent_label":
    "Ich akzeptiere die Datenschutzerklärung",
  "ui.panel.greenautarky_setup.user.submit": "Konto erstellen",
  "ui.panel.greenautarky_setup.user.pw_strength_0": "Zu schwach",
  "ui.panel.greenautarky_setup.user.pw_strength_1": "Schwach",
  "ui.panel.greenautarky_setup.user.pw_strength_2": "Ausreichend",
  "ui.panel.greenautarky_setup.user.pw_strength_3": "Gut",
  "ui.panel.greenautarky_setup.user.pw_strength_4": "Stark",
  "ui.panel.greenautarky_setup.user.pw_rule_0": "Mindestens {count} Zeichen",
  "ui.panel.greenautarky_setup.user.pw_rule_1": "Gross- und Kleinbuchstaben",
  "ui.panel.greenautarky_setup.user.pw_rule_2": "Mindestens eine Zahl",
  "ui.panel.greenautarky_setup.user.pw_rule_3": "Mindestens ein Sonderzeichen",

  // Info pages
  "ui.panel.greenautarky_setup.info_pages.header": "Ihr KI-Butler",

  // Analytics / Telemetrie
  "ui.panel.greenautarky_setup.analytics.title": "GreenAutarky Telemetrie",
  "ui.panel.greenautarky_setup.analytics.stale_banner_strong":
    "Datenschutz-Hinweis aktualisiert.",
  "ui.panel.greenautarky_setup.analytics.stale_banner_text":
    "Bitte überprüfen Sie Ihre Einstellungen — die Tier-Beschreibungen oder Rechtsgrundlagen wurden seit Ihrer letzten Zustimmung geändert.",
  "ui.panel.greenautarky_setup.analytics.intro":
    "Wir gruppieren Telemetriedaten in drei Stufen mit unterschiedlichen Rechtsgrundlagen. Sie entscheiden pro Stufe, ob wir sie verarbeiten dürfen.",
  "ui.panel.greenautarky_setup.analytics.more": "Mehr erfahren",
  "ui.panel.greenautarky_setup.analytics.done": "Fertig",

  "ui.panel.greenautarky_setup.analytics.tier0_title":
    "Betriebsnotwendige Daten",
  "ui.panel.greenautarky_setup.analytics.tier0_badge": "immer aktiv",
  "ui.panel.greenautarky_setup.analytics.tier0_desc":
    "Daten, die wir benötigen, um Ihr Gerät warten und kritische Sicherheitslücken schließen zu können — z.B. OTA-Update-Status, Kernel-Panics, fehlgeschlagene Authentifizierungen.",
  "ui.panel.greenautarky_setup.analytics.tier0_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + lit. f DSGVO (berechtigtes Interesse — IT-Sicherheit).",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_1":
    "Geräte-ID (pseudonymisiert), Firmware- und Core-Version",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_2":
    "RAUC-Update-Status (Slot, letztes Update, Roll-back-Events)",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_3":
    "Kernel-Panics und Watchdog-Resets",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_4":
    "Fehlgeschlagene SSH-/Web-Anmeldungen (zählend, ohne Klartext)",
  "ui.panel.greenautarky_setup.analytics.tier0_ex_5":
    "Supervisor-Fehler beim Starten von Add-ons",
  "ui.panel.greenautarky_setup.analytics.tier0_footnote":
    "Diese Stufe lässt sich nicht abschalten, weil ohne sie keine Updates und kein Security-Patching möglich sind. Aufbewahrung: 365 Tage in der Sicherheits-Audit-Pipeline.",

  "ui.panel.greenautarky_setup.analytics.tier1_title":
    "Fehlerberichte (empfohlen)",
  "ui.panel.greenautarky_setup.analytics.tier1_aria": "Fehlerberichte",
  "ui.panel.greenautarky_setup.analytics.tier1_desc":
    "Anonyme Fehler- und Warnprotokolle aus Home Assistant und Add-ons. Helfen uns, Bugs schnell zu finden und zu beheben.",
  "ui.panel.greenautarky_setup.analytics.tier1_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse). Sie können dies jederzeit deaktivieren.",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_1":
    "Stacktraces aus Home-Assistant-Crashes",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_2":
    "Add-on-Konflikte und Konfigurationsfehler",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_3":
    "Integration-Setup-Failures (ohne Zugangsdaten)",
  "ui.panel.greenautarky_setup.analytics.tier1_ex_4":
    "Z-Wave/Zigbee-Treiber-Fehler",
  "ui.panel.greenautarky_setup.analytics.tier1_footnote":
    "Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 90 Tage. Sie können die Verarbeitung jederzeit mit Wirkung für die Zukunft widerrufen.",

  "ui.panel.greenautarky_setup.analytics.tier2_title":
    "Detaillierte Leistungsdaten",
  "ui.panel.greenautarky_setup.analytics.tier2_aria":
    "Detaillierte Leistungsdaten",
  "ui.panel.greenautarky_setup.analytics.tier2_desc":
    "Performance-Metriken wie CPU-Last, Speicherbelegung und Netzwerklatenz im Zeitverlauf. Helfen uns, ineffiziente Konfigurationen früh zu erkennen.",
  "ui.panel.greenautarky_setup.analytics.tier2_legal":
    "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) — bitte aktiv zustimmen.",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_1":
    "CPU- und RAM-Auslastung (Minuten-Snapshots)",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_2":
    "Disk-I/O und eMMC-Wear-Indikatoren",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_3":
    "Netzwerklatenz zum Internet und zu lokalen Hubs",
  "ui.panel.greenautarky_setup.analytics.tier2_ex_4":
    "Add-on-Performance (Container-Restart-Zähler)",
  "ui.panel.greenautarky_setup.analytics.tier2_footnote":
    "Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 30 Tage. Wir verkaufen diese Daten nicht und nutzen sie nicht für Werbung.",

  "ui.panel.greenautarky_setup.analytics.policy_prefix": "Volltext:",
  "ui.panel.greenautarky_setup.analytics.policy_link":
    "GreenAutarky Datenschutzerklärung",
  "ui.panel.greenautarky_setup.analytics.policy_suffix":
    "Sie können diese Einstellungen jederzeit unter {path} ändern.",
  "ui.panel.greenautarky_setup.analytics.policy_settings_path":
    "Einstellungen → Privatsphäre",

  // Ethernet
  "ui.panel.greenautarky_setup.ethernet.header": "Netzwerk-Einstellungen",
  "ui.panel.greenautarky_setup.ethernet.intro":
    "Ihr Gerät ist standardmäßig nur über WiFi und VPN erreichbar. Möchten Sie auch die Ethernet-Verbindung aktivieren?",
  "ui.panel.greenautarky_setup.ethernet.warning":
    "Hinweis: Ethernet ermöglicht den Zugriff über das lokale Netzwerk.",
  "ui.panel.greenautarky_setup.ethernet.toggle_heading":
    "Ethernet-Verbindung aktivieren",
  "ui.panel.greenautarky_setup.ethernet.toggle_description":
    "Gerät über Ethernet im lokalen Netzwerk erreichbar machen",

  // Panel-level
  "ui.panel.greenautarky_setup.panel.error_retry":
    "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
};
