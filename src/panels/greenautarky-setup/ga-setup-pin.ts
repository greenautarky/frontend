import type { CSSResultGroup, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-button";
import "../../components/ha-textfield";
import { onBoardingStyles } from "../../onboarding/styles";
import { verifyGASetupPin } from "../../data/greenautarky_setup";

@customElement("ga-setup-pin")
class GaSetupPin extends LitElement {
  @state() private _pin = "";

  @state() private _error = "";

  @state() private _retryAfter = 0;

  @state() private _loading = false;

  @state() private _countdown = 0;

  private _timer?: ReturnType<typeof setInterval>;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer) {
      clearInterval(this._timer);
    }
  }

  protected render(): TemplateResult {
    const canSubmit =
      this._pin.replace(/\D/g, "").length === 6 &&
      !this._loading &&
      this._countdown === 0;

    return html`
      <div class="pin-icon">&#128274;</div>
      <h1>Geräte-PIN eingeben</h1>
      <p class="description">
        Bitte geben Sie den 6-stelligen Code ein, der auf dem Aufkleber Ihres
        Geräts steht.
      </p>

      <div class="pin-input-container">
        <ha-textfield
          .value=${this._formatPin(this._pin)}
          @input=${this._onInput}
          @keydown=${this._onKeydown}
          type="tel"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="7"
          placeholder="000-000"
          class="pin-field"
          ?disabled=${this._loading || this._countdown > 0}
          autofocus
        ></ha-textfield>
      </div>

      ${this._error
        ? html`<p class="error">
            ${this._error}
            ${this._countdown > 0
              ? html`<br />Nächster Versuch in
                  <strong>${this._countdown}s</strong>`
              : ""}
          </p>`
        : ""}

      <ha-button
        @click=${this._submit}
        class="start"
        unelevated
        ?disabled=${!canSubmit}
      >
        ${this._loading ? "Wird geprüft..." : "Weiter"}
      </ha-button>
    `;
  }

  private _formatPin(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    if (digits.length > 3) {
      return digits.slice(0, 3) + "-" + digits.slice(3);
    }
    return digits;
  }

  private _onInput(ev: InputEvent): void {
    const target = ev.target as HTMLInputElement;
    const digits = target.value.replace(/\D/g, "").slice(0, 6);
    this._pin = digits;
    this._error = "";

    // Auto-submit when 6 digits entered
    if (digits.length === 6 && this._countdown === 0) {
      this._submit();
    }
  }

  private _onKeydown(ev: KeyboardEvent): void {
    if (ev.key === "Enter" && this._pin.replace(/\D/g, "").length === 6) {
      this._submit();
    }
  }

  private async _submit(): Promise<void> {
    const pin = this._pin.replace(/\D/g, "");
    if (pin.length !== 6) return;

    this._loading = true;
    this._error = "";

    try {
      const result = await verifyGASetupPin(pin);

      if (result.status === "ok") {
        fireEvent(this, "ga-setup-step", { type: "pin" as any });
        return;
      }

      if (result.status === "locked") {
        this._error = "Zu viele Fehlversuche.";
        this._startCountdown(result.retry_after || 60);
      } else {
        this._error = "Falscher Code. Bitte prüfen Sie den Aufkleber.";
        if (result.retry_after && result.retry_after > 0) {
          this._startCountdown(result.retry_after);
        }
      }
    } catch (_err) {
      this._error = "Verbindungsfehler. Bitte erneut versuchen.";
    } finally {
      this._loading = false;
      this._pin = "";
    }
  }

  private _startCountdown(seconds: number): void {
    this._countdown = seconds;
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this._countdown--;
      if (this._countdown <= 0) {
        this._countdown = 0;
        if (this._timer) clearInterval(this._timer);
        this._error = "";
      }
    }, 1000);
  }

  static get styles(): CSSResultGroup {
    return [
      onBoardingStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pin-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        h1 {
          font-size: 24px;
          margin: 8px 0;
        }

        .description {
          color: var(--secondary-text-color);
          text-align: center;
          max-width: 320px;
          margin-bottom: 24px;
        }

        .pin-input-container {
          margin: 16px 0 24px;
        }

        .pin-field {
          --mdc-text-field-font-size: 32px;
          text-align: center;
          letter-spacing: 8px;
          width: 200px;
        }

        .error {
          color: var(--error-color, #c62828);
          text-align: center;
          margin: 8px 0;
          min-height: 40px;
        }

        .start {
          margin-top: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ga-setup-pin": GaSetupPin;
  }
}
