import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-button";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import type { GATelemetryPreferences } from "../../data/greenautarky_telemetry";
import {
  getGATelemetryPreferences,
  setGATelemetryPreferences,
} from "../../data/greenautarky_telemetry";
import type { HomeAssistant } from "../../types";
import { onBoardingStyles } from "../../onboarding/styles";

@customElement("ga-setup-analytics")
class GaSetupAnalytics extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public localize!: LocalizeFunc;

  // Privacy Tier defaults — see ga-ihost-docs/PRIVACY_TIERS.md.
  // Tier 1 (Fehlerberichte / berechtigtes Interesse, Art. 6 (f) DSGVO):
  //   default ON, operator can opt out anytime.
  // Tier 2 (Metriken / Einwilligung, Art. 6 (a) DSGVO):
  //   default OFF, requires explicit user consent.
  // Tier 0 (Vertragserfüllung) is not shown — always-on at the OS layer.
  @state() private _gaPrefs: GATelemetryPreferences = {
    error_logs: true,
    metrics: false,
  };

  // Phase E — re-consent prompt when the OS policy version has bumped
  // past what the user previously accepted. Computed from the backend's
  // derived `consent_is_stale` flag (which is false for fresh devices,
  // true only for "consent given under an older policy"). See
  // ga-ihost-docs/PRIVACY_TIERS.md § Versioning.
  @state() private _consentIsStale = false;

  protected render(): TemplateResult {
    // Phase F — full consent UI redesign. Three sections (Tier 0
    // always-on, Tier 1 default-ON, Tier 2 default-OFF), each with a
    // plain-language description, an explicit DSGVO legal-basis line,
    // example data items, and a "Mehr erfahren" disclosure for the
    // full text. Tier 3 (per-incident debug snapshots) is intentionally
    // absent from onboarding — it's triggered case-by-case through the
    // operator UI. See ga-ihost-docs/PRIVACY_TIERS.md.
    return html`
      <div class="ga-header">
        <img
          src="/static/icons/favicon-192x192.png"
          alt="greenautarky"
          class="ga-logo"
        />
        <h1>greenautarky Telemetrie</h1>
      </div>
      ${this._consentIsStale
        ? html`
            <div class="stale-consent-banner" role="alert">
              <strong>Datenschutz-Hinweis aktualisiert.</strong> Bitte überprüfen
              Sie Ihre Einstellungen — die Tier-Beschreibungen oder
              Rechtsgrundlagen wurden seit Ihrer letzten Zustimmung geändert.
            </div>
          `
        : ""}
      <p class="intro">
        Wir gruppieren Telemetriedaten in drei Stufen mit unterschiedlichen
        Rechtsgrundlagen. Sie entscheiden pro Stufe, ob wir sie verarbeiten
        dürfen.
      </p>

      <!-- Tier 0 — Betriebsnotwendig, always-on. No toggle. -->
      <section class="tier tier-0">
        <header>
          <h2>Betriebsnotwendige Daten</h2>
          <span class="badge always-on">immer aktiv</span>
        </header>
        <p class="description">
          Daten, die wir benötigen, um Ihr Gerät warten und kritische
          Sicherheitslücken schließen zu können — z.B. OTA-Update-Status,
          Kernel-Panics, fehlgeschlagene Authentifizierungen.
        </p>
        <p class="legal-basis">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + lit.
          f DSGVO (berechtigtes Interesse — IT-Sicherheit).
        </p>
        <details>
          <summary>Mehr erfahren</summary>
          <ul class="examples">
            <li>Geräte-ID (pseudonymisiert), Firmware- und Core-Version</li>
            <li>RAUC-Update-Status (Slot, letztes Update, Roll-back-Events)</li>
            <li>Kernel-Panics und Watchdog-Resets</li>
            <li>
              Fehlgeschlagene SSH-/Web-Anmeldungen (zählend, ohne Klartext)
            </li>
            <li>Supervisor-Fehler beim Starten von Add-ons</li>
          </ul>
          <p class="footnote">
            Diese Stufe lässt sich nicht abschalten, weil ohne sie keine Updates
            und kein Security-Patching möglich sind. Aufbewahrung: 365 Tage in
            der Sicherheits-Audit-Pipeline.
          </p>
        </details>
      </section>

      <!-- Tier 1 — Fehlerberichte, default ON (opt-out). -->
      <section class="tier tier-1">
        <header>
          <h2>Fehlerberichte (empfohlen)</h2>
          <ha-switch
            .checked=${this._gaPrefs.error_logs}
            @change=${this._gaErrorLogsChanged}
            name="ga_error_logs"
            aria-label="Fehlerberichte"
          ></ha-switch>
        </header>
        <p class="description">
          Anonyme Fehler- und Warnprotokolle aus Home Assistant und Add-ons.
          Helfen uns, Bugs schnell zu finden und zu beheben.
        </p>
        <p class="legal-basis">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          Sie können dies jederzeit deaktivieren.
        </p>
        <details>
          <summary>Mehr erfahren</summary>
          <ul class="examples">
            <li>Stacktraces aus Home-Assistant-Crashes</li>
            <li>Add-on-Konflikte und Konfigurationsfehler</li>
            <li>Integration-Setup-Failures (ohne Zugangsdaten)</li>
            <li>Z-Wave/Zigbee-Treiber-Fehler</li>
          </ul>
          <p class="footnote">
            Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 90 Tage. Sie können
            die Verarbeitung jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
        </details>
      </section>

      <!-- Tier 2 — Detaillierte Leistungsdaten, default OFF (opt-in). -->
      <section class="tier tier-2">
        <header>
          <h2>Detaillierte Leistungsdaten</h2>
          <ha-switch
            .checked=${this._gaPrefs.metrics}
            @change=${this._gaMetricsChanged}
            name="ga_metrics"
            aria-label="Detaillierte Leistungsdaten"
          ></ha-switch>
        </header>
        <p class="description">
          Performance-Metriken wie CPU-Last, Speicherbelegung und Netzwerklatenz
          im Zeitverlauf. Helfen uns, ineffiziente Konfigurationen früh zu
          erkennen.
        </p>
        <p class="legal-basis">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) — bitte
          aktiv zustimmen.
        </p>
        <details>
          <summary>Mehr erfahren</summary>
          <ul class="examples">
            <li>CPU- und RAM-Auslastung (Minuten-Snapshots)</li>
            <li>Disk-I/O und eMMC-Wear-Indikatoren</li>
            <li>Netzwerklatenz zum Internet und zu lokalen Hubs</li>
            <li>Add-on-Performance (Container-Restart-Zähler)</li>
          </ul>
          <p class="footnote">
            Anonymisiert über Ihre Geräte-ID. Aufbewahrung: 30 Tage. Wir
            verkaufen diese Daten nicht und nutzen sie nicht für Werbung.
          </p>
        </details>
      </section>

      <p class="policy-link">
        Volltext:
        <a
          href="https://greenautarky.com/datenschutz"
          target="_blank"
          rel="noopener"
          >greenautarky Datenschutzerklärung</a
        >. Sie können diese Einstellungen jederzeit unter
        <em>Einstellungen → Privatsphäre</em> ändern.
      </p>

      <div class="footer">
        <ha-button @click=${this._save}>Fertig</ha-button>
      </div>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this.addEventListener("keypress", (ev) => {
      if (ev.key === "Enter") {
        this._save(ev);
      }
    });
    this._loadStaleness();
  }

  // Best-effort fetch of the current consent state to detect a stale
  // policy_version_accepted. Errors are swallowed — the panel keeps the
  // tier defaults if the backend isn't reachable yet (e.g. mid-onboarding
  // before non-admin users have WS permission).
  private async _loadStaleness(): Promise<void> {
    try {
      const resp = await getGATelemetryPreferences(this.hass);
      this._consentIsStale = !!resp.consent_is_stale;
    } catch (_err) {
      // Non-fatal: surface no banner if we can't read state
    }
  }

  private _gaErrorLogsChanged(ev: Event): void {
    const target = ev.currentTarget as HTMLInputElement;
    this._gaPrefs = { ...this._gaPrefs, error_logs: target.checked };
  }

  private _gaMetricsChanged(ev: Event): void {
    const target = ev.currentTarget as HTMLInputElement;
    this._gaPrefs = { ...this._gaPrefs, metrics: target.checked };
  }

  private async _save(ev: Event) {
    ev.preventDefault();
    // GA telemetry — best effort (non-admin users may not have WS permission yet)
    try {
      await setGATelemetryPreferences(this.hass, this._gaPrefs);
    } catch (_err) {
      // Proceed regardless — preferences can be saved later
    }
    fireEvent(this, "ga-setup-step", { type: "analytics" });
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      css`
        .ga-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .ga-header h1 {
          margin: 0;
        }
        .ga-logo {
          width: 32px;
          height: 32px;
          border-radius: 4px;
        }
        ha-settings-row {
          padding: 0;
        }
        .stale-consent-banner {
          background: var(--warning-color, #ffa726);
          color: var(--text-primary-color, #fff);
          padding: 12px 16px;
          border-radius: 6px;
          margin: 8px 0 16px;
          font-size: 14px;
          line-height: 1.4;
        }
        .stale-consent-banner strong {
          display: block;
          margin-bottom: 4px;
        }
        .intro {
          color: var(--secondary-text-color, #666);
          margin-bottom: 16px;
        }
        .tier {
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .tier-0 {
          background: var(--card-background-color-elevated, #fafafa);
        }
        .tier header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .tier h2 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 500;
        }
        .badge.always-on {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .description {
          margin: 0 0 6px;
        }
        .legal-basis {
          margin: 0 0 8px;
          color: var(--secondary-text-color, #666);
          font-size: 0.875rem;
        }
        details {
          margin-top: 4px;
        }
        details summary {
          cursor: pointer;
          color: var(--primary-color, #03a9f4);
          font-size: 0.875rem;
          user-select: none;
        }
        .examples {
          margin: 8px 0 4px 0;
          padding-left: 20px;
          font-size: 0.875rem;
        }
        .examples li {
          margin-bottom: 2px;
        }
        .footnote {
          font-size: 0.8rem;
          color: var(--secondary-text-color, #666);
          margin: 8px 0 0;
        }
        .policy-link {
          font-size: 0.875rem;
          color: var(--secondary-text-color, #666);
          margin: 16px 0 8px;
        }
        .policy-link a {
          color: var(--primary-color, #03a9f4);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-analytics": GaSetupAnalytics;
  }
}
