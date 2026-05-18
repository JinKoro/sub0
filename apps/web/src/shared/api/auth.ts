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
