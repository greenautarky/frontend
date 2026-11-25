import { afterEach, describe, expect, it, vi } from "vitest";
import { setEthernetPreference } from "../../../src/data/greenautarky_setup";
import {
  classifySaveError,
  offerContinueUnsaved,
  withTimeout,
} from "../../../src/panels/greenautarky-setup/save-step";
import { messages as de } from "../../../src/panels/greenautarky-setup/translations/de";
import { messages as en } from "../../../src/panels/greenautarky-setup/translations/en";

describe("classifySaveError", () => {
  it.each([
    [{ code: "unknown_command" }, "unavailable"],
    [{ code: "unauthorized" }, "failed"],
    [{ code: "unknown_error" }, "failed"],
    [3, "failed"],
    [undefined, "failed"],
    [new Error("timeout"), "failed"],
    [{ status_code: 500, body: {} }, "failed"],
    [{ status_code: undefined }, "failed"],
    [{ status_code: 403, body: { error: "x" } }, "session_expired"],
    [
      { status_code: 403, body: { code: "already_completed" } },
      "already_completed",
    ],
  ])("%j -> %s", (err, want) => {
    expect(classifySaveError(err)).toBe(want);
  });
});

describe("offerContinueUnsaved", () => {
  it.each([
    [undefined, 0, false],
    ["failed", 1, false],
    ["failed", 2, true],
    ["unavailable", 1, true],
    ["session_expired", 5, false],
    ["already_completed", 5, false],
  ] as const)("%s after %i tries -> %s", (failure, tries, want) => {
    expect(offerContinueUnsaved(failure, tries)).toBe(want);
  });
});

describe("withTimeout", () => {
  it("rejects a save that never answers and passes a result through", async () => {
    await expect(
      withTimeout(
        new Promise(() => {
          // never settles
        }),
        5
      )
    ).rejects.toThrow("timeout");
    await expect(withTimeout(Promise.resolve(1), 1000)).resolves.toBe(1);
    await expect(
      withTimeout(Promise.reject(new Error("x")), 1000)
    ).rejects.toThrow("x");
  });
});

describe("setEthernetPreference", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([403, 500])("rejects on HTTP %i", async (status) => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ message: "x" }), {
          status,
          headers: { "content-type": "application/json" },
        })
    );
    await expect(setEthernetPreference(true)).rejects.toMatchObject({
      status_code: status,
    });
  });
  it("resolves on success", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
        })
    );
    await expect(setEthernetPreference(false)).resolves.toEqual({
      status: "ok",
    });
  });
});

describe("texts", () => {
  it.each([
    "failed",
    "unavailable",
    "session_expired",
    "retry",
    "restart",
    "continue_unsaved",
  ])("%s exists in both languages", (key) => {
    const id = `ui.panel.greenautarky_setup.save.${key}`;
    expect(de[id]).toBeTruthy();
    expect(en[id]).toBeTruthy();
  });
});
