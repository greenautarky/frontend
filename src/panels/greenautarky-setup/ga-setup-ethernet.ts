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

  @state() private _enableEthernet = false;

  protected render(): TemplateResult {
    return html`
      <div class="ga-header">
        ${gaLogoIcon}
        <h1>Netzwerk-Einstellungen</h1>
      </div>
      <p>
        Ihr Ger&auml;t ist standardm&auml;&szlig;ig nur &uuml;ber WiFi und VPN
        erreichbar. M&ouml;chten Sie auch die Ethernet-Verbindung aktivieren?
      </p>
      <div class="warning">
        Hinweis: Ethernet erm&ouml;glicht den Zugriff &uuml;ber das lokale
        Netzwerk.
      </div>
      <ha-settings-row>
        <span slot="heading">Ethernet-Verbindung aktivieren</span>
        <span slot="description">
          Ger&auml;t &uuml;ber Ethernet im lokalen Netzwerk erreichbar machen
        </span>
        <ha-switch
          .checked=${this._enableEthernet}
          @change=${this._ethernetChanged}
          name="enable_ethernet"
        >
        </ha-switch>
      </ha-settings-row>

      <div class="footer">
        <ha-button @click=${this._save}> Weiter </ha-button>
      </div>
    `;
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
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-ethernet": GaSetupEthernet;
  }
}
