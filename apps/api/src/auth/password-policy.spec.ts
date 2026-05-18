import { PASSWORD_MAX, PASSWORD_MIN, isValidPassword } from '@subzero/shared';

describe('password policy (shared)', () => {
  it('exposes the agreed bounds (owner decision: min 8)', () => {
    expect(PASSWORD_MIN).toBe(8);
    expect(PASSWORD_MAX).toBe(128);
  });

  it('accepts a password with ≥1 letter and ≥1 digit, length ≥ 8', () => {
    expect(isValidPassword('passw0rd')).toBe(true);
    expect(isValidPassword('Sup3rSecret')).toBe(true);
  });

  it('rejects too short', () => {
    expect(isValidPassword('p4ss')).toBe(false);
  });

  it('rejects letters-only and digits-only', () => {
    expect(isValidPassword('onlyletters')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
  });

  it('rejects over the max length', () => {
    expect(isValidPassword(`a1${'x'.repeat(PASSWORD_MAX)}`)).toBe(false);
  });

  it('rejects non-string / empty', () => {
    expect(isValidPassword('')).toBe(false);
    expect(isValidPassword(undefined as unknown as string)).toBe(false);
  });
});
