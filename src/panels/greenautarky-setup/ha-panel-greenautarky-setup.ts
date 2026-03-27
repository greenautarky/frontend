import "@material/mwc-linear-progress/mwc-linear-progress";
import type { PropertyValues } from "lit";
import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { Auth } from "home-assistant-js-websocket";
import {
  createConnection,
  getAuth,
  subscribeConfig,
} from "home-assistant-js-websocket";
import type { HASSDomEvent } from "../../common/dom/fire_event";
import { litLocalizeLiteMixin } from "../../mixins/lit-localize-lite-mixin";
import { HassElement } from "../../state/hass-element";
import "../../components/ha-card";
import {
  completeGASetup,
  fetchGASetupStatus,
} from "../../data/greenautarky_setup";
import type { GASetupUserResponse } from "../../data/greenautarky_setup";
import { enableWrite, saveTokens } from "../../common/auth/token_storage";
import { hassUrl } from "../../data/auth";
import { subscribeOne } from "../../common/util/subscribe-one";
import { subscribeUser } from "../../data/ws-user";
import { storeState } from "../../util/ha-pref-storage";
import type { HomeAssistant } from "../../types";
import "./ga-setup-welcome";
import "./ga-setup-pin";
import "./ga-setup-gdpr";
import "./ga-setup-create-user";
import "./ga-setup-info-pages";
import "./ga-setup-analytics";

type GASetupStepType = "welcome" | "pin" | "gdpr" | "user" | "info_pages" | "analytics";

interface GASetupEvent {
  type: GASetupStepType;
  result?: GASetupUserResponse;
}

const STEPS: GASetupStepType[] = [
  "welcome",
  "pin",
  "gdpr",
  "user",
  "info_pages",
  "analytics",
];

declare global {
  interface HASSDomEvents {
    "ga-setup-step": GASetupEvent;
  }

  interface GlobalEventHandlersEventMap {
    "ga-setup-step": HASSDomEvent<GASetupEvent>;
  }
}

@customElement("ha-panel-greenautarky-setup")
class HaPanelGreenautarkySetup extends litLocalizeLiteMixin(HassElement) {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public translationFragment =
    "page-onboarding";

  @state() private _currentStep: GASetupStepType = "welcome";

  @state() private _loading = false;

  @state() private _progress = 0;

  // Set when arriving from /auth/authorize (app flow). Used for Admin-Login link.
  @state() private _authRedirect: string | null = null;

  protected render() {
    const adminLink = this._authRedirect
      ? html`<a
          class="admin-login"
          href=${this._authRedirect +
          (this._authRedirect.includes("?") ? "&" : "?") +
          "ga_bypass=1"}
          >Admin-Login</a
        >`
      : nothing;

    return html`
      <mwc-linear-progress .progress=${this._progress}></mwc-linear-progress>
      <ha-card>
        <div class="card-content">${this._renderStep()}</div>
      </ha-card>
      <div class="footer">
        <ha-language-picker
          .value=${this.language}
          .label=${""}
          native-name
          @value-changed=${this._languageChanged}
          inline-arrow
        ></ha-language-picker>
        <span class="build-id">${__VERSION__}-${__GIT_HASH__}</span>
      </div>
      ${adminLink}
    `;
  }

