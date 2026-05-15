import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-button";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import type { GATelemetryPreferences } from "../../data/greenautarky_telemetry";
import { setGATelemetryPreferences } from "../../data/greenautarky_telemetry";
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

  protected render(): TemplateResult {
    return html`
      <div class="ga-header">
        <img
          src="/static/icons/favicon-192x192.png"
          alt="greenautarky"
          class="ga-logo"
        />
        <h1>greenautarky Telemetrie</h1>
      </div>
      <p>
        Hilf uns, greenautarky zu verbessern, indem du anonyme Nutzungsdaten
        teilst.
      </p>
      <ha-settings-row>
        <span slot="heading">Fehlerberichte (empfohlen)</span>
        <span slot="description">
          Anonyme Fehlerprotokolle helfen uns, dein Gerät am Laufen zu halten.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          Du kannst dies jederzeit deaktivieren.
        </span>
        <ha-switch
          .checked=${this._gaPrefs.error_logs}
          @change=${this._gaErrorLogsChanged}
          name="ga_error_logs"
        >
        </ha-switch>
      </ha-settings-row>
      <ha-settings-row>
        <span slot="heading">Metriken</span>
        <span slot="description">
          Detaillierte Leistungsdaten (CPU, RAM, Speicher) helfen uns dein Gerät
          zu optimieren. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung) — bitte aktiv zustimmen.
        </span>
        <ha-switch
          .checked=${this._gaPrefs.metrics}
          @change=${this._gaMetricsChanged}
          name="ga_metrics"
        >
        </ha-switch>
      </ha-settings-row>

      <div class="footer">
        <ha-button @click=${this._save}>
          ${this.localize("ui.panel.page-onboarding.analytics.finish")}
        </ha-button>
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
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-analytics": GaSetupAnalytics;
  }
}
