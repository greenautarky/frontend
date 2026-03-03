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
        Dein KI-Butler ist ein lokaler Smart-Home-Hub, der deine Daten schuetzt.
        Er unterstuetzt Zigbee-, WLAN- und Ethernet-Geraete.
      </p>
      <ul>
        <li>Alle Automatisierungen laufen lokal auf dem Geraet</li>
        <li>Keine Cloud-Abhaengigkeit erforderlich</li>
        <li>Erweiterbar mit Add-ons und Integrationen</li>
      </ul>

      <h2>Erste Schritte</h2>
      <p>Nach der Einrichtung kannst du:</p>
      <ul>
        <li>Smart-Geraete hinzufuegen unter <strong>Einstellungen &gt; Geraete</strong></li>
        <li>Automatisierungen erstellen unter <strong>Einstellungen &gt; Automatisierungen</strong></li>
        <li>Add-ons installieren unter <strong>Einstellungen &gt; Add-ons</strong></li>
        <li>Dein Dashboard auf der Uebersichtsseite anpassen</li>
      </ul>

      <h2>Hilfe benoetigt?</h2>
      <p>
        Besuche die Dokumentation auf
        <a
          href="https://www.home-assistant.io/docs/"
          target="_blank"
          rel="noreferrer noopener"
          >home-assistant.io/docs</a
        >
        oder wende dich an die Community-Foren.
      </p>
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
    h2:not(:first-child) {
      margin-top: 24px;
    }
    ul {
      padding-left: 20px;
      margin: 8px 0;
    }
    li {
      margin-bottom: 4px;
    }
    a {
      color: var(--primary-color);
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "onboarding-page-info": OnboardingPageInfo;
  }
}
