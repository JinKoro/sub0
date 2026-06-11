/** Один candidate для outbox-вставки. Соответствует идемпотентности cron'а:
 *  повторный запуск не создаёт дубль (unique dedup_key). Кандидат привязан
 *  к конкретному verified-каналу — фан-аут на несколько каналов даёт
 *  несколько строк с одним dedupKey, но разными `channelTypeId`. */
export interface UpcomingChargeOutboxRow {
  customerId: string;
  /** Тип канала доставки (NotificationChannelType): EMAIL / TELEGRAM. */
  channelTypeId: number;
  /** Адрес канала: email для EMAIL, chat_id для TELEGRAM. */
  address: string;
  localeId: number;
  subscriptionSku: string;
  serviceName: string;
  amount: string;
  currency: string;
  billingDate: string; // YYYY-MM-DD
  daysBefore: number;
  projectName: string;
  customerName: string | null;
  dedupKey: string;
}

export interface BillingNotificationRepository {
  /** Все ACTIVE-кастомеры + их ACTIVE-подписки, у которых
   *  daysUntil(nextBillingDate, today) ∈ lead_days, по каждому verified +
   *  enabled каналу из preference (EMAIL / TELEGRAM; MAX пока не доставляем). */
  findUpcomingChargeCandidates(today: Date): Promise<UpcomingChargeOutboxRow[]>;

  /** INSERT в mail_outbox ... ON CONFLICT (dedup_key) DO NOTHING. */
  enqueueEmail(rows: UpcomingChargeOutboxRow[]): Promise<number>;

  /** INSERT в telegram_outbox ... ON CONFLICT (dedup_key) DO NOTHING. */
  enqueueTelegram(rows: UpcomingChargeOutboxRow[]): Promise<number>;
}
