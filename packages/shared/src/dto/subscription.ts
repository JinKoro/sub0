import type { BillingPeriod, Currency, SubscriptionState } from '../enums';

/** Active promo: `endsAt > now()` AND deleted_at IS NULL. */
export interface PromoDto {
  sku: string;
  amount: string;
  endsAt: string;
  version: number;
}

/** Promo input on create — no sku, server generates. */
export interface NewPromoDto {
  amount: string;
  endsAt: string;
}

/** Promo update — references existing by sku, requires version. */
export interface UpdatePromoDto {
  sku: string;
  version: number;
  amount?: string;
  endsAt?: string;
}

export interface SubscriptionDto {
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  name: string;
  icon: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  nextBillingDate: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  comment: string | null;
  stateId: SubscriptionState;
  version: number;
  createdAt: string;
  updatedAt: string;
  promos: PromoDto[];
}

export interface SubscriptionCreateDto {
  projectSku: string;
  serviceSku?: string | null;
  nameCustom?: string | null;
  iconCustom?: string | null;
  categorySku: string;
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  isTrial: boolean;
  trialEndsAt?: string | null;
  comment?: string | null;
  promos?: NewPromoDto[];
}

export type SubscriptionUpdateDto = Partial<Omit<SubscriptionCreateDto, 'promos'>> & {
  version: number;
  stateId?: SubscriptionState;
  /** Replace-all семантика: что прислали — то и есть. Сервер удалит то, чего нет. */
  promos?: Array<NewPromoDto | UpdatePromoDto>;
};

/** Status filter — archive больше не отображается; ARCHIVED только через cascade customer-delete. */
export type SubscriptionListStatus = 'active' | 'paused' | 'cancelled' | 'all';

export type SubscriptionListSort = 'next' | 'name' | 'price';

export interface SubscriptionListQuery {
  projectSku?: string | 'all';
  status?: SubscriptionListStatus;
  categorySku?: string;
  q?: string;
  sort?: SubscriptionListSort;
  page?: number;
  pageSize?: number;
}

export interface SubscriptionListResponse {
  items: SubscriptionDto[];
  total: number;
  page: number;
  pageSize: number;
}
