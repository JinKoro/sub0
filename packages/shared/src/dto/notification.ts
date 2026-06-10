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

/** Канал доставки customer'а. Канал «активен» (воркер шлёт) только при
 *  `enabled && verified`. EMAIL заводится автоматически и сразу verified;
 *  TELEGRAM / MAX — через connect-flow (deep-link), `verified` выставит
 *  будущий bot-webhook. */
export interface NotificationChannelDto {
  typeId: number;
  /** email / @handle / chat-id. Для не подключённого TG/MAX — `null`. */
  address: string | null;
  enabled: boolean;
  verified: boolean;
}

export interface NotificationSettingsDto {
  channels: NotificationChannelDto[];
  preferences: NotificationPreferenceDto[];
  quietHours: QuietHoursDto;
}

/** Ответ `POST /customers/me/notifications/channels/:type/connect`.
 *  Для TELEGRAM / MAX — одноразовый deep-link с nonce; верификация
 *  произойдёт, когда юзер пройдёт по ссылке (bot-webhook — отдельная
 *  задача). Для EMAIL connect идемпотентен и сразу отдаёт verified-канал. */
export interface ConnectChannelResponse {
  channel: NotificationChannelDto;
  /** Присутствует для TELEGRAM / MAX: deep-link для подключения. */
  deepLink?: string;
  /** ISO-время истечения nonce (для TELEGRAM / MAX). */
  expiresAt?: string;
}

/** Body для `POST /customers/me/notifications/preferences`.
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

/** Body для `POST /customers/me/quiet-hours`. */
export interface UpdateQuietHoursRequest {
  enabled: boolean;
  from?: string | null;
  to?: string | null;
  version: number;
}
