/**
 * Pure step-navigation model for the GreenAutarky setup wizard.
 *
 * Extracted from ha-panel-greenautarky-setup so the transition rules — in
 * particular the new BACK navigation and its two irreversible gates — are unit
 * tested against the LIVE logic the panel runs, not a re-declared copy.
 *
 * Gates (a "Zurück" must never cross these backwards):
 *  - PIN gate: the pin step renders no back button, so the user can never step
 *    back across a verified device PIN.
 *  - Account gate: advancing OUT of the "user" step creates the account
 *    server-side. Crossing it clears the back history, so a later "Zurück" can
 *    never return to create-user (a second run would create a second account).
 */

export type GASetupStepType =
  | "welcome"
  | "pin"
  | "gdpr"
  | "user"
  | "analytics"
  | "ethernet";

/** Canonical forward order of the full (non-join) flow. */
export const STEP_ORDER: GASetupStepType[] = [
  "welcome",
  "pin",
  "gdpr",
  "user",
  "analytics",
  "ethernet",
];

/**
 * Steps that render their own "Zurück" button. welcome (nothing before it),
 * pin (PIN gate) and user (account gate) deliberately never do — the button is
 * absent from those components, not merely ignored.
 */
export const STEPS_WITH_BACK: GASetupStepType[] = [
  "gdpr",
  "analytics",
  "ethernet",
];

/** Leaving this step is irreversible (account created) → history is cleared. */
export const ACCOUNT_GATE_STEP: GASetupStepType = "user";

export interface NavState {
  current: GASetupStepType;
  /** Steps the user can return to, oldest first (excludes `current`). */
  history: GASetupStepType[];
}

/**
 * Move forward to `next`, recording where we came from. Crossing the account
 * gate (leaving the "user" step) clears the history so back can never return
 * to it.
 */
export function advance(state: NavState, next: GASetupStepType): NavState {
  if (state.current === ACCOUNT_GATE_STEP) {
    return { current: next, history: [] };
  }
  return { current: next, history: [...state.history, state.current] };
}

/** True when there is a recorded step to return to. */
export function canGoBack(state: NavState): boolean {
  return state.history.length > 0;
}

/** Pop one step. Returns an equal state when there is nowhere to go back to. */
export function goBack(state: NavState): NavState {
  if (!canGoBack(state)) {
    return { current: state.current, history: [...state.history] };
  }
  const history = [...state.history];
  const prev = history.pop()!;
  return { current: prev, history };
}

/**
 * Whether the CURRENT step should show/enable a back button: it must be a
 * back-capable step AND have somewhere to go. analytics is back-capable but
 * lands with an empty history right after the account gate, so its button is
 * correctly hidden there.
 */
export function backAvailableFor(state: NavState): boolean {
  return STEPS_WITH_BACK.includes(state.current) && canGoBack(state);
}

/** Progress fraction (0–1) reached after COMPLETING `step`. */
export function progressFor(step: GASetupStepType): number {
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) {
    return 0;
  }
  return (idx + 1) / STEP_ORDER.length;
}

/** What a refused (non-OK) POST /complete means for the resident. */
export type CompleteFailure =
  | { kind: "consent_missing" }
  | { kind: "already_completed" }
  | { kind: "error" };

/**
 * Classify a rejection from completeGASetup() (handleFetchPromise throws
 * `{ status_code, body }`).
 *
 * - 409 with body.code "consent_missing" AND "gdpr" among body.missing: the
 *   resident is led back to the GDPR step. The server's own text is never
 *   shown (it is English and not for residents); the page has fixed DE/EN text.
 * - 403 "already completed" (code "already_completed"; older servers: the
 *   message "Onboarding already completed"): the setup IS finished, so this is
 *   success. Any other 403 (PIN gate) is a real refusal.
 * - everything else - a 409 without the code, a consent_missing for something
 *   other than gdpr, a 5xx, a network failure - is a generic error.
 */
export function classifyCompleteError(err: any): CompleteFailure {
  const body = err?.body;
  const obj = body && typeof body === "object" ? body : undefined;
  if (
    err?.status_code === 409 &&
    obj?.code === "consent_missing" &&
    Array.isArray(obj.missing) &&
    obj.missing.includes("gdpr")
  ) {
    return { kind: "consent_missing" };
  }
  if (
    err?.status_code === 403 &&
    (obj?.code === "already_completed" ||
      obj?.message === "Onboarding already completed")
  ) {
    return { kind: "already_completed" };
  }
  return { kind: "error" };
}

/** What a refused POST /create_user means for the resident. */
export type CreateUserFailure =
  | { kind: "account_exists"; hint: string; replaceable: boolean }
  | { kind: "error"; message: string };

/**
 * Classify a rejection from the create-user call. Only 409 "account_exists"
 * (the device already has this onboarding's account under another address) gets
 * fixed, localized text; the hint is the server's masked address, and
 * `replaceable` (server-decided, true only in a PIN-verified run whose account
 * this wizard created) lets the page offer "replace account". Anything else
 * keeps showing the server's message, as before.
 */
export function classifyCreateUserError(err: any): CreateUserFailure {
  const body = err?.body;
  if (
    err?.status_code === 409 &&
    body &&
    typeof body === "object" &&
    body.code === "account_exists"
  ) {
    return {
      kind: "account_exists",
      hint: typeof body.hint === "string" ? body.hint : "",
      replaceable: body.replaceable === true,
    };
  }
  return { kind: "error", message: body?.message || err?.message || "" };
}
