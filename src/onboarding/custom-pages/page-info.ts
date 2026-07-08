import type { TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators";
import { GA_PRODUCT_NAME } from "../ga-branding";

@customElement("onboarding-page-info")
class OnboardingPageInfo extends LitElement {
  protected render(): TemplateResult {
    return html`
      <h2>Über Ihren ${GA_PRODUCT_NAME}</h2>
      <p>
        Ihr KI-Butler ist ein lokaler Smart-Home-Hub, der Ihre Daten schützt. Er
        verbindet sich mit Funkgeräten (Zigbee), WLAN- und Ethernet-Geräten.
      </p>
      <ul>
        <li>Alle Automatisierungen laufen lokal auf dem Gerät</li>
        <li>Keine Cloud-Abhängigkeit erforderlich</li>
        <li>Erweiterbar mit Add-ons und Integrationen (Erweiterungen für weitere Geräte und Dienste)</li>
      </ul>

      <h2>Erste Schritte</h2>
      <p>Nach der Einrichtung können Sie:</p>
      <ul>
        <li>Smart-Geräte hinzufügen unter <strong>Einstellungen &gt; Geräte</strong></li>
        <li>Automatisierungen erstellen unter <strong>Einstellungen &gt; Automatisierungen</strong></li>
        <li>Add-ons installieren unter <strong>Einstellungen &gt; Add-ons</strong></li>
        <li>Ihr Dashboard auf der Übersichtsseite anpassen</li>
      </ul>

      <h2>Hilfe benötigt?</h2>
      <p>
        Besuchen Sie das Handbuch auf
        <a
          href="https://greenautarky.com/handbuch"
          target="_blank"
          rel="noreferrer noopener"
          >greenautarky.com/handbuch</a
        >
        oder wenden Sie sich an unseren Support.
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
