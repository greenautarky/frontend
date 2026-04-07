import { handleFetchPromise } from "../util/hass-call-api";

export interface GASetupStatus {
  completed: boolean;
  gdpr_accepted: boolean;
  steps_done: string[];
  pin_required?: boolean;
  pin_verified?: boolean;
  pin_retry_after?: number;
}

export interface GAPinResponse {
  status: "ok" | "error" | "locked";
  message?: string;
  retry_after?: number;
  attempts?: number;
}

export interface GASetupUserResponse {
  auth_code: string;
}

export const fetchGASetupStatus = (): Promise<GASetupStatus> =>
  handleFetchPromise<GASetupStatus>(
    fetch("/api/greenautarky_onboarding/status", {
      credentials: "same-origin",
    })
  );

export const acceptGASetupGDPR = (): Promise<{ status: string }> =>
  handleFetchPromise<{ status: string }>(
    fetch("/api/greenautarky_onboarding/gdpr", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify({ accepted: true }),
    })
  );

export const createGASetupUser = (params: {
  client_id: string;
  name: string;
  username: string;
  password: string;
  language: string;
}): Promise<GASetupUserResponse> =>
  handleFetchPromise<GASetupUserResponse>(
    fetch("/api/greenautarky_onboarding/create_user", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(params),
    })
  );

export const verifyGASetupPin = (pin: string): Promise<GAPinResponse> =>
  fetch("/api/greenautarky_onboarding/verify_pin", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: pin.replace(/-/g, "") }),
  }).then((r) => r.json());

export const setEthernetPreference = (
  enable: boolean
): Promise<{ status: string }> =>
  fetch("/api/greenautarky_onboarding/ethernet", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enable_ethernet: enable }),
  }).then((r) => r.json());

export const completeGASetup = (): Promise<void> =>
  handleFetchPromise<void>(
    fetch("/api/greenautarky_onboarding/complete", {
      method: "POST",
      credentials: "same-origin",
    })
  );
