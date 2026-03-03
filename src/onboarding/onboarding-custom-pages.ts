import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import type { LocalizeFunc } from "../common/translations/localize";
import "../components/ha-button";
import { onboardCustomPagesStep } from "../data/onboarding";
import type { HomeAssistant } from "../types";
import { onBoardingStyles } from "./styles";
import { gaBrandingStyles } from "./ga-branding";

// Import custom page component.
import "./custom-pages/page-info";

@customElement("onboarding-custom-pages")
class OnboardingCustomPages extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public localize!: LocalizeFunc;

  @state() private _error?: string;

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">Dein KI-Butler</h1>

      <div class="page-content">
        <onboarding-page-info></onboarding-page-info>
      </div>

      ${this._error ? html`<div class="error">${this._error}</div>` : ""}

      <div class="footer">
        <ha-button unelevated @click=${this._finish}>Weiter</ha-button>
      </div>
    `;
  }

  private async _finish(): Promise<void> {
    try {
      await onboardCustomPagesStep(this.hass);
      fireEvent(this, "onboarding-step", {
        type: "custom_pages",
      });
    } catch (err: any) {
      this._error = `Failed to save: ${err.message}`;
    }
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      gaBrandingStyles,
      css`
        .page-content {
          min-height: 200px;
        }
        .error {
          color: var(--error-color);
          margin-bottom: 16px;
        }
        .footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "onboarding-custom-pages": OnboardingCustomPages;
  }
}
