export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

const LEVELS: PasswordStrength[] = [
  { score: 0, label: "Zu schwach", color: "var(--error-color, #db4437)" },
  { score: 1, label: "Schwach", color: "var(--error-color, #db4437)" },
  { score: 2, label: "Ausreichend", color: "var(--warning-color, #ffa726)" },
  { score: 3, label: "Gut", color: "#8bc34a" },
  { score: 4, label: "Stark", color: "var(--success-color, #43a047)" },
];

export const computePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: "", color: "transparent" };
  }
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);
  return LEVELS[score];
};

export const PASSWORD_RULES = [
  {
    test: (pw: string) => pw.length >= MIN_PASSWORD_LENGTH,
    label: `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`,
  },
  {
    test: (pw: string) => /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    label: "Gross- und Kleinbuchstaben",
  },
  {
    test: (pw: string) => /\d/.test(pw),
    label: "Mindestens eine Zahl",
  },
  {
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
    label: "Mindestens ein Sonderzeichen",
  },
];
