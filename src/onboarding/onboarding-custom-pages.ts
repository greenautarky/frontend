import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import type { LocalizeFunc } from "../common/translations/localize";
import "../components/ha-button";
import { onboardCustomPagesStep } from "../data/onboarding";
import type { HomeAssistant } from "../types";
import { onBoardingStyles } from "./styles";
import { gaBrandingStyles } from "./ga-branding";

// Import all custom pages here.
// To add a new page: create a file in custom-pages/, import it, and add its
// tag name to the PAGES array below.
import "./custom-pages/page-info";
import "./custom-pages/page-help";

interface CustomPage {
  tag: string;
  title: string;
}

/** Ordered list of custom pages to display. */
const PAGES: CustomPage[] = [
  { tag: "onboarding-page-info", title: "Ueber dein Geraet" },
  { tag: "onboarding-page-help", title: "Erste Schritte" },
];

@customElement("onboarding-custom-pages")
class OnboardingCustomPages extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public localize!: LocalizeFunc;

  @state() private _pageIndex = 0;

  @state() private _error?: string;

  protected render(): TemplateResult {
    const page = PAGES[this._pageIndex];
    const isFirst = this._pageIndex === 0;
    const isLast = this._pageIndex === PAGES.length - 1;

    return html`
      <h1 class="ga-header">${page.title}</h1>
      <span class="page-indicator">
        ${this._pageIndex + 1} / ${PAGES.length}
      </span>

      <div class="page-content">
        ${this._renderPage(page.tag)}
      </div>

      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

      <div class="footer">
        ${!isFirst
          ? html`<ha-button @click=${this._prev}>Zurueck</ha-button>`
          : html`<span></span>`}
        ${isLast
          ? html`<ha-button unelevated @click=${this._finish}>
              Weiter
            </ha-button>`
          : html`<ha-button unelevated @click=${this._next}>
              Naechste
            </ha-button>`}
      </div>
    `;
  }

  private _renderPage(tag: string): TemplateResult {
    const el = document.createElement(tag);
    return html`${el}`;
  }

  private _prev(): void {
    if (this._pageIndex > 0) {
      this._pageIndex--;
    }
  }

  private _next(): void {
    if (this._pageIndex < PAGES.length - 1) {
      this._pageIndex++;
    }
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
        .page-indicator {
          display: block;
          font-size: 0.85rem;
          color: var(--secondary-text-color);
          margin-bottom: 16px;
        }
        .page-content {
          min-height: 200px;
        }
        .error {
          color: var(--error-color);
          margin-bottom: 16px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
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
