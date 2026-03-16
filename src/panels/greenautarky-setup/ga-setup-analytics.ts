import type { CSSResultGroup, TemplateResult } from "lit";
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

  @state() private _gaPrefs: GATelemetryPreferences = {
    error_logs: true,
    metrics: true,
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
      <p>Hilf uns, greenautarky zu verbessern, indem du anonyme Nutzungsdaten teilst.</p>
      <ha-settings-row>
        <span slot="heading">Fehlerberichte</span>
        <span slot="description">
          Fehlerprotokolle an greenautarky senden
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
          Systemmetriken an greenautarky senden
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

  protected firstUpdated(changedProps) {
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

  private async _save(ev) {
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
