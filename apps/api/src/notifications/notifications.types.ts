import type {
  NotificationChannelDto,
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

/** Полный upsert строки `notification_channel` по `(customer_id, type_id)`. */
export interface ChannelUpsert {
  typeId: number;
  /** Для pending TG/MAX — пустая строка (адрес выставит bot при verify). */
  address: string;
  enabled: boolean;
  verifiedAt: Date | null;
  connectNonce: string | null;
  connectNonceExpiresAt: Date | null;
}

export interface NotificationsRepository {
  /** Все строки preferences customer'а. Если строки нет — сервис подставит
   *  дефолт сам, БД не трогаем без явного апдейта. */
  listPreferences(customerId: string): Promise<NotificationPreferenceDto[]>;
  /** Все каналы customer'а. */
  listChannels(customerId: string): Promise<NotificationChannelDto[]>;
  /** Email customer'а (для ensure EMAIL-канала). */
  getCustomerEmail(customerId: string): Promise<string | null>;
  /** Upsert канала по `(customer_id, type_id)`. Возвращает итоговую строку. */
  upsertChannel(customerId: string, args: ChannelUpsert): Promise<NotificationChannelDto>;
  /** Удаляет канал. `false`, если строки не было. */
  deleteChannel(customerId: string, typeId: number): Promise<boolean>;
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

export type {
  NotificationChannelDto,
  NotificationPreferenceDto,
  NotificationSettingsDto,
  QuietHoursDto,
};
