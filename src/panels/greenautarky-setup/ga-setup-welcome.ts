import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import type { LocalizeFunc } from "../../common/translations/localize";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-button";
import { onBoardingStyles } from "../../onboarding/styles";
import {
  gaLogoLockup,
  gaBrandingStyles,
  GA_WELCOME_HEADER,
  GA_WELCOME_INTRO,
} from "../../onboarding/ga-branding";

@customElement("ga-setup-welcome")
class GaSetupWelcome extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  protected render(): TemplateResult {
    return html`
      <div class="brand-block">
        ${gaLogoLockup}
        <p class="brand-tagline">
          <strong>GreenAutarky KI-Butler</strong>, powered by Home Assistant
        </p>
      </div>

      <h1 class="ga-header">${GA_WELCOME_HEADER}</h1>
      <p>${GA_WELCOME_INTRO}</p>

      <ha-button @click=${this._start} class="start" unelevated>
        Meinen KI-Butler einrichten
      </ha-button>
    `;
  }

  private _start(): void {
    fireEvent(this, "ga-setup-step", {
      type: "welcome",
    });
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      gaBrandingStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        h1 {
          margin-top: 16px;
          margin-bottom: 8px;
        }
        p {
          margin: 0;
        }
        .start {
          margin: 32px 0;
          width: 100%;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-welcome": GaSetupWelcome;
  }
}
