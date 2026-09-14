import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-button";
import "../../components/ha-checkbox";
import "../../components/ha-formfield";
import { acceptGASetupGDPR } from "../../data/greenautarky_setup";
import { onBoardingStyles } from "../../onboarding/styles";
import { gaBrandingStyles, GA_PRODUCT_NAME } from "../../onboarding/ga-branding";

@customElement("ga-setup-gdpr")
class GaSetupGdpr extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  /** Whether the panel has a previous step to return to (drives the back
   * button). The panel clears it when back would cross a gate. */
  @property({ type: Boolean }) public canBack = false;

  @state() private _accepted = false;

  @state() private _error?: string;

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">
        ${this.localize("ui.panel.greenautarky_setup.gdpr.title")}
      </h1>
      <p>
        ${this.localize("ui.panel.greenautarky_setup.gdpr.intro_lead")}
        <a
          href="https://greenautarky.com/datenschutz"
          target="_blank"
          rel="noopener"
          >${this.localize(
            "ui.panel.greenautarky_setup.gdpr.privacy_policy"
          )}</a
        >
        ${this.localize("ui.panel.greenautarky_setup.gdpr.intro_tail", {
          product: GA_PRODUCT_NAME,
        })}
      </p>

      <div class="gdpr-content">
        <h2>
          ${this.localize(
            "ui.panel.greenautarky_setup.gdpr.processing_heading"
          )}
        </h2>
        <p>
          ${this.localize("ui.panel.greenautarky_setup.gdpr.processing_body", {
            product: GA_PRODUCT_NAME,
          })}
        </p>

        <h2>
          ${this.localize("ui.panel.greenautarky_setup.gdpr.rights_heading")}
        </h2>
        <ul>
          <li>${this.localize("ui.panel.greenautarky_setup.gdpr.right_1")}</li>
          <li>${this.localize("ui.panel.greenautarky_setup.gdpr.right_2")}</li>
          <li>${this.localize("ui.panel.greenautarky_setup.gdpr.right_3")}</li>
          <li>${this.localize("ui.panel.greenautarky_setup.gdpr.right_4")}</li>
        </ul>
      </div>

      <ha-formfield
        .label=${this.localize(
          "ui.panel.greenautarky_setup.gdpr.accept_label"
        )}
      >
        <ha-checkbox
          @change=${this._acceptChanged}
          .checked=${this._accepted}
        ></ha-checkbox>
      </ha-formfield>

      ${this._error ? html`<div class="error">${this._error}</div>` : ""}

      <div class="footer">
        ${this.canBack
          ? html`<ha-button class="back" @click=${this._back}
              >${this.localize(
                "ui.panel.greenautarky_setup.common.back"
              )}</ha-button
            >`
          : html`<span></span>`}
        <ha-button
          unelevated
          @click=${this._continue}
          .disabled=${!this._accepted}
        >
          ${this.localize("ui.panel.greenautarky_setup.common.next")}
        </ha-button>
      </div>
    `;
  }

  private _back(): void {
    fireEvent(this, "ga-setup-back");
  }

  private _acceptChanged(ev: Event): void {
    this._accepted = (ev.target as HTMLInputElement).checked;
  }

  private async _continue(): Promise<void> {
    if (!this._accepted) {
      return;
    }
    try {
      await acceptGASetupGDPR();
      fireEvent(this, "ga-setup-step", {
        type: "gdpr",
      });
    } catch (err: any) {
      this._error = this.localize("ui.panel.greenautarky_setup.gdpr.error", {
        message: err.message,
      });
    }
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      gaBrandingStyles,
      css`
        .gdpr-content {
          background: var(--card-background-color, #f5f5f5);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          max-height: 300px;
          overflow-y: auto;
          font-size: 0.9rem;
        }
        .gdpr-content h2 {
          font-size: 1rem;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .gdpr-content h2:first-child {
          margin-top: 0;
        }
        .gdpr-content ul {
          padding-left: 20px;
          margin: 8px 0;
        }
        .gdpr-content li {
          margin-bottom: 4px;
        }
        ha-formfield {
          display: block;
          margin-bottom: 16px;
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
    "ga-setup-gdpr": GaSetupGdpr;
  }
}
