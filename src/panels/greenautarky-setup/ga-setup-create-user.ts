import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import type { LocalizeFunc } from "../../common/translations/localize";
import { debounce } from "../../common/util/debounce";
import "../../components/ha-button";
import "../../components/ha-form/ha-form";
import type { HaForm } from "../../components/ha-form/ha-form";
import type {
  HaFormDataContainer,
  HaFormSchema,
} from "../../components/ha-form/types";
import { genClientId } from "home-assistant-js-websocket";
import { createGASetupUser } from "../../data/greenautarky_setup";
import type { ValueChangedEvent } from "../../types";
import { onBoardingStyles } from "../../onboarding/styles";
import { gaBrandingStyles } from "../../onboarding/ga-branding";
import type { PasswordStrength } from "./password-strength";
import {
  MIN_PASSWORD_LENGTH,
  computePasswordStrength,
  PASSWORD_RULES,
} from "./password-strength";

const FIELD_LABELS: Record<string, string> = {
  email: "E-Mail-Adresse",
  username: "Benutzername",
  password: "Passwort",
  password_confirm: "Passwort bestätigen",
};

const FIELD_HELPERS: Record<string, string> = {
  password:
    "Wählen Sie ein sicheres Passwort. Merken Sie es sich gut, damit Sie es nicht vergessen.",
};

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

@customElement("ga-setup-create-user")
class GaSetupCreateUser extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  @property() public language!: string;

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

  @query("ha-form", true) private _form?: HaForm;

  private get _identityFilled(): boolean {
    return this._useEmail ? !!this._newUser.email : !!this._newUser.username;
  }

  private get _passwordValid(): boolean {
    const pw = String(this._newUser.password || "");
    return pw.length >= MIN_PASSWORD_LENGTH && this._passwordStrength.score >= 2;
  }

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">Benutzerkonto erstellen</h1>
      <p>Erstellen Sie ein Benutzerkonto, um Ihren KI-Butler zu verwalten.</p>

      ${this._errorMsg
        ? html`<ha-alert alert-type="error">${this._errorMsg}</ha-alert>`
        : ""}

      <ha-form
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        .data=${this._newUser}
        .disabled=${this._loading}
        .error=${this._formError}
        .schema=${this._useEmail ? EMAIL_SCHEMA : USERNAME_SCHEMA}
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
                ${this._passwordStrength.label}
              </span>
              <ul class="password-rules">
                ${PASSWORD_RULES.map(
                  (rule) => html`
                    <li class=${rule.test(String(this._newUser.password)) ? "met" : ""}>
                      ${rule.label}
                    </li>
                  `
                )}
              </ul>
            </div>
          `
        : ""}
      <a class="toggle-link" @click=${this._toggleMode}>
        ${this._useEmail
          ? "Ich habe keine E-Mail-Adresse"
          : "E-Mail-Adresse verwenden"}
      </a>
      <div class="footer">
        <ha-button
          @click=${this._submitForm}
          .disabled=${this._loading ||
          !this._identityFilled ||
          !this._passwordValid ||
          !this._newUser.password_confirm ||
          this._newUser.password !== this._newUser.password_confirm}
        >
          Konto erstellen
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
        this._newUser.password === this._newUser.password_confirm
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

  private _computeLabel = (schema: HaFormSchema) =>
    FIELD_LABELS[schema.name] ?? schema.name;

  private _computeHelper = (schema: HaFormSchema) =>
    FIELD_HELPERS[schema.name] ?? "";

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
        ? "Passwörter stimmen nicht überein"
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
