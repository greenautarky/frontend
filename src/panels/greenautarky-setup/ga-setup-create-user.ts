import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import { debounce } from "../../common/util/debounce";
import "../../components/ha-button";
import "../../components/ha-checkbox";
import "../../components/ha-formfield";
import "../../components/ha-form/ha-form";
import type { HaForm } from "../../components/ha-form/ha-form";
import type {
  HaFormDataContainer,
  HaFormSchema,
} from "../../components/ha-form/types";
import { genClientId } from "home-assistant-js-websocket";
import { createGASetupUser, joinGASubUser } from "../../data/greenautarky_setup";
import type { ValueChangedEvent } from "../../types";
import { onBoardingStyles } from "../../onboarding/styles";
import { gaBrandingStyles } from "../../onboarding/ga-branding";
import type { PasswordStrength } from "./password-strength";
import {
  MIN_PASSWORD_LENGTH,
  computePasswordStrength,
  PASSWORD_RULES,
} from "./password-strength";

// ha-form field name → localization key (labels resolved via this.localize).
const FIELD_LABEL_KEYS: Record<string, string> = {
  email: "ui.panel.greenautarky_setup.user.field_email",
  username: "ui.panel.greenautarky_setup.user.field_username",
  name: "ui.panel.greenautarky_setup.user.field_name",
  password: "ui.panel.greenautarky_setup.user.field_password",
  password_confirm: "ui.panel.greenautarky_setup.user.field_password_confirm",
};

const FIELD_HELPER_KEYS: Record<string, string> = {
  password: "ui.panel.greenautarky_setup.user.password_helper",
};

const PW_STRENGTH_KEYS = [
  "ui.panel.greenautarky_setup.user.pw_strength_0",
  "ui.panel.greenautarky_setup.user.pw_strength_1",
  "ui.panel.greenautarky_setup.user.pw_strength_2",
  "ui.panel.greenautarky_setup.user.pw_strength_3",
  "ui.panel.greenautarky_setup.user.pw_strength_4",
];

const PW_RULE_KEYS = [
  "ui.panel.greenautarky_setup.user.pw_rule_0",
  "ui.panel.greenautarky_setup.user.pw_rule_1",
  "ui.panel.greenautarky_setup.user.pw_rule_2",
  "ui.panel.greenautarky_setup.user.pw_rule_3",
];

const PASSWORD_FIELDS: HaFormSchema[] = [
  {
    name: "password",
    required: true,
    selector: { text: { type: "password", autocomplete: "new-password" } },
  },
  {
    name: "password_confirm",
    required: true,
    selector: { text: { type: "password", autocomplete: "new-password" } },
  },
];

const EMAIL_SCHEMA: HaFormSchema[] = [
  {
    name: "email",
    required: true,
    selector: { text: { type: "email", autocomplete: "email" } },
  },
  ...PASSWORD_FIELDS,
];

const USERNAME_SCHEMA: HaFormSchema[] = [
  {
    name: "username",
    required: true,
    selector: { text: { type: "text", autocomplete: "username" } },
  },
  ...PASSWORD_FIELDS,
];

const NAME_SCHEMA: HaFormSchema[] = [
  {
    name: "name",
    required: true,
    selector: { text: { type: "text", autocomplete: "name" } },
  },
  ...PASSWORD_FIELDS,
];

