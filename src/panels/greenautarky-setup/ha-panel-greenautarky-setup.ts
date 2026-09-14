import "@material/mwc-linear-progress/mwc-linear-progress";
import type { PropertyValues } from "lit";
import { css, html, nothing } from "lit";
import { cache } from "lit/directives/cache";
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
import "./ga-setup-ethernet";
import { advance, canGoBack, goBack, progressFor } from "./setup-flow";
import type { GASetupStepType } from "./setup-flow";

interface GASetupEvent {
  type: GASetupStepType;
  result?: GASetupUserResponse;
  /** Invite PIN carried from the join-mode PIN step to create-user. */
  pin?: string;
}

declare global {
  interface HASSDomEvents {
    "ga-setup-step": GASetupEvent;
    // Fired by a step's "Zurück" button. No payload — the panel pops its own
    // history stack (see setup-flow.ts) and never re-runs a step's side effects.
    "ga-setup-back": undefined;
  }

  interface GlobalEventHandlersEventMap {
    "ga-setup-step": HASSDomEvent<GASetupEvent>;
    "ga-setup-back": HASSDomEvent<undefined>;
  }
}

@customElement("ha-panel-greenautarky-setup")
class HaPanelGreenautarkySetup extends litLocalizeLiteMixin(HassElement) {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public translationFragment =
    "page-onboarding";

  @state() private _currentStep: GASetupStepType = "welcome";

  /** Steps the user can return to (oldest first, excludes the current step).
   * Managed via the pure reducer in setup-flow.ts. Cleared when crossing the
   * account gate so "Zurück" can never return to create-user. */
  @state() private _stepHistory: GASetupStepType[] = [];

  @state() private _loading = false;

  @state() private _progress = 0;

  /** PIN from QR code URL parameter (?pin=847293) — auto-submitted in PIN step */
  @state() private _autoPin?: string;

  /** Device label from QR code URL parameter (?device=KIB-SON-00000042) */
  @state() private _deviceLabel?: string;

  // Set when arriving from /auth/authorize (app flow). Used for Admin-Login link.
  @state() private _authRedirect: string | null = null;

  /** Sub-user join mode (ADR-0006): same wizard, minimal flow pin(invite)→user.
   * Detected from the URL (?join=1 or /greenautarky-join). */
  @state() private _joinMode = false;

