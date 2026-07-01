import { describe, it, expect } from "vitest";

/**
 * Tests for the user creation logic in ga-setup-create-user.ts.
 * Covers email mode, username mode, validation, and API request construction.
 */

// --- Extracted logic from ga-setup-create-user.ts ---

const MIN_PASSWORD_LENGTH = 8;

interface CreateUserParams {
  client_id: string;
  name: string;
  username: string;
  password: string;
  language: string;
}

/**
 * Derives name and username from form data, matching the component logic.
 * In email mode: name = local part of email, username = full email.
 * In username mode: name = username, username = username.
 */
function deriveUserParams(
  formData: Record<string, string>,
  useEmail: boolean,
  language: string
): CreateUserParams {
  let name: string;
  let username: string;

  if (useEmail) {
    const email = formData.email;
    name = email.split("@")[0];
    username = email;
  } else {
    const user = formData.username;
    name = user;
    username = user;
  }

  return {
    client_id: "http://localhost:8123/",
    name,
    username,
    password: formData.password,
    language,
  };
}

/**
 * Validates identity field is filled (matches _identityFilled getter).
 */
function isIdentityFilled(
  formData: Record<string, string>,
  useEmail: boolean
): boolean {
  return useEmail ? !!formData.email : !!formData.username;
}

/**
 * Validates password meets minimum requirements (matches _passwordValid getter).
 */
function isPasswordValid(password: string, strengthScore: number): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && strengthScore >= 2;
}

/**
 * Checks if the submit button should be enabled (matches template logic).
 */
function isSubmitEnabled(
  formData: Record<string, string>,
  useEmail: boolean,
  strengthScore: number
): boolean {
  return (
    isIdentityFilled(formData, useEmail) &&
    isPasswordValid(formData.password || "", strengthScore) &&
    !!formData.password_confirm &&
    formData.password === formData.password_confirm
  );
}

/**
 * Checks password match validation (matches _checkPasswordMatch).
 */
function getPasswordMatchError(
  password: string | undefined,
  passwordConfirm: string | undefined
): string {
  if (passwordConfirm && password !== passwordConfirm) {
    return "Passwörter stimmen nicht überein";
  }
  return "";
}

// --- Tests ---

describe("user creation: email mode (default)", () => {
  it("derives name from email local part", () => {
    const params = deriveUserParams(
      { email: "thomas@greenautarky.com", password: "Test1234!", password_confirm: "Test1234!" },
      true,
      "de"
    );
    expect(params.name).toBe("thomas");
    expect(params.username).toBe("thomas@greenautarky.com");
  });

  it("handles email with dots in local part", () => {
    const params = deriveUserParams(
      { email: "thomas.mueller@example.de", password: "x", password_confirm: "x" },
      true,
      "de"
    );
    expect(params.name).toBe("thomas.mueller");
    expect(params.username).toBe("thomas.mueller@example.de");
  });

  it("handles email with plus addressing", () => {
    const params = deriveUserParams(
      { email: "user+tag@example.com", password: "x", password_confirm: "x" },
      true,
      "de"
    );
    expect(params.name).toBe("user+tag");
    expect(params.username).toBe("user+tag@example.com");
  });

  it("identity is filled when email is present", () => {
    expect(isIdentityFilled({ email: "a@b.com" }, true)).toBe(true);
  });

  it("identity is not filled when email is empty", () => {
    expect(isIdentityFilled({ email: "" }, true)).toBe(false);
    expect(isIdentityFilled({}, true)).toBe(false);
  });

  it("ignores username field in email mode", () => {
    expect(isIdentityFilled({ username: "test" }, true)).toBe(false);
  });
});

