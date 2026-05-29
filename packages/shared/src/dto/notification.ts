/** Настройки уведомления для одного события у customer'а.
 *  При отсутствии строки в БД сервис синтезирует дефолт (см.
 *  `ai/ctx-business-logic.md` § Notifications). */
export interface NotificationPreferenceDto {
  eventId: number;
  enabled: boolean;
  /** ID каналов из `NotificationChannelType`. EMAIL рабочий, TELEGRAM и
   *  MAX хранятся, но не доставляются — отдельная задача. */
  channelTypeIds: number[];
  /** Сколько дней «до» (для UPCOMING_CHARGE / TRIAL_END / PLAN_RENEWAL).
   *  `0` = в день события. Для MONTHLY_REPORT / RELEASES — массив пустой. */
  daysBefore: number[];
}

export interface QuietHoursDto {
  enabled: boolean;
  /** 'HH:MM' в `customer.timezone`. */
  from: string | null;
  /** 'HH:MM' в `customer.timezone`. */
  to: string | null;
}

export interface NotificationSettingsDto {
  preferences: NotificationPreferenceDto[];
  quietHours: QuietHoursDto;
}

/** Body для `PATCH /customers/me/notifications/preferences`.
 *  Каждый item — upsert по `(customer_id, eventId)`. Пустой массив `items`
 *  допустим, но 400 — нет смысла обращаться без апдейтов. */
export interface UpdatePreferencesRequest {
  items: Array<{
    eventId: number;
    enabled?: boolean;
    channelTypeIds?: number[];
    daysBefore?: number[];
  }>;
}

/** Body для `PATCH /customers/me/quiet-hours`. */
export interface UpdateQuietHoursRequest {
  enabled: boolean;
  from?: string | null;
  to?: string | null;
  version: number;
}
