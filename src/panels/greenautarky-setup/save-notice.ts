import type { TemplateResult } from "lit";
import { html, nothing } from "lit";
import type { LocalizeFunc } from "../../common/translations/localize";
import "../../components/ha-alert";
import "../../components/ha-button";
import type { SaveFailure } from "./save-step";
import { offerContinueUnsaved } from "./save-step";

const restartSetup = (): void => window.location.reload();

/** The message under a step whose save failed, with the ways on that make sense. */
export function renderSaveNotice(
  localize: LocalizeFunc,
  failure: SaveFailure | undefined,
  failedTries: number,
  continueUnsaved: () => void
): TemplateResult | typeof nothing {
  if (!failure || failure === "already_completed") {
    return nothing;
  }
  return html`
    <ha-alert alert-type="error" class="save-failed">
      ${localize(`ui.panel.greenautarky_setup.save.${failure}`)}
    </ha-alert>
    ${failure === "session_expired"
      ? html`<ha-button class="save-restart" @click=${restartSetup}
          >${localize("ui.panel.greenautarky_setup.save.restart")}</ha-button
        >`
      : nothing}
    ${offerContinueUnsaved(failure, failedTries)
      ? html`<ha-button class="continue-unsaved" @click=${continueUnsaved}
          >${localize(
            "ui.panel.greenautarky_setup.save.continue_unsaved"
          )}</ha-button
        >`
      : nothing}
  `;
}
