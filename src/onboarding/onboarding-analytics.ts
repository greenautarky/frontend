import { mdiOpenInNew } from "@mdi/js";
import type { CSSResultGroup, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import type { LocalizeFunc } from "../common/translations/localize";
import "../components/ha-analytics";
import "../components/ha-button";
import "../components/ha-settings-row";
import "../components/ha-switch";
import "../components/ha-svg-icon";
import type { Analytics } from "../data/analytics";
import { setAnalyticsPreferences } from "../data/analytics";
import type { GATelemetryPreferences } from "../data/greenautarky_telemetry";
import { setGATelemetryPreferences } from "../data/greenautarky_telemetry";
import { onboardAnalyticsStep } from "../data/onboarding";
import type { HomeAssistant } from "../types";
import { documentationUrl } from "../util/documentation-url";
import { onBoardingStyles } from "./styles";

@customElement("onboarding-analytics")
class OnboardingAnalytics extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public localize!: LocalizeFunc;

  @state() private _error?: string;

  @state() private _analyticsDetails: Analytics = {
    preferences: {},
  };

  @state() private _gaPrefs: GATelemetryPreferences = {
    error_logs: true,
    metrics: true,
  };

  protected render(): TemplateResult {
    return html`
      <h1>${this.localize("ui.panel.page-onboarding.analytics.header")}</h1>
      <p>${this.localize("ui.panel.page-onboarding.analytics.intro")}</p>
      <p>
        <a
          href=${documentationUrl(this.hass, "/integrations/analytics/")}
          target="_blank"
          rel="noreferrer"
        >
          ${this.localize("ui.panel.page-onboarding.analytics.learn_more")}
          <ha-svg-icon .path=${mdiOpenInNew}></ha-svg-icon>
        </a>
      </p>
      <ha-analytics
        translation_key_panel="page-onboarding"
        @analytics-preferences-changed=${this._preferencesChanged}
        .localize=${this.localize}
        .analytics=${this._analyticsDetails}
      >
      </ha-analytics>

      <div class="ga-section">
        <div class="ga-header">
          <img
            src="/static/icons/favicon-192x192.png"
            alt="greenautarky"
            class="ga-logo"
          />
          <h2>greenautarky Telemetrie</h2>
        </div>
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
      </div>

      ${this._error ? html`<div class="error">${this._error}</div>` : ""}
      <div class="footer">
        <ha-button @click=${this._save} .disabled=${!this._analyticsDetails}>
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

  private _preferencesChanged(event: CustomEvent): void {
    this._analyticsDetails = {
      ...this._analyticsDetails!,
      preferences: event.detail.preferences,
    };
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
    try {
      await setAnalyticsPreferences(
        this.hass,
        this._analyticsDetails!.preferences
      );

      await setGATelemetryPreferences(this.hass, this._gaPrefs);

      await onboardAnalyticsStep(this.hass);
      fireEvent(this, "onboarding-step", {
        type: "analytics",
      });
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      css`
        .error {
          color: var(--error-color);
        }
        a {
          color: var(--primary-color);
          text-decoration: none;
          --mdc-icon-size: 14px;
        }
        .ga-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--divider-color);
        }
        .ga-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .ga-header h2 {
          margin: 0;
          font-size: var(--ha-font-size-xl);
          font-weight: var(--ha-font-weight-normal);
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
    "onboarding-analytics": OnboardingAnalytics;
  }
}
