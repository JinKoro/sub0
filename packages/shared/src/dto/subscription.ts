import type { BillingPeriod, Currency, SubscriptionState } from '../enums';

/** Public response shape — see ctx-business-logic.md «имя и иконка». */
export interface SubscriptionDto {
  sku: string;
  projectSku: string;
  serviceSku: string | null;
  /** Resolved (service.name OR name_custom). */
  name: string;
  /** Resolved (service.icon OR icon_custom). */
  icon: string | null;
  categorySku: string | null;
  categoryCustomSku: string | null;
  /** Numeric (12,2) → string (avoid JS float drift). */
  amount: string;
  currencyId: Currency;
  billingPeriodId: BillingPeriod;
  firstBillingDate: string;
  nextBillingDate: string;
  isTrial: boolean;
  promoAmount: string | null;
  promoEndsAt: string | null;
  comment: string | null;
  stateId: SubscriptionState;
  version: number;
  createdAt: string;
  updatedAt: string;
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
  promoAmount?: string | null;
  promoEndsAt?: string | null;
  comment?: string | null;
}

export type SubscriptionUpdateDto = Partial<SubscriptionCreateDto> & {
  version: number;
  /** Only ACTIVE | PAUSED | CANCELLED; ARCHIVED ставится только через DELETE. */
  stateId?: SubscriptionState;
};

export type SubscriptionListStatus =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'archived'
  | 'all';

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
