import { handleFetchPromise } from "../util/hass-call-api";

export interface GASetupStatus {
  completed: boolean;
  gdpr_accepted: boolean;
  steps_done: string[];
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

export const completeGASetup = (): Promise<void> =>
  handleFetchPromise<void>(
    fetch("/api/greenautarky_onboarding/complete", {
      method: "POST",
      credentials: "same-origin",
    })
  );
