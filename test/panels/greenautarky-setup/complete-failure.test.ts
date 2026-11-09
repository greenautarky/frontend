import { describe, it, expect } from "vitest";
import {
  classifyCompleteError,
  classifyCreateUserError,
} from "../../../src/panels/greenautarky-setup/setup-flow";

// Odoo #1695: the wizard used to swallow a refused POST /complete. The panel
// classifies the rejection of completeGASetup() ({status_code, body}, as thrown
// by handleFetchPromise); only a gdpr consent_missing leads back to the GDPR
// step, and an "already completed" 403 is success.
describe("classifyCompleteError", () => {
  it("409 consent_missing for gdpr leads back to the GDPR step", () => {
    expect(
      classifyCompleteError({
        error: "Response error: 409",
        status_code: 409,
        body: {
          code: "consent_missing",
          missing: ["gdpr"],
          message: "Required consent not recorded: gdpr.",
        },
      })
    ).toEqual({ kind: "consent_missing" });
  });

  it("consent_missing for something other than gdpr is a generic error", () => {
    expect(
      classifyCompleteError({
        status_code: 409,
        body: { code: "consent_missing", missing: ["other"] },
      })
    ).toEqual({ kind: "error" });
    expect(
      classifyCompleteError({
        status_code: 409,
        body: { code: "consent_missing" },
      })
    ).toEqual({ kind: "error" });
  });

  it("a 409 without the code is a generic error", () => {
    expect(
      classifyCompleteError({
        status_code: 409,
        body: { message: "No resident account" },
      })
    ).toEqual({ kind: "error" });
  });

  it("403 already completed is success, by code or by the older message", () => {
    expect(
      classifyCompleteError({
        status_code: 403,
        body: { code: "already_completed", message: "x" },
      })
    ).toEqual({ kind: "already_completed" });
    expect(
      classifyCompleteError({
        status_code: 403,
        body: { message: "Onboarding already completed" },
      })
    ).toEqual({ kind: "already_completed" });
  });

  it.each([
    [{ status_code: 403, body: { error: "PIN verification required" } }],
    [{ status_code: 500, body: "boom" }],
    [{ status_code: undefined, body: undefined }],
    [undefined],
    [null],
  ])("%j is a generic error", (err) => {
    expect(classifyCompleteError(err)).toEqual({ kind: "error" });
  });
});

describe("classifyCreateUserError", () => {
  it("409 account_exists carries the masked hint", () => {
    expect(
      classifyCreateUserError({
        status_code: 409,
        body: { code: "account_exists", hint: "r***@example.invalid" },
      })
    ).toEqual({
      kind: "account_exists",
      hint: "r***@example.invalid",
      replaceable: false,
    });
  });

  it("anything else keeps the server message", () => {
    expect(
      classifyCreateUserError({ status_code: 401, body: { message: "wrong" } })
    ).toEqual({ kind: "error", message: "wrong" });
    expect(classifyCreateUserError(new Error("net"))).toEqual({
      kind: "error",
      message: "net",
    });
  });
});