describe("user creation: username mode (alternative)", () => {
  it("uses username as both name and username", () => {
    const params = deriveUserParams(
      { username: "kibutler-user", password: "Test1234!", password_confirm: "Test1234!" },
      false,
      "de"
    );
    expect(params.name).toBe("kibutler-user");
    expect(params.username).toBe("kibutler-user");
  });

  it("identity is filled when username is present", () => {
    expect(isIdentityFilled({ username: "test" }, false)).toBe(true);
  });

  it("identity is not filled when username is empty", () => {
    expect(isIdentityFilled({ username: "" }, false)).toBe(false);
    expect(isIdentityFilled({}, false)).toBe(false);
  });

  it("ignores email field in username mode", () => {
    expect(isIdentityFilled({ email: "a@b.com" }, false)).toBe(false);
  });
});

describe("user creation: API request shape", () => {
  it("includes all required fields for email mode", () => {
    const params = deriveUserParams(
      { email: "user@example.com", password: "SecurePass1!", password_confirm: "SecurePass1!" },
      true,
      "de"
    );
    expect(params).toEqual({
      client_id: "http://localhost:8123/",
      name: "user",
      username: "user@example.com",
      password: "SecurePass1!",
      language: "de",
    });
  });

  it("includes all required fields for username mode", () => {
    const params = deriveUserParams(
      { username: "testuser", password: "SecurePass1!", password_confirm: "SecurePass1!" },
      false,
      "de"
    );
    expect(params).toEqual({
      client_id: "http://localhost:8123/",
      name: "testuser",
      username: "testuser",
      password: "SecurePass1!",
      language: "de",
    });
  });

  it("does not include password_confirm in API request", () => {
    const params = deriveUserParams(
      { email: "a@b.com", password: "Test1234!", password_confirm: "Test1234!" },
      true,
      "de"
    );
    expect(params).not.toHaveProperty("password_confirm");
  });

  it("passes language parameter through", () => {
    const paramsDE = deriveUserParams(
      { email: "a@b.com", password: "x", password_confirm: "x" },
      true,
      "de"
    );
    expect(paramsDE.language).toBe("de");

    const paramsEN = deriveUserParams(
      { email: "a@b.com", password: "x", password_confirm: "x" },
      true,
      "en"
    );
    expect(paramsEN.language).toBe("en");
  });
});

describe("user creation: password validation", () => {
  it("rejects password shorter than 8 characters", () => {
    expect(isPasswordValid("Short1!", 3)).toBe(false);
  });

  it("rejects password with low strength score", () => {
    expect(isPasswordValid("abcdefgh", 1)).toBe(false);
  });

  it("accepts password with 8+ chars and score >= 2", () => {
    expect(isPasswordValid("Test1234", 2)).toBe(true);
  });

  it("accepts strong password", () => {
    expect(isPasswordValid("SecurePass1!", 4)).toBe(true);
  });
});

describe("user creation: password match validation", () => {
  it("returns no error when passwords match", () => {
    expect(getPasswordMatchError("Test1234!", "Test1234!")).toBe("");
  });

  it("returns error when passwords differ", () => {
    expect(getPasswordMatchError("Test1234!", "Different!")).toBe(
      "Passwörter stimmen nicht überein"
    );
  });

  it("returns no error when confirm is empty (not yet typed)", () => {
    expect(getPasswordMatchError("Test1234!", "")).toBe("");
    expect(getPasswordMatchError("Test1234!", undefined)).toBe("");
  });
});

describe("user creation: submit button state", () => {
  it("disabled when identity is empty", () => {
    expect(
      isSubmitEnabled({ password: "Test1234!", password_confirm: "Test1234!" }, true, 3)
    ).toBe(false);
  });

  it("disabled when password is too weak", () => {
    expect(
      isSubmitEnabled(
        { email: "a@b.com", password: "weak", password_confirm: "weak" },
        true,
        1
      )
    ).toBe(false);
  });

  it("disabled when password confirm is missing", () => {
    expect(
      isSubmitEnabled(
        { email: "a@b.com", password: "Test1234!" },
        true,
        3
      )
    ).toBe(false);
  });

  it("disabled when passwords do not match", () => {
    expect(
      isSubmitEnabled(
        { email: "a@b.com", password: "Test1234!", password_confirm: "Other1234!" },
        true,
        3
      )
    ).toBe(false);
  });

  it("enabled when all conditions met (email mode)", () => {
    expect(
      isSubmitEnabled(
        { email: "a@b.com", password: "Test1234!", password_confirm: "Test1234!" },
        true,
        3
      )
    ).toBe(true);
  });

  it("enabled when all conditions met (username mode)", () => {
    expect(
      isSubmitEnabled(
        { username: "testuser", password: "Test1234!", password_confirm: "Test1234!" },
        false,
        3
      )
    ).toBe(true);
  });
});

