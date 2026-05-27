/** Минимальный снимок подписки для биллинг-cron.
 *  Содержит только поля, нужные воркеру: всё для расчёта next цикла
 *  и резолва текущей цены через активные промо. */
export interface DueSubscription {
  id: string;
  customerId: string;
  projectId: string;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  nextBillingDate: Date;
  stateId: number;
  version: number;
  /** Активные и неудалённые промо для resolver'а. */
  promos: Array<{ amount: string; endsAt: Date }>;
}

export interface TickActiveArgs {
  subscriptionId: string;
  customerId: string;
  projectId: string;
  version: number;
  /** Новая запись в billing_history. */
  billing: {
    sku: string;
    periodStart: Date;
    periodEnd: Date;
    billedAt: Date;
    amount: string;
    currencyId: number;
    isPromo: boolean;
  };
  /** Новое значение nextBillingDate (после сдвига). */
  newNextBillingDate: Date;
}

export interface TickCancelledArgs {
  subscriptionId: string;
  version: number;
}

export interface SubscriptionCycleRepository {
  /** Подписки с истёкшим nextBillingDate (ACTIVE или CANCELLED), не-soft-deleted,
   *  ORDER BY next_billing_date ASC, LIMIT batch. */
  findDue(now: Date, limit: number): Promise<DueSubscription[]>;
  /** Транзакционно: INSERT billing_history + UPDATE subscription
   *  next_billing_date с проверкой version. Возвращает false если version
   *  устарел (другой воркер опередил). */
  tickActive(args: TickActiveArgs): Promise<boolean>;
  /** UPDATE subscription state_id=ARCHIVED + version+1, проверка version. */
  tickCancelled(args: TickCancelledArgs): Promise<boolean>;
}
