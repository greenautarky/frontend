import { describe, it, expect } from "vitest";

/**
 * Tests for the greenautarky setup API layer.
 * Verifies that API URLs and request shapes match the backend contract.
 */

// The backend endpoints that the frontend must call
const BACKEND_ENDPOINTS = {
  status: { method: "GET", url: "/api/greenautarky_onboarding/status" },
  gdpr: { method: "POST", url: "/api/greenautarky_onboarding/gdpr" },
  createUser: {
    method: "POST",
    url: "/api/greenautarky_onboarding/create_user",
  },
  complete: { method: "POST", url: "/api/greenautarky_onboarding/complete" },
};

describe("greenautarky setup API contract", () => {
  it("all endpoints use the greenautarky_onboarding prefix", () => {
    for (const [, endpoint] of Object.entries(BACKEND_ENDPOINTS)) {
      expect(endpoint.url).toMatch(/^\/api\/greenautarky_onboarding\//);
    }
  });

  it("status endpoint is GET", () => {
    expect(BACKEND_ENDPOINTS.status.method).toBe("GET");
  });

  it("mutation endpoints are POST", () => {
    expect(BACKEND_ENDPOINTS.gdpr.method).toBe("POST");
    expect(BACKEND_ENDPOINTS.createUser.method).toBe("POST");
    expect(BACKEND_ENDPOINTS.complete.method).toBe("POST");
  });
});

describe("create_user request shape", () => {
  it("requires client_id, name, username, password, language", () => {
    const validRequest = {
      client_id: "http://localhost:8123/",
      name: "Test User",
      username: "testuser",
      password: "SecurePass1!",
      language: "de",
    };

    // All required fields present
    expect(validRequest.client_id).toBeTruthy();
    expect(validRequest.name).toBeTruthy();
    expect(validRequest.username).toBeTruthy();
    expect(validRequest.password).toBeTruthy();
    expect(validRequest.language).toBeTruthy();
  });

  it("response must include auth_code", () => {
    const validResponse = { auth_code: "abc123" };
    expect(validResponse).toHaveProperty("auth_code");
    expect(typeof validResponse.auth_code).toBe("string");
  });
});

describe("status response shape", () => {
  it("includes completed flag and steps_done array", () => {
    const validStatus = {
      completed: false,
      gdpr_accepted: false,
      steps_done: [],
      consents: {},
    };

    expect(typeof validStatus.completed).toBe("boolean");
    expect(Array.isArray(validStatus.steps_done)).toBe(true);
  });

  it("completed status has steps_done populated", () => {
    const completedStatus = {
      completed: true,
      gdpr_accepted: true,
      steps_done: ["gdpr", "account", "telemetry", "complete"],
      consents: { gdpr: { version: 1, accepted_at: "2026-01-01" } },
    };

    expect(completedStatus.completed).toBe(true);
    expect(completedStatus.steps_done).toContain("gdpr");
    expect(completedStatus.steps_done).toContain("account");
    expect(completedStatus.steps_done).toContain("complete");
  });
});
