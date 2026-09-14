import { GA_API_BASE } from "./greenautarky_paths";
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
    fetch(`${GA_API_BASE}/status`, {
      credentials: "same-origin",
    })
  );

export const acceptGASetupGDPR = (): Promise<{ status: string }> =>
  handleFetchPromise<{ status: string }>(
    fetch(`${GA_API_BASE}/gdpr`, {
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
    fetch(`${GA_API_BASE}/create_user`, {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(params),
    })
  );

export interface GASubUserJoinResponse {
  status: string;
  username: string;
  auth_code?: string;
}

export const joinGASubUser = (params: {
  client_id: string;
  name: string;
  password: string;
  invite_pin: string;
  /** Required Datenschutz consent (sub-user = separate data subject). */
  datenschutz_consent: boolean;
}): Promise<GASubUserJoinResponse> =>
  handleFetchPromise<GASubUserJoinResponse>(
    fetch(`${GA_API_BASE}/sub_user/join`, {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(params),
    })
  );

export const verifyGASetupPin = (pin: string): Promise<GAPinResponse> =>
  fetch(`${GA_API_BASE}/verify_pin`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: pin.replace(/-/g, "") }),
  }).then((r) => r.json());

export const setEthernetPreference = (
  enable: boolean
): Promise<{ status: string }> =>
  fetch(`${GA_API_BASE}/ethernet`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enable_ethernet: enable }),
  }).then((r) => r.json());

export const completeGASetup = (): Promise<void> =>
  handleFetchPromise<void>(
    fetch(`${GA_API_BASE}/complete`, {
      method: "POST",
      credentials: "same-origin",
    })
  );
