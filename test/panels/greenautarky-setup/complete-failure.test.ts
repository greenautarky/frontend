import { describe, it, expect } from "vitest";
import { classifyCompleteError } from "../../../src/panels/greenautarky-setup/setup-flow";

// Odoo #1695: the wizard used to swallow a refused POST /complete. The panel
// classifies the rejection of completeGASetup() ({status_code, body}, as thrown
// by handleFetchPromise); only consent_missing leads back to the GDPR step.
describe("classifyCompleteError", () => {
  it("409 consent_missing carries the server message", () => {
    expect(
      classifyCompleteError({
        error: "Response error: 409",
        status_code: 409,
        body: { code: "consent_missing", missing: ["gdpr"], message: "Required consent not recorded: gdpr." },
      })
    ).toEqual({ kind: "consent_missing", message: "Required consent not recorded: gdpr." });
  });

  it("a 409 without the code is a generic error", () => {
    expect(classifyCompleteError({ status_code: 409, body: { message: "No resident account" } }))
      .toEqual({ kind: "error" });
  });

  it.each([
    [{ status_code: 403, body: { message: "Onboarding already completed" } }],
    [{ status_code: 500, body: "boom" }],
    [{ status_code: undefined, body: undefined }],
    [undefined],
    [null],
  ])("%j is a generic error", (err) => {
    expect(classifyCompleteError(err)).toEqual({ kind: "error" });
  });
});
