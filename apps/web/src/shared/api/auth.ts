import { api } from './client';

export interface LoginResult {
  accessToken: string;
}

export function login(email: string, password: string): Promise<LoginResult> {
  return api<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
}

export function logout(): Promise<void> {
  return api<void>('/auth/logout', { method: 'POST' });
}

export interface VerifyEmailResult {
  accessToken: string;
  customer: { id: string; email: string };
}

/** Step 2 of registration: set the password for a CREATED customer. */
export function verifyEmail(token: string, password: string): Promise<VerifyEmailResult> {
  return api<VerifyEmailResult>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function resendVerification(email: string): Promise<{ status: string }> {
  return api<{ status: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export type ForgotPasswordResult = { status: 'sent' } | { status: 'archived' };

/** Always 200. `sent` for unknown/active emails (anti-enumeration); `archived`
 * for soft-deleted accounts so the UI can explain instead of lying. */
export function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  return api<ForgotPasswordResult>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Completes a password reset. Backend revokes ALL refresh tokens on success. */
export function resetPassword(token: string, newPassword: string): Promise<{ status: string }> {
  return api<{ status: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export interface RegisterInput {
  email: string;
  name: string;
  marketingConsent: boolean;
  localeId?: number;
}

export interface RegisterResult {
  status: string;
  email: string;
}

/** Step 1 of registration. timezone is taken from the browser. */
export function register(input: RegisterInput): Promise<RegisterResult> {
  return api<RegisterResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      marketingConsent: input.marketingConsent,
      ...(input.localeId ? { localeId: input.localeId } : {}),
    }),
  });
}
