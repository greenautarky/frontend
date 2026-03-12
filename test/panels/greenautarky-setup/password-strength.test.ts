import { describe, it, expect } from "vitest";
import {
  computePasswordStrength,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULES,
} from "../../../src/panels/greenautarky-setup/password-strength";

describe("computePasswordStrength", () => {
  it("returns score 0 with empty label for empty password", () => {
    const result = computePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("");
    expect(result.color).toBe("transparent");
  });

  it("returns 'Zu schwach' for very short password", () => {
    const result = computePasswordStrength("abc");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Zu schwach");
  });

  it("returns 'Schwach' for password meeting only length requirement", () => {
    const result = computePasswordStrength("abcdefgh");
    expect(result.score).toBe(1);
    expect(result.label).toBe("Schwach");
  });

  it("returns 'Ausreichend' for password with length + mixed case", () => {
    const result = computePasswordStrength("Abcdefgh");
    expect(result.score).toBe(2);
    expect(result.label).toBe("Ausreichend");
  });

  it("returns 'Gut' for password with length + mixed case + digit", () => {
    const result = computePasswordStrength("Abcdefg1");
    expect(result.score).toBe(3);
    expect(result.label).toBe("Gut");
  });

  it("returns 'Stark' for password with all criteria met", () => {
    const result = computePasswordStrength("Abcdefg1!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("Stark");
  });

  it("gives bonus score for length >= 12", () => {
    // 12+ chars lowercase only = length(1) + long(1) = 2
    const result = computePasswordStrength("abcdefghijkl");
    expect(result.score).toBe(2);
  });

  it("caps score at 4", () => {
    // Long + mixed case + digit + special = 5 criteria, capped at 4
    const result = computePasswordStrength("Abcdefghijkl1!");
    expect(result.score).toBe(4);
  });

  it("7 chars (below minimum) scores 0 even with all criteria", () => {
    const result = computePasswordStrength("Abc1!ef");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Zu schwach");
  });

  it("11 chars does not get length bonus", () => {
    const result = computePasswordStrength("abcdefghijk");
    expect(result.score).toBe(1);
  });

  it("password with spaces counts toward length", () => {
    const result = computePasswordStrength("Pass wor1!");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });
});

describe("MIN_PASSWORD_LENGTH", () => {
  it("is 8", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });
});

describe("PASSWORD_RULES", () => {
  it("has 4 rules", () => {
    expect(PASSWORD_RULES).toHaveLength(4);
  });

  it("length rule passes for 8+ chars", () => {
    expect(PASSWORD_RULES[0].test("12345678")).toBe(true);
    expect(PASSWORD_RULES[0].test("1234567")).toBe(false);
  });

  it("mixed case rule requires both upper and lower", () => {
    expect(PASSWORD_RULES[1].test("Ab")).toBe(true);
    expect(PASSWORD_RULES[1].test("ab")).toBe(false);
    expect(PASSWORD_RULES[1].test("AB")).toBe(false);
  });

  it("digit rule requires at least one number", () => {
    expect(PASSWORD_RULES[2].test("abc1")).toBe(true);
    expect(PASSWORD_RULES[2].test("abcd")).toBe(false);
  });

  it("special char rule requires non-alphanumeric", () => {
    expect(PASSWORD_RULES[3].test("abc!")).toBe(true);
    expect(PASSWORD_RULES[3].test("abc1")).toBe(false);
  });
});
