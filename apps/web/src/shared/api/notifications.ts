import type {
  ConnectChannelResponse,
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

/** Подключить канал. EMAIL — идемпотентно (verified). TELEGRAM / MAX —
 *  ответ содержит deep-link с одноразовым nonce. */
export function connectChannel(typeId: number): Promise<ConnectChannelResponse> {
  return api<ConnectChannelResponse>(
    `/customers/me/notifications/channels/${typeId}/connect`,
    { method: 'POST' },
  );
}

export function disconnectChannel(typeId: number): Promise<void> {
  return api<void>(`/customers/me/notifications/channels/${typeId}/disconnect`, {
    method: 'POST',
  });
}

export type {
  ConnectChannelResponse,
  NotificationSettingsDto,
  QuietHoursDto,
  UpdatePreferencesRequest,
  UpdateQuietHoursRequest,
};
