import type { Currency } from '../enums';

export interface BillingHistoryEntryDto {
  sku: string;
  subscriptionSku: string;
  projectSku: string;
  amount: string;
  currencyId: Currency;
  /** Начало оплаченного периода (UTC ISO). */
  periodStart: string;
  /** Конец оплаченного периода (UTC ISO). */
  periodEnd: string;
  /** Когда фактически списано (UTC ISO). Календарь группирует по этой дате. */
  billedAt: string;
  isPromo: boolean;
}

export interface BillingHistoryListQuery {
  /** ISO; обязательно. */
  from: string;
  /** ISO; обязательно. */
  to: string;
  /** Если не передан — все проекты юзера. */
  projectSku?: string;
}

export interface BillingHistoryListResponse {
  items: BillingHistoryEntryDto[];
}
