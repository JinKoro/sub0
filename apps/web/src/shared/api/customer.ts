import { api } from './client';

export interface CustomerProfile {
  email: string;
  name: string | null;
  timezone: string;
  localeId: number;
  currencyId: number;
  planId: number;
  notificationsEnabled: boolean;
  notificationLeadDays: number[];
  version: number;
}

export function getMe(): Promise<CustomerProfile> {
  return api<CustomerProfile>('/customers/me');
}

/** Profile card: name (+ optimistic version). */
export function saveProfile(name: string, version: number): Promise<CustomerProfile> {
  return api<CustomerProfile>('/customers/me/profile', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), version }),
  });
}

export interface PreferencesInput {
  localeId?: number;
  timezone?: string;
  currencyId?: number;
  version: number;
}

/** Region & format card: locale / timezone / currency in one request. */
export function savePreferences(input: PreferencesInput): Promise<CustomerProfile> {
  return api<CustomerProfile>('/customers/me/preferences', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return api<void>('/customers/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function deleteAccount(): Promise<void> {
  return api<void>('/customers/me', { method: 'DELETE' });
}

export function purgeSubscriptions(): Promise<void> {
  return api<void>('/customers/me/subscriptions', { method: 'DELETE' });
}
