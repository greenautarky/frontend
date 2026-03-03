import { genClientId } from "home-assistant-js-websocket";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import type { LocalizeFunc } from "../common/translations/localize";
import { debounce } from "../common/util/debounce";
import "../components/ha-button";
import "../components/ha-form/ha-form";
import type { HaForm } from "../components/ha-form/ha-form";
import type {
  HaFormDataContainer,
  HaFormSchema,
} from "../components/ha-form/types";
import { onboardUserStep } from "../data/onboarding";
import type { ValueChangedEvent } from "../types";
import { onBoardingStyles } from "./styles";
import { gaBrandingStyles } from "./ga-branding";

/** German labels for the create-user form fields. */
const FIELD_LABELS: Record<string, string> = {
  email: "E-Mail-Adresse",
  username: "Benutzername",
  password: "Passwort",
  password_confirm: "Passwort bestätigen",
};

const FIELD_HELPERS: Record<string, string> = {
  password:
    "Wähle ein sicheres Passwort. Merke es dir gut, damit du es nicht vergisst.",
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

@customElement("onboarding-create-user")
class OnboardingCreateUser extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc;

  @property() public language!: string;

  @state() private _useEmail = true;

  @state() private _loading = false;

  @state() private _errorMsg?: string;

  @state() private _formError: Record<string, string> = {};

  @state() private _newUser: HaFormDataContainer = {};

  @query("ha-form", true) private _form?: HaForm;

  private get _identityFilled(): boolean {
    return this._useEmail ? !!this._newUser.email : !!this._newUser.username;
  }

  protected render(): TemplateResult {
    return html`
      <h1 class="ga-header">Benutzerkonto erstellen</h1>
      <p>Erstelle ein Benutzerkonto, um deinen KI-Butler zu verwalten.</p>

      ${this._errorMsg
        ? html`<ha-alert alert-type="error">${this._errorMsg}</ha-alert>`
        : ""}

      <ha-form
        .computeLabel=${this._computeLabel(this.localize)}
        .computeHelper=${this._computeHelper(this.localize)}
        .data=${this._newUser}
        .disabled=${this._loading}
        .error=${this._formError}
        .schema=${this._useEmail ? EMAIL_SCHEMA : USERNAME_SCHEMA}
        @value-changed=${this._handleValueChanged}
      ></ha-form>
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
          !this._newUser.password ||
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
        this._newUser.password &&
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

  private _computeLabel(_localize) {
    return (schema: HaFormSchema) =>
      FIELD_LABELS[schema.name] ?? schema.name;
  }

  private _computeHelper(_localize) {
    return (schema: HaFormSchema) =>
      FIELD_HELPERS[schema.name] ?? "";
  }

  private _handleValueChanged(
    ev: ValueChangedEvent<HaFormDataContainer>
  ): void {
    const passwordChanged =
      ev.detail.value.password !== this._newUser.password ||
      ev.detail.value.password_confirm !== this._newUser.password_confirm;
    this._newUser = ev.detail.value;
    if (passwordChanged) {
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
      const clientId = genClientId();

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

      const result = await onboardUserStep({
        client_id: clientId,
        name,
        username,
        password: String(this._newUser.password),
        language: this.language,
      });

      fireEvent(this, "onboarding-step", {
        type: "user",
        result,
      });
    } catch (err: any) {
      // eslint-disable-next-line
      console.error(err);
      this._loading = false;
      this._errorMsg = err.body.message;
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
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "onboarding-create-user": OnboardingCreateUser;
  }
}
