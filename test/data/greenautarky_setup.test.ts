import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GA_API_BASE } from "../../src/data/greenautarky_paths";
import {
  fetchGASetupStatus,
  acceptGASetupGDPR,
  createGASetupUser,
  joinGASubUser,
  verifyGASetupPin,
  setEthernetPreference,
  completeGASetup,
} from "../../src/data/greenautarky_setup";

/**
 * Contract between the wizard and the greenautarky_site integration.
 *
 * These drive the REAL exported functions with `fetch` mocked at the network
 * boundary, and assert on the URL each one actually requests. The previous
 * version of this file declared its own table of endpoint strings and checked
 * THAT — so it stayed green through a rename the shipped code had not made,
 * which is precisely the drift it existed to catch. Never assert against a
 * copy of the thing under test.
 */

interface Call {
  url: string;
  method: string;
}

let calls: Call[];

const jsonResponse = () =>
  new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      return Promise.resolve(jsonResponse());
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const USER_PARAMS = {
  client_id: "http://localhost:8123/",
  name: "Test User",
  username: "testuser",
  password: "SecurePass1!",
  language: "de",
};

const JOIN_PARAMS = {
  client_id: "http://localhost:8123/",
  name: "Sub User",
  password: "SecurePass1!",
  invite_pin: "123456",
  datenschutz_consent: true,
};

// [label, invocation, expected endpoint below GA_API_BASE, expected method]
const CASES: [string, () => Promise<unknown>, string, string][] = [
  ["status", () => fetchGASetupStatus(), "/status", "GET"],
  ["gdpr", () => acceptGASetupGDPR(), "/gdpr", "POST"],
  ["create_user", () => createGASetupUser(USER_PARAMS), "/create_user", "POST"],
  ["sub_user/join", () => joinGASubUser(JOIN_PARAMS), "/sub_user/join", "POST"],
  ["verify_pin", () => verifyGASetupPin("123456"), "/verify_pin", "POST"],
  ["ethernet", () => setEthernetPreference(true), "/ethernet", "POST"],
  ["complete", () => completeGASetup(), "/complete", "POST"],
];

describe("greenautarky setup API contract", () => {
  it.each(CASES)(
    "%s requests the endpoint under the shared API base",
    async (_label, invoke, endpoint, method) => {
      await invoke();
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${GA_API_BASE}${endpoint}`);
      expect(calls[0].method).toBe(method);
    }
  );

  it("every endpoint the wizard calls sits under one API base", async () => {
    for (const [, invoke] of CASES) {
      // eslint-disable-next-line no-await-in-loop
      await invoke();
    }
    // A sweep over an empty set is a failure, not a pass.
    expect(calls.length, "no fetch calls were captured").toBe(CASES.length);
    const strays = calls
      .map((c) => c.url)
      .filter((u) => !u.startsWith(`${GA_API_BASE}/`));
    expect(
      strays,
      `every GA endpoint must hang off ${GA_API_BASE}; strays: ${strays.join(
        ", "
      )}`
    ).toEqual([]);
  });
});

describe("create_user request shape", () => {
  it("sends every field the backend requires", async () => {
    await createGASetupUser(USER_PARAMS);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    for (const field of [
      "client_id",
      "name",
      "username",
      "password",
      "language",
    ]) {
      expect(body, `create_user body missing "${field}"`).toHaveProperty(field);
    }
  });
});

describe("verify_pin request shape", () => {
  it("strips the grouping dashes before sending the PIN", async () => {
    await verifyGASetupPin("123-456");
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.pin).toBe("123456");
  });
});

describe("sub_user/join request shape", () => {
  it("carries the required Datenschutz consent (ADR-0006)", async () => {
    await joinGASubUser(JOIN_PARAMS);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.datenschutz_consent).toBe(true);
    expect(body.invite_pin).toBe("123456");
  });
});
