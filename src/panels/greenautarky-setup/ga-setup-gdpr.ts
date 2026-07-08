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

  @state() private _accepted = false;

  @state() private _error?: string;

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">Datenschutz</h1>
      <p>
        Bitte lesen Sie die
        <a
          href="https://greenautarky.com/datenschutz"
          target="_blank"
          rel="noopener"
          >Datenschutzerklärung</a
        >
        für den ${GA_PRODUCT_NAME} und akzeptieren Sie sie, bevor Sie Ihr Konto
        erstellen.
      </p>

      <div class="gdpr-content">
        <h2>Datenverarbeitung</h2>
        <p>
          Ihr ${GA_PRODUCT_NAME} verarbeitet Daten lokal auf Ihrem Gerät.
          Persönliche Daten wie Ihr Benutzername und Ihre Konfiguration werden
          ausschließlich auf diesem Gerät gespeichert und nicht an externe Server
          übertragen, es sei denn, Sie aktivieren ausdrücklich Cloud-Dienste oder
          Analysen.
        </p>

        <h2>Ihre Rechte</h2>
        <ul>
          <li>Alle Daten werden lokal auf Ihrem Gerät gespeichert</li>
          <li>Sie können Ihre Daten jederzeit exportieren oder löschen</li>
          <li>Analysen und Diagnosen sind optional und standardmäßig deaktiviert</li>
          <li>Drittanbieter-Integrationen teilen Daten nur bei ausdrücklicher Konfiguration</li>
        </ul>
      </div>

      <ha-formfield .label=${"Ich akzeptiere die Datenschutzerklärung"}>
        <ha-checkbox
          @change=${this._acceptChanged}
          .checked=${this._accepted}
        ></ha-checkbox>
      </ha-formfield>

      ${this._error ? html`<div class="error">${this._error}</div>` : ""}

      <div class="footer">
        <ha-button
          unelevated
          @click=${this._continue}
          .disabled=${!this._accepted}
        >
          Weiter
        </ha-button>
      </div>
    `;
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
      this._error = `Fehler: ${err.message}`;
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
          text-align: right;
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
