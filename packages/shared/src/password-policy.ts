// Single source of truth for password rules — used by api (DTO validation)
// and web (#50 set-password / reset forms). Owner decision: min 8.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

// ≥1 letter and ≥1 digit.
const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

export function isValidPassword(pw: string): boolean {
  if (typeof pw !== 'string') {
    return false;
  }
  if (pw.length < PASSWORD_MIN || pw.length > PASSWORD_MAX) {
    return false;
  }
  return HAS_LETTER.test(pw) && HAS_DIGIT.test(pw);
}
