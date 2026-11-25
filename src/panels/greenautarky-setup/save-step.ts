import { classifyCompleteError } from "./setup-flow";

/** What a failed save of a wizard step means for the resident. */
export type SaveFailure =
  /** Try again. */
  | "failed"
  /** The wizard session is over; only starting the setup again helps. */
  | "session_expired"
  /** The device has no such setting; trying again cannot succeed. */
  | "unavailable"
  /** The setup was finished elsewhere; there is nothing left to save here. */
  | "already_completed";

export const SAVE_TIMEOUT_MS = 15000;

/** Classify the rejection of a step's save call (websocket or fetch). */
export function classifySaveError(err: any): SaveFailure {
  if (err?.code === "unknown_command") {
    return "unavailable";
  }
  if (classifyCompleteError(err).kind === "already_completed") {
    return "already_completed";
  }
  return err?.status_code === 403 ? "session_expired" : "failed";
}

/**
 * Whether the page offers to go on without saving. Finishing the setup does not
 * depend on these two answers, so a save that cannot succeed must not hold the
 * resident here: at once when the device has no such setting, otherwise from
 * the second failed try. Never after a lost session, finishing needs it too.
 */
export function offerContinueUnsaved(
  failure: SaveFailure | undefined,
  failedTries: number
): boolean {
  return (
    failure === "unavailable" || (failure === "failed" && failedTries >= 2)
  );
}

/** Reject when `promise` has not settled in time, so a step never hangs. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = SAVE_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
