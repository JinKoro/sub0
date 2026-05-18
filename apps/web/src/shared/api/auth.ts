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
