import type { TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators";
import { GA_PRODUCT_NAME } from "../ga-branding";

@customElement("onboarding-page-info")
class OnboardingPageInfo extends LitElement {
  protected render(): TemplateResult {
    return html`
      <h2>Ueber deinen ${GA_PRODUCT_NAME}</h2>
      <p>
        Dein iHost ist ein lokaler Smart-Home-Hub, der deine Daten schuetzt.
        Er unterstuetzt Zigbee-, WLAN- und Ethernet-Geraete.
      </p>
      <ul>
        <li>Alle Automatisierungen laufen lokal auf dem Geraet</li>
        <li>Keine Cloud-Abhaengigkeit erforderlich</li>
        <li>Erweiterbar mit Add-ons und Integrationen</li>
      </ul>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    h2 {
      font-size: 1.1rem;
      margin-top: 0;
      margin-bottom: 12px;
    }
    ul {
      padding-left: 20px;
      margin: 8px 0;
    }
    li {
      margin-bottom: 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "onboarding-page-info": OnboardingPageInfo;
  }
}
