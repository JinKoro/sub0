/** Один candidate uniqueness-ключ для outbox-вставки. Соответствует
 *  идемпотентности cron'а: повторный запуск не создаёт дубль. */
export interface UpcomingChargeOutboxRow {
  customerId: string;
  toEmail: string;
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
  /** Возвращает {row, key} для всех ACTIVE-кастомеров + их ACTIVE-подписок,
   *  у которых daysUntil(nextBillingDate, today) ∈ notification_lead_days. */
  findUpcomingChargeCandidates(today: Date): Promise<UpcomingChargeOutboxRow[]>;

  /** INSERT ... ON CONFLICT (dedup_key) DO NOTHING. Возвращает кол-во вставленных. */
  enqueueIdempotent(rows: UpcomingChargeOutboxRow[]): Promise<number>;
}