@customElement("ga-setup-create-user")
class GaSetupCreateUser extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  @property() public language!: string;

  /** Sub-user join mode: create a Non-Admin sub-user via an invite PIN instead
   * of the device-onboarding create_user. Reuses all password UI + strength. */
  @property({ type: Boolean }) public joinMode = false;

  /** The invite PIN collected in the preceding PIN step (join mode). */
  @property() public invitePin?: string;

  @state() private _useEmail = true;

  @state() private _loading = false;

  @state() private _errorMsg?: string;

  @state() private _formError: Record<string, string> = {};

  @state() private _newUser: HaFormDataContainer = {};

  @state() private _passwordStrength: PasswordStrength = {
    score: 0,
    label: "",
    color: "transparent",
  };

  /** Datenschutz consent (join mode only). A sub-user is a separate data
   * subject, so the join captures its own consent; enforced server-side too. */
  @state() private _datenschutzAccepted = false;

  @query("ha-form", true) private _form?: HaForm;

  private get _identityFilled(): boolean {
    if (this.joinMode) {
      return !!this._newUser.name;
    }
    return this._useEmail ? !!this._newUser.email : !!this._newUser.username;
  }

  private get _passwordValid(): boolean {
    const pw = String(this._newUser.password || "");
    return pw.length >= MIN_PASSWORD_LENGTH && this._passwordStrength.score >= 2;
  }

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">
        ${this.localize("ui.panel.greenautarky_setup.user.title")}
      </h1>
      <p>
        ${this.joinMode
          ? this.localize("ui.panel.greenautarky_setup.user.subtitle_join")
          : this.localize("ui.panel.greenautarky_setup.user.subtitle")}
      </p>

      ${this._errorMsg
        ? html`<ha-alert alert-type="error">${this._errorMsg}</ha-alert>`
        : ""}

      <ha-form
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        .data=${this._newUser}
        .disabled=${this._loading}
        .error=${this._formError}
        .schema=${this.joinMode
          ? NAME_SCHEMA
          : this._useEmail
            ? EMAIL_SCHEMA
            : USERNAME_SCHEMA}
        @value-changed=${this._handleValueChanged}
      ></ha-form>
      ${this._newUser.password
        ? html`
            <div class="password-strength">
              <div class="strength-bar">
                ${[0, 1, 2, 3].map(
                  (i) => html`
                    <div
                      class="strength-segment"
                      style="background-color: ${i < this._passwordStrength.score
                        ? this._passwordStrength.color
                        : "var(--divider-color, #e0e0e0)"}"
                    ></div>
                  `
                )}
              </div>
              <span
                class="strength-label"
                style="color: ${this._passwordStrength.color}"
              >
                ${this._pwStrengthLabel()}
              </span>
              <ul class="password-rules">
                ${PASSWORD_RULES.map(
                  (rule, i) => html`
                    <li class=${rule.test(String(this._newUser.password)) ? "met" : ""}>
                      ${this._pwRuleLabel(i)}
                    </li>
                  `
                )}
              </ul>
            </div>
          `
        : ""}
      ${this.joinMode
        ? html`
            <div class="consent">
              <p class="consent-note">
                ${this.localize(
                  "ui.panel.greenautarky_setup.user.consent_lead"
                )}
                <a
                  href="https://greenautarky.com/datenschutz"
                  target="_blank"
                  rel="noopener"
                  >${this.localize(
                    "ui.panel.greenautarky_setup.gdpr.privacy_policy"
                  )}</a
                >
                ${this.localize(
                  "ui.panel.greenautarky_setup.user.consent_tail"
                )}
              </p>
              <ha-formfield
                .label=${this.localize(
                  "ui.panel.greenautarky_setup.user.consent_label"
                )}
              >
                <ha-checkbox
                  @change=${this._datenschutzChanged}
                  .checked=${this._datenschutzAccepted}
                ></ha-checkbox>
              </ha-formfield>
            </div>
          `
        : html`<a class="toggle-link" @click=${this._toggleMode}>
            ${this._useEmail
              ? this.localize(
                  "ui.panel.greenautarky_setup.user.toggle_no_email"
                )
              : this.localize(
                  "ui.panel.greenautarky_setup.user.toggle_use_email"
                )}
          </a>`}
      <div class="footer">
        <ha-button
          @click=${this._submitForm}
          .disabled=${this._loading ||
          !this._identityFilled ||
          !this._passwordValid ||
          !this._newUser.password_confirm ||
          this._newUser.password !== this._newUser.password_confirm ||
          (this.joinMode && !this._datenschutzAccepted)}
        >
          ${this.localize("ui.panel.greenautarky_setup.user.submit")}
        </ha-button>
      </div>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    setTimeout(() => this._form?.focus(), 100);
    this.addEventListener("keypress", (ev) => {
      if (
        ev.key === "Enter" &&
        this._identityFilled &&
        this._passwordValid &&
        this._newUser.password_confirm &&
        this._newUser.password === this._newUser.password_confirm &&
        (!this.joinMode || this._datenschutzAccepted)
      ) {
        this._submitForm(ev);
      }
    });
  }

  private _toggleMode(): void {
    this._useEmail = !this._useEmail;
    this._newUser = {};
    this._formError = {};
    this._errorMsg = "";
  }

  private _datenschutzChanged(ev: Event): void {
    this._datenschutzAccepted = (ev.target as HTMLInputElement).checked;
  }

  private _computeLabel = (schema: HaFormSchema) => {
    const key = FIELD_LABEL_KEYS[schema.name];
    return key ? this.localize(key as any) : schema.name;
  };

  private _computeHelper = (schema: HaFormSchema) => {
    const key = FIELD_HELPER_KEYS[schema.name];
    return key ? this.localize(key as any) : "";
  };

  private _pwStrengthLabel(): string {
    const key = PW_STRENGTH_KEYS[this._passwordStrength.score];
    return key ? this.localize(key as any) : "";
  }

  private _pwRuleLabel(index: number): string {
    const key = PW_RULE_KEYS[index];
    return key
      ? this.localize(key as any, { count: MIN_PASSWORD_LENGTH })
      : "";
  }

  private _handleValueChanged(
    ev: ValueChangedEvent<HaFormDataContainer>
  ): void {
    const passwordChanged =
      ev.detail.value.password !== this._newUser.password ||
      ev.detail.value.password_confirm !== this._newUser.password_confirm;
    this._newUser = ev.detail.value;
    if (passwordChanged) {
      this._passwordStrength = computePasswordStrength(
        String(this._newUser.password || "")
      );
      if (this._formError.password_confirm) {
        this._checkPasswordMatch();
      } else {
        this._debouncedCheckPasswordMatch();
      }
    }
  }

  private _debouncedCheckPasswordMatch = debounce(
    () => this._checkPasswordMatch(),
    500
  );

  private _checkPasswordMatch(): void {
    const old = this._formError.password_confirm;
    this._formError.password_confirm =
      this._newUser.password_confirm &&
      this._newUser.password !== this._newUser.password_confirm
        ? this.localize("ui.panel.greenautarky_setup.user.password_mismatch")
        : "";
    if (old !== this._formError.password_confirm) {
      this.requestUpdate("_formError");
    }
  }

  private async _submitForm(ev): Promise<void> {
    ev.preventDefault();
    this._loading = true;
    this._errorMsg = "";

    try {
      if (this.joinMode) {
        const result = await joinGASubUser({
          client_id: genClientId(),
          name: String(this._newUser.name),
          password: String(this._newUser.password),
          invite_pin: String(this.invitePin || ""),
          datenschutz_consent: this._datenschutzAccepted,
        });
        fireEvent(this, "ga-setup-step", { type: "user", result: result as any });
        return;
      }

      let name: string;
      let username: string;

      if (this._useEmail) {
        const email = String(this._newUser.email);
        name = email.split("@")[0];
        username = email;
      } else {
        const user = String(this._newUser.username);
        name = user;
        username = user;
      }

      const result = await createGASetupUser({
        client_id: genClientId(),
        name,
        username,
        password: String(this._newUser.password),
        language: this.language,
      });

      fireEvent(this, "ga-setup-step", {
        type: "user",
        result,
      });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      this._loading = false;
      this._errorMsg = err.body?.message || err.message;
    }
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      gaBrandingStyles,
      css`
        .toggle-link {
          display: inline-block;
          margin-top: 8px;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 14px;
        }
        .consent {
          margin-top: 16px;
        }
        .consent-note {
          font-size: 0.9rem;
          color: var(--secondary-text-color, #757575);
          margin-bottom: 8px;
        }
        .consent ha-formfield {
          display: block;
        }
        .toggle-link:hover {
          text-decoration: underline;
        }
        .password-strength {
          margin-top: 8px;
          margin-bottom: 8px;
        }
        .strength-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }
        .strength-segment {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          transition: background-color 0.3s;
        }
        .strength-label {
          font-size: 12px;
          font-weight: 500;
        }
        .password-rules {
          list-style: none;
          padding: 0;
          margin: 8px 0 0;
          font-size: 12px;
          color: var(--secondary-text-color, #757575);
        }
        .password-rules li {
          padding: 2px 0 2px 20px;
          position: relative;
        }
        .password-rules li::before {
          content: "✕";
          position: absolute;
          left: 0;
          color: var(--error-color, #db4437);
          font-size: 11px;
        }
        .password-rules li.met::before {
          content: "✓";
          color: var(--success-color, #43a047);
        }
        .password-rules li.met {
          color: var(--primary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-create-user": GaSetupCreateUser;
  }
}
