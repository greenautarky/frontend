import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-button";
import { onBoardingStyles } from "../../onboarding/styles";
import { gaBrandingStyles } from "../../onboarding/ga-branding";
import "../../onboarding/custom-pages/page-info";

@customElement("ga-setup-info-pages")
class GaSetupInfoPages extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  /** Whether the panel has a previous step to return to. */
  @property({ type: Boolean }) public canBack = false;

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">
        ${this.localize("ui.panel.greenautarky_setup.info_pages.header")}
      </h1>

      <div class="page-content">
        <onboarding-page-info></onboarding-page-info>
      </div>

      <div class="footer">
        ${this.canBack
          ? html`<ha-button class="back" @click=${this._back}
              >${this.localize(
                "ui.panel.greenautarky_setup.common.back"
              )}</ha-button
            >`
          : html`<span></span>`}
        <ha-button unelevated @click=${this._finish}
          >${this.localize(
            "ui.panel.greenautarky_setup.common.next"
          )}</ha-button
        >
      </div>
    `;
  }

  private _finish(): void {
    fireEvent(this, "ga-setup-step", {
      type: "info_pages",
    });
  }

  private _back(): void {
    fireEvent(this, "ga-setup-back");
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      gaBrandingStyles,
      css`
        .page-content {
          min-height: 200px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-info-pages": GaSetupInfoPages;
  }
}
