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
  | "info_pages"
  | "analytics"
  | "ethernet";

/** Canonical forward order of the full (non-join) flow. */
export const STEP_ORDER: GASetupStepType[] = [
  "welcome",
  "pin",
  "gdpr",
  "user",
  "info_pages",
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
  "info_pages",
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
 * back-capable step AND have somewhere to go. info_pages is back-capable but
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