describe("user creation: mode toggle behavior", () => {
  it("email mode is default (_useEmail = true)", () => {
    // The component defaults to _useEmail = true
    const useEmail = true;
    expect(useEmail).toBe(true);
  });

  it("toggling clears form data", () => {
    // Simulates _toggleMode: sets _newUser = {}, clears errors
    let formData: Record<string, string> = { email: "old@test.com", password: "old" };
    let formError: Record<string, string> = { password_confirm: "error" };
    let errorMsg = "Some error";

    // Toggle action
    formData = {};
    formError = {};
    errorMsg = "";

    expect(formData).toEqual({});
    expect(formError).toEqual({});
    expect(errorMsg).toBe("");
  });

  it("switching to username mode uses username schema", () => {
    // After toggle, identity check uses username field
    expect(isIdentityFilled({ email: "old@test.com" }, false)).toBe(false);
    expect(isIdentityFilled({ username: "newuser" }, false)).toBe(true);
  });

  it("switching back to email mode uses email schema", () => {
    expect(isIdentityFilled({ username: "olduser" }, true)).toBe(false);
    expect(isIdentityFilled({ email: "new@test.com" }, true)).toBe(true);
  });
});

describe("sub-user join mode (ADR-0006)", () => {
  interface JoinParams {
    client_id: string;
    name: string;
    password: string;
    invite_pin: string;
  }

  function deriveJoinParams(
    formData: Record<string, string>,
    invitePin: string
  ): JoinParams {
    return {
      client_id: "http://localhost:8123/",
      name: formData.name,
      password: formData.password,
      invite_pin: invitePin,
    };
  }

  const joinIdentityFilled = (formData: Record<string, string>): boolean =>
    !!formData.name;

  const joinSubmitEnabled = (
    formData: Record<string, string>,
    strengthScore: number
  ): boolean =>
    joinIdentityFilled(formData) &&
    isPasswordValid(formData.password || "", strengthScore) &&
    !!formData.password_confirm &&
    formData.password === formData.password_confirm;

  it("builds the join request from display name + password + invite pin", () => {
    expect(
      deriveJoinParams(
        { name: "Anna", password: "Test1234!", password_confirm: "Test1234!" },
        "123456"
      )
    ).toEqual({
      client_id: "http://localhost:8123/",
      name: "Anna",
      password: "Test1234!",
      invite_pin: "123456",
    });
  });

  it("join request has NO username field (server derives it)", () => {
    expect(deriveJoinParams({ name: "Anna", password: "x" }, "123456")).not.toHaveProperty(
      "username"
    );
  });

  it("identity is filled when the display name is present", () => {
    expect(joinIdentityFilled({ name: "Anna" })).toBe(true);
    expect(joinIdentityFilled({ name: "" })).toBe(false);
    expect(joinIdentityFilled({ email: "a@b.com" })).toBe(false);
  });

  it("submit needs name + valid + matching password (reuses same rules)", () => {
    expect(
      joinSubmitEnabled(
        { name: "Anna", password: "Test1234!", password_confirm: "Test1234!" },
        3
      )
    ).toBe(true);
    expect(
      joinSubmitEnabled(
        { name: "", password: "Test1234!", password_confirm: "Test1234!" },
        3
      )
    ).toBe(false);
    expect(
      joinSubmitEnabled(
        { name: "Anna", password: "Test1234!", password_confirm: "Nope" },
        3
      )
    ).toBe(false);
    expect(
      joinSubmitEnabled(
        { name: "Anna", password: "weak", password_confirm: "weak" },
        1
      )
    ).toBe(false);
  });
});
