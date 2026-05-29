import type {
  NotificationPreferenceDto,
  NotificationSettingsDto,
  QuietHoursDto,
} from '@subzero/shared';

/** Партиальный апдейт одной строки `notification_event_preference`. */
export interface PreferenceUpsert {
  eventId: number;
  enabled?: boolean;
  channelTypeIds?: number[];
  daysBefore?: number[];
}

export interface QuietHoursUpsert {
  enabled: boolean;
  from: string | null;
  to: string | null;
  /** Optimistic-lock версия customer.version. */
  version: number;
}

export interface NotificationsRepository {
  /** Все строки preferences customer'а. Если строки нет — сервис подставит
   *  дефолт сам, БД не трогаем без явного PATCH. */
  listPreferences(customerId: string): Promise<NotificationPreferenceDto[]>;
  /** Текущие quiet hours customer'а + версия для optimistic-lock. */
  readQuietHours(customerId: string): Promise<{ data: QuietHoursDto; version: number } | null>;
  /** Upsert по `(customer_id, event_id)`. Бэкэнд решает, какие поля
   *  обновить — repo получает уже готовые значения (после слияния с
   *  предыдущей строкой, если та была). */
  upsertPreferences(
    customerId: string,
    items: Array<{
      eventId: number;
      enabled: boolean;
      channelTypeIds: number[];
      daysBefore: number[];
    }>,
  ): Promise<void>;
  /** Update quiet_hours_* колонок на customer + bump version. Возвращает
   *  false если version устарел (409). */
  updateQuietHours(customerId: string, args: QuietHoursUpsert): Promise<boolean>;
}

export type { NotificationPreferenceDto, NotificationSettingsDto, QuietHoursDto };
