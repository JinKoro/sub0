import type {
  NotificationSettingsDto,
  QuietHoursDto,
  UpdatePreferencesRequest,
  UpdateQuietHoursRequest,
} from '@subzero/shared';

import { api } from './client';

export function getNotificationSettings(): Promise<NotificationSettingsDto> {
  return api<NotificationSettingsDto>('/customers/me/notifications');
}

export function updatePreferences(
  body: UpdatePreferencesRequest,
): Promise<NotificationSettingsDto> {
  return api<NotificationSettingsDto>('/customers/me/notifications/preferences', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateQuietHours(body: UpdateQuietHoursRequest): Promise<QuietHoursDto> {
  return api<QuietHoursDto>('/customers/me/quiet-hours', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type {
  NotificationSettingsDto,
  QuietHoursDto,
  UpdatePreferencesRequest,
  UpdateQuietHoursRequest,
};
