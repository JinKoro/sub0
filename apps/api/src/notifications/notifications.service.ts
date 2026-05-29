import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationChannelType,
  NotificationEvent,
  type NotificationPreferenceDto,
  type NotificationSettingsDto,
  type QuietHoursDto,
  type UpdatePreferencesRequest,
  type UpdateQuietHoursRequest,
} from '@subzero/shared';

import type { NotificationsRepository } from './notifications.types';

/** Дефолты, которые отдаём при первом GET, если строки в БД ещё нет.
 *  В БД не пишем до явного PATCH — это экономит мусорные записи на
 *  тех, кто настройки не трогал. */
const DEFAULT_PREFERENCE: Record<number, NotificationPreferenceDto> = {
  [NotificationEvent.UPCOMING_CHARGE]: {
    eventId: NotificationEvent.UPCOMING_CHARGE,
    enabled: true,
    channelTypeIds: [NotificationChannelType.EMAIL],
    daysBefore: [3],
  },
  [NotificationEvent.TRIAL_END]: {
    eventId: NotificationEvent.TRIAL_END,
    enabled: false,
    channelTypeIds: [],
    daysBefore: [],
  },
  [NotificationEvent.PLAN_RENEWAL]: {
    eventId: NotificationEvent.PLAN_RENEWAL,
    enabled: false,
    channelTypeIds: [],
    daysBefore: [],
  },
  [NotificationEvent.MONTHLY_REPORT]: {
    eventId: NotificationEvent.MONTHLY_REPORT,
    enabled: false,
    channelTypeIds: [],
    daysBefore: [],
  },
  [NotificationEvent.RELEASES]: {
    eventId: NotificationEvent.RELEASES,
    enabled: false,
    channelTypeIds: [],
    daysBefore: [],
  },
};

const ALL_EVENT_IDS = Object.values(NotificationEvent).filter(
  (v): v is number => typeof v === 'number',
);

const VALID_CHANNEL_IDS = new Set<number>(
  Object.values(NotificationChannelType).filter((v): v is number => typeof v === 'number'),
);

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DAYS_BEFORE = 30;

export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async getSettings(customerId: string): Promise<NotificationSettingsDto> {
    const stored = await this.repo.listPreferences(customerId);
    const byEvent = new Map(stored.map((p) => [p.eventId, p]));
    // Сшиваем хранилище с дефолтами: для каждого известного event'а
    // отдаём либо реальную строку, либо дефолт.
    const preferences = ALL_EVENT_IDS.map(
      (id) => byEvent.get(id) ?? DEFAULT_PREFERENCE[id],
    ).filter((p): p is NotificationPreferenceDto => p !== undefined);

    const quietHoursRow = await this.repo.readQuietHours(customerId);
    if (!quietHoursRow) throw new NotFoundException('customer not found');

    return {
      preferences,
      quietHours: quietHoursRow.data,
    };
  }

  async updatePreferences(
    customerId: string,
    body: UpdatePreferencesRequest,
  ): Promise<NotificationSettingsDto> {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('items must not be empty');
    }
    const validEventIds = new Set<number>(ALL_EVENT_IDS);
    // Merge с предыдущим состоянием: PATCH может не присылать все поля,
    // дефолт берём из БД-строки либо из синтетического дефолта.
    const existing = await this.repo.listPreferences(customerId);
    const existingMap = new Map(existing.map((p) => [p.eventId, p]));

    const upserts: Array<{
      eventId: number;
      enabled: boolean;
      channelTypeIds: number[];
      daysBefore: number[];
    }> = [];

    for (const item of body.items) {
      if (!validEventIds.has(item.eventId)) {
        throw new BadRequestException(`unknown eventId: ${item.eventId}`);
      }
      const fallback = existingMap.get(item.eventId) ?? DEFAULT_PREFERENCE[item.eventId];
      if (!fallback) {
        throw new BadRequestException(`unknown eventId: ${item.eventId}`);
      }
      const channelTypeIds = item.channelTypeIds ?? fallback.channelTypeIds;
      const daysBefore = item.daysBefore ?? fallback.daysBefore;
      this.validateChannelTypeIds(channelTypeIds);
      this.validateDaysBefore(daysBefore);
      upserts.push({
        eventId: item.eventId,
        enabled: item.enabled ?? fallback.enabled,
        channelTypeIds,
        daysBefore,
      });
    }

    await this.repo.upsertPreferences(customerId, upserts);
    return this.getSettings(customerId);
  }

  async updateQuietHours(
    customerId: string,
    body: UpdateQuietHoursRequest,
  ): Promise<QuietHoursDto> {
    if (body.enabled) {
      if (!body.from || !body.to) {
        throw new BadRequestException('from and to required when enabled');
      }
      if (!TIME_RE.test(body.from) || !TIME_RE.test(body.to)) {
        throw new BadRequestException('from/to must be HH:MM');
      }
    }
    const from = body.from ?? null;
    const to = body.to ?? null;
    // Если enabled=false — храним переданные значения как есть (можно
    // прислать null, чтобы очистить, или оставить старые), но
    // запретить enabled=true без полного окна.
    const ok = await this.repo.updateQuietHours(customerId, {
      enabled: body.enabled,
      from,
      to,
      version: body.version,
    });
    if (!ok) throw new ConflictException('version mismatch');
    const after = await this.repo.readQuietHours(customerId);
    if (!after) throw new NotFoundException('customer not found');
    return after.data;
  }

  private validateChannelTypeIds(ids: number[]): void {
    for (const id of ids) {
      if (!VALID_CHANNEL_IDS.has(id)) {
        throw new BadRequestException(`unknown channelTypeId: ${id}`);
      }
    }
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('channelTypeIds must not contain duplicates');
    }
  }

  private validateDaysBefore(days: number[]): void {
    for (const d of days) {
      if (!Number.isInteger(d) || d < 0 || d > MAX_DAYS_BEFORE) {
        throw new BadRequestException(`daysBefore must be integers in [0..${MAX_DAYS_BEFORE}]`);
      }
    }
    if (new Set(days).size !== days.length) {
      throw new BadRequestException('daysBefore must not contain duplicates');
    }
  }
}
