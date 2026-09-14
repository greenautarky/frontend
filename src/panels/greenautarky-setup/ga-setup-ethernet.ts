import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-button";
import "../../components/ha-settings-row";
import "../../components/ha-switch";
import { setEthernetPreference } from "../../data/greenautarky_setup";
import { onBoardingStyles } from "../../onboarding/styles";
import { gaLogoIcon } from "../../onboarding/ga-branding";

@customElement("ga-setup-ethernet")
class GaSetupEthernet extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  /** Whether the panel has a previous step to return to. */
  @property({ type: Boolean }) public canBack = false;

  @state() private _enableEthernet = false;

  protected render(): TemplateResult {
    return html`
      <div class="ga-header">
        ${gaLogoIcon}
        <h1>${this.localize("ui.panel.greenautarky_setup.ethernet.header")}</h1>
      </div>
      <p>${this.localize("ui.panel.greenautarky_setup.ethernet.intro")}</p>
      <div class="warning">
        ${this.localize("ui.panel.greenautarky_setup.ethernet.warning")}
      </div>
      <ha-settings-row>
        <span slot="heading"
          >${this.localize(
            "ui.panel.greenautarky_setup.ethernet.toggle_heading"
          )}</span
        >
        <span slot="description">
          ${this.localize(
            "ui.panel.greenautarky_setup.ethernet.toggle_description"
          )}
        </span>
        <ha-switch
          .checked=${this._enableEthernet}
          @change=${this._ethernetChanged}
          name="enable_ethernet"
        >
        </ha-switch>
      </ha-settings-row>

      <div class="footer">
        ${this.canBack
          ? html`<ha-button class="back" @click=${this._back}
              >${this.localize(
                "ui.panel.greenautarky_setup.common.back"
              )}</ha-button
            >`
          : html`<span></span>`}
        <ha-button @click=${this._save}>
          ${this.localize("ui.panel.greenautarky_setup.common.next")}
        </ha-button>
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
  }

  private _ethernetChanged(ev: Event): void {
    const target = ev.currentTarget as HTMLInputElement;
    this._enableEthernet = target.checked;
  }

  private async _save(ev: Event) {
    ev.preventDefault();
    try {
      await setEthernetPreference(this._enableEthernet);
    } catch (_err) {
      // Proceed regardless — preference can be changed later
    }
    fireEvent(this, "ga-setup-step", { type: "ethernet" });
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
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 12px;
          margin: 12px 0;
          font-size: 14px;
          color: #856404;
        }
        ha-settings-row {
          padding: 0;
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
    "ga-setup-ethernet": GaSetupEthernet;
  }
}