  private _renderStep() {
    if (this._loading) {
      return html`<div class="loading">
        <mwc-linear-progress indeterminate></mwc-linear-progress>
      </div>`;
    }

    switch (this._currentStep) {
      case "welcome":
        return html`<ga-setup-welcome
          .localize=${this.localize}
        ></ga-setup-welcome>`;
      case "pin":
        return html`<ga-setup-pin></ga-setup-pin>`;
      case "gdpr":
        return html`<ga-setup-gdpr .localize=${this.localize}></ga-setup-gdpr>`;
      case "user":
        return html`<ga-setup-create-user
          .localize=${this.localize}
          .language=${this.language}
        ></ga-setup-create-user>`;
      case "info_pages":
        return html`<ga-setup-info-pages
          .localize=${this.localize}
        ></ga-setup-info-pages>`;
      case "analytics":
        return html`<ga-setup-analytics
          .hass=${this.hass}
          .localize=${this.localize}
        ></ga-setup-analytics>`;
      default:
        return nothing;
    }
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    // Default to German
    if (!window.localStorage.getItem("selectedLanguage")) {
      this.language = "de";
      window.localStorage.setItem("selectedLanguage", JSON.stringify("de"));
    }
    this.addEventListener("ga-setup-step", (ev) => this._handleStep(ev));
    import("../../components/ha-language-picker");
    // If we arrived via the app flow (authorize.ts stored the auth URL),
    // keep a reference so we can render the Admin-Login escape-hatch link.
    try {
      this._authRedirect = sessionStorage.getItem("ga_auth_redirect");
    } catch (_) {
      // sessionStorage not available
    }
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has("language")) {
      document.querySelector("html")!.setAttribute("lang", this.language);
    }
    if (changedProps.has("hass")) {
      const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
      if (this.hass) {
        this.hassChanged(this.hass, oldHass);
      }
    }
  }

  private async _handleStep(ev: HASSDomEvent<GASetupEvent>) {
    const { type, result } = ev.detail;
    const currentIndex = STEPS.indexOf(type);
    const stepProgress = (currentIndex + 1) / STEPS.length;
    this._progress = stepProgress;

    if (type === "welcome") {
      // Check if PIN step is needed
      try {
        const status = await fetchGASetupStatus();
        if (status.pin_required && !status.pin_verified) {
          this._currentStep = "pin";
        } else {
          this._currentStep = "gdpr";
        }
      } catch (_) {
        // If status check fails, skip PIN (backward compatible)
        this._currentStep = "gdpr";
      }
    } else if (type === "pin") {
      this._currentStep = "gdpr";
    } else if (type === "gdpr") {
      this._currentStep = "user";
    } else if (type === "user") {
      // User was created — authenticate with the returned auth code
      this._loading = true;
      enableWrite();
      try {
        const auth = await getAuth({
          hassUrl,
          limitHassInstance: true,
          authCode: (result as GASetupUserResponse).auth_code,
          saveTokens,
        });
        await this._connectHass(auth);
        this._currentStep = "info_pages";
      } catch (_err: any) {
        alert("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
        location.reload();
      } finally {
        this._loading = false;
      }
    } else if (type === "info_pages") {
      this._currentStep = "analytics";
    } else if (type === "analytics") {
      // All done — mark setup complete and redirect
      this._loading = true;
      this._progress = 1;
      try {
        await completeGASetup();
      } catch (_err: any) {
        // Best effort — redirect anyway
      }
      // If we arrived from /auth/authorize (app flow), return there so the
      // app can complete auth; otherwise go to home (login page).
      let authRedirect: string | null = null;
      try {
        authRedirect = sessionStorage.getItem("ga_auth_redirect");
      } catch (_) {
        // sessionStorage not available
      }
      if (authRedirect) {
        try {
          sessionStorage.removeItem("ga_auth_redirect");
        } catch (_) {
          // sessionStorage not available
        }
        document.location.assign(authRedirect);
      } else {
        document.location.assign("/");
      }
    }
  }

  private async _connectHass(auth: Auth) {
    const conn = await createConnection({ auth });
    await Promise.all([
      subscribeOne(conn, subscribeConfig),
      subscribeOne(conn, subscribeUser),
    ]);
    this.initializeHass(auth, conn);
    if (this.language !== this.hass!.language) {
      this._updateHass({
        locale: { ...this.hass!.locale, language: this.language },
        language: this.language,
        selectedLanguage: this.language,
      });
      storeState(this.hass!);
    }
    (this as any)._loadFragmentTranslations(this.hass!.language, "config");
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  private _languageChanged(ev: CustomEvent) {
    const language = ev.detail.value;
    this.language = language;
    if (this.hass) {
      this._updateHass({
        locale: { ...this.hass!.locale, language },
        language,
        selectedLanguage: language,
      });
      storeState(this.hass!);
    } else {
      try {
        window.localStorage.setItem(
          "selectedLanguage",
          JSON.stringify(language)
        );
      } catch (_err: any) {
        // Ignore
      }
    }
  }

  static styles = css`
    :host {
      --primary-color: #2b5a2a;
    }
    .card-content {
      padding: 32px;
    }
    mwc-linear-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 10;
    }
    .loading {
      padding: 64px 0;
      text-align: center;
    }
    .footer {
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .build-id {
      font-size: 11px;
      color: var(--secondary-text-color, #999);
      opacity: 0.6;
      user-select: all;
    }
    .admin-login {
      position: fixed;
      bottom: 12px;
      right: 16px;
      font-size: 11px;
      opacity: 0.4;
      color: inherit;
      text-decoration: none;
      z-index: 9999;
    }
    .admin-login:hover {
      opacity: 0.8;
    }
    ha-language-picker {
      display: block;
      width: 200px;
      border-radius: var(--ha-border-radius-sm);
      overflow: hidden;
      --ha-select-height: 40px;
      --mdc-select-fill-color: none;
      --mdc-select-label-ink-color: var(--primary-text-color, #212121);
      --mdc-select-ink-color: var(--primary-text-color, #212121);
      --mdc-select-idle-line-color: transparent;
      --mdc-select-hover-line-color: transparent;
      --mdc-select-dropdown-icon-color: var(--primary-text-color, #212121);
      --mdc-shape-small: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-panel-greenautarky-setup": HaPanelGreenautarkySetup;
  }
}
