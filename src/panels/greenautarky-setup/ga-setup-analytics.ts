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
import { gaLogoIcon } from "../../onboarding/ga-branding";

@customElement("ga-setup-analytics")
class GaSetupAnalytics extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public localize!: LocalizeFunc;

  /** Whether the panel has a previous step to return to. */
  @property({ type: Boolean }) public canBack = false;

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
        ${gaLogoIcon}
        <h1>${this.localize("ui.panel.greenautarky_setup.analytics.title")}</h1>
      </div>
      ${this._consentIsStale
        ? html`
            <div class="stale-consent-banner" role="alert">
              <strong
                >${this.localize(
                  "ui.panel.greenautarky_setup.analytics.stale_banner_strong"
                )}</strong
              >
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.stale_banner_text"
              )}
            </div>
          `
        : ""}
      <p class="intro">
        ${this.localize("ui.panel.greenautarky_setup.analytics.intro")}
      </p>

      <!-- Tier 0 — Betriebsnotwendig, always-on. No toggle. -->
      <section class="tier tier-0">
        <header>
          <h2>
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier0_title"
            )}
          </h2>
          <span class="badge always-on"
            >${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier0_badge"
            )}</span
          >
        </header>
        <p class="description">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier0_desc")}
        </p>
        <p class="legal-basis">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier0_legal")}
        </p>
        <details>
          <summary>
            ${this.localize("ui.panel.greenautarky_setup.analytics.more")}
          </summary>
          <ul class="examples">
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier0_ex_1"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier0_ex_2"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier0_ex_3"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier0_ex_4"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier0_ex_5"
              )}
            </li>
          </ul>
          <p class="footnote">
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier0_footnote"
            )}
          </p>
        </details>
      </section>

      <!-- Tier 1 — Fehlerberichte, default ON (opt-out). -->
      <section class="tier tier-1">
        <header>
          <h2>
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier1_title"
            )}
          </h2>
          <ha-switch
            .checked=${this._gaPrefs.error_logs}
            @change=${this._gaErrorLogsChanged}
            name="ga_error_logs"
            aria-label=${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier1_aria"
            )}
          ></ha-switch>
        </header>
        <p class="description">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier1_desc")}
        </p>
        <p class="legal-basis">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier1_legal")}
        </p>
        <details>
          <summary>
            ${this.localize("ui.panel.greenautarky_setup.analytics.more")}
          </summary>
          <ul class="examples">
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier1_ex_1"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier1_ex_2"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier1_ex_3"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier1_ex_4"
              )}
            </li>
          </ul>
          <p class="footnote">
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier1_footnote"
            )}
          </p>
        </details>
      </section>

      <!-- Tier 2 — Detaillierte Leistungsdaten, default OFF (opt-in). -->
      <section class="tier tier-2">
        <header>
          <h2>
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier2_title"
            )}
          </h2>
          <ha-switch
            .checked=${this._gaPrefs.metrics}
            @change=${this._gaMetricsChanged}
            name="ga_metrics"
            aria-label=${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier2_aria"
            )}
          ></ha-switch>
        </header>
        <p class="description">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier2_desc")}
        </p>
        <p class="legal-basis">
          ${this.localize("ui.panel.greenautarky_setup.analytics.tier2_legal")}
        </p>
        <details>
          <summary>
            ${this.localize("ui.panel.greenautarky_setup.analytics.more")}
          </summary>
          <ul class="examples">
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier2_ex_1"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier2_ex_2"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier2_ex_3"
              )}
            </li>
            <li>
              ${this.localize(
                "ui.panel.greenautarky_setup.analytics.tier2_ex_4"
              )}
            </li>
          </ul>
          <p class="footnote">
            ${this.localize(
              "ui.panel.greenautarky_setup.analytics.tier2_footnote"
            )}
          </p>
        </details>
      </section>

      <p class="policy-link">
        ${this.localize("ui.panel.greenautarky_setup.analytics.policy_prefix")}
        <a
          href="https://greenautarky.com/datenschutz"
          target="_blank"
          rel="noopener"
          >${this.localize(
            "ui.panel.greenautarky_setup.analytics.policy_link"
          )}</a
        >.
        ${this.localize("ui.panel.greenautarky_setup.analytics.policy_suffix", {
          path: this.localize(
            "ui.panel.greenautarky_setup.analytics.policy_settings_path"
          ),
        })}
      </p>

      <div class="footer">
        ${this.canBack
          ? html`<ha-button class="back" @click=${this._back}
              >${this.localize(
                "ui.panel.greenautarky_setup.common.back"
              )}</ha-button
            >`
          : html`<span></span>`}
        <ha-button @click=${this._save}
          >${this.localize(
            "ui.panel.greenautarky_setup.analytics.done"
          )}</ha-button
        >
      </div>
    `;
  }

  private _back(): void {
    fireEvent(this, "ga-setup-back");
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
          /* --secondary-background-color is defined in both the light and dark
             HA themes (src/resources/theme/color) so the tier-0 card keeps a
             readable contrast in dark mode. The previous
             --card-background-color-elevated was defined nowhere, so its light
             #fafafa fallback always won → light-on-light, unreadable (Ahmad). */
          background: var(--secondary-background-color, #f5f5f5);
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
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
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