  /** Invite PIN collected in the join-mode PIN step, passed to create-user. */
  @state() private _invitePin?: string;

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
        <!-- cache() keeps each step's DOM (and its internal state — e.g. the
             analytics consent toggles) alive when switched out, so pressing
             "Zurück" and returning restores what the user had entered. -->
        <div class="card-content">${cache(this._renderStep())}</div>
      </ha-card>
      <div class="footer">
        <ha-language-picker
          .value=${this.language}
          .label=${""}
          native-name
          @value-changed=${this._languageChanged}
          inline-arrow
        ></ha-language-picker>
        <a class="build-id" href="/admin" title="Admin-Login"
          >${__VERSION__}-${__GIT_HASH__}</a
        >
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
        return html`<ga-setup-pin
          .autoPin=${this._autoPin}
          .joinMode=${this._joinMode}
        ></ga-setup-pin>`;
      case "gdpr":
        return html`<ga-setup-gdpr
          .localize=${this.localize}
          .canBack=${this._stepHistory.length > 0}
        ></ga-setup-gdpr>`;
      case "user":
        return html`<ga-setup-create-user
          .localize=${this.localize}
          .language=${this.language}
          .joinMode=${this._joinMode}
          .invitePin=${this._invitePin}
        ></ga-setup-create-user>`;
      case "info_pages":
        return html`<ga-setup-info-pages
          .localize=${this.localize}
          .canBack=${this._stepHistory.length > 0}
        ></ga-setup-info-pages>`;
      case "analytics":
        return html`<ga-setup-analytics
          .hass=${this.hass}
          .localize=${this.localize}
          .canBack=${this._stepHistory.length > 0}
        ></ga-setup-analytics>`;
      case "ethernet":
        return html`<ga-setup-ethernet
          .localize=${this.localize}
          .canBack=${this._stepHistory.length > 0}
        ></ga-setup-ethernet>`;
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
    // "Zurück" button (gdpr / info_pages / analytics / ethernet) and the
    // browser Back button both route through the SAME reducer, so they produce
    // identical transitions and never re-run a step's side effects.
    this.addEventListener("ga-setup-back", this._goBack);
    window.addEventListener("popstate", this._onPopState);
    import("../../components/ha-language-picker");

    // Sub-user join mode: same wizard, minimal flow. Start straight at the
    // invite-PIN step (no welcome/gdpr/…). Detected from ?join=1 or the path.
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("join") === "1" ||
        window.location.pathname.includes("greenautarky-join")
      ) {
        this._joinMode = true;
        this._currentStep = "pin";
      }
    } catch (_) {
      // URL parsing not available
    }

    // Parse PIN from QR code URL (?pin=847293&device=KIB-SON-00000042)
    try {
      const params = new URLSearchParams(window.location.search);
      const pin = params.get("pin");
      const device = params.get("device");
      if (pin && /^\d{6}$/.test(pin)) {
        this._autoPin = pin;
      }
      if (device) {
        this._deviceLabel = device;
      }
      // Clean URL (remove pin from address bar for security)
      if (pin || device) {
        history.replaceState(null, "", window.location.pathname);
      }
    } catch (_) {
      // URL parsing not available
    }
    // If we arrived via the app flow (authorize.ts stored the auth URL),
    // keep a reference so we can render the Admin-Login escape-hatch link.
    try {
      this._authRedirect = sessionStorage.getItem("ga_auth_redirect");
    } catch (_) {
      // sessionStorage not available
    }
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this._onPopState);
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
    this._progress = progressFor(type);

    if (type === "welcome") {
      // Check if PIN step is needed
      try {
        const status = await fetchGASetupStatus();
        if (status.pin_required && !status.pin_verified) {
          this._goForward("pin");
        } else {
          this._goForward("gdpr");
        }
      } catch (_) {
        // If status check fails, skip PIN (backward compatible)
        this._goForward("gdpr");
      }
    } else if (type === "pin") {
      this._autoPin = undefined;
      if (this._joinMode) {
        this._invitePin = ev.detail.pin;
        this._goForward("user");
      } else {
        this._goForward("gdpr");
      }
    } else if (type === "gdpr") {
      this._goForward("user");
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
        if (this._joinMode) {
          // Sub-user joined + auto-logged-in on their own device → go straight
          // to their dashboard (skip device-level info/analytics/ethernet).
          document.location.assign("/");
          return;
        }
        // Account gate: advance() clears the back history here, so a later
        // "Zurück" (or the browser Back button) can never return to
        // create-user and create a second account server-side.
        this._goForward("info_pages");
      } catch (_err: any) {
        alert("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
        location.reload();
      } finally {
        this._loading = false;
      }
    } else if (type === "info_pages") {
      this._goForward("analytics");
    } else if (type === "analytics") {
      this._goForward("ethernet");
    } else if (type === "ethernet") {
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

  /** Advance to `next`, recording history via the reducer, and push a browser
   * history entry so the browser Back button maps to one wizard step. */
  private _goForward(next: GASetupStepType) {
    const nextState = advance(
      { current: this._currentStep, history: this._stepHistory },
      next
    );
    this._stepHistory = nextState.history;
    this._currentStep = nextState.current;
    try {
      history.pushState({ gaStep: next }, "");
    } catch (_) {
      // history API not available
    }
  }

  /** Go back one step (on-page "Zurück" button and browser Back both land here).
   * Never re-runs a step's side effects — it only pops the reducer's history. */
  private _goBack = () => {
    const state = { current: this._currentStep, history: this._stepHistory };
    if (!canGoBack(state)) {
      return;
    }
    const prevState = goBack(state);
    this._stepHistory = prevState.history;
    this._currentStep = prevState.current;
    this._progress = progressFor(prevState.current);
  };

  /** Browser Back button. Mirrors the on-page button, and traps the user in the
   * wizard (re-pushes) when there is no wizard step left to go back to. */
  private _onPopState = () => {
    if (canGoBack({ current: this._currentStep, history: this._stepHistory })) {
      this._goBack();
    } else {
      try {
        history.pushState({ gaStep: this._currentStep }, "");
      } catch (_) {
        // history API not available
      }
    }
  };

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
