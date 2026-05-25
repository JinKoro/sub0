import type { PromoDto, SubscriptionDto } from '@subzero/shared';

export type { SubscriptionDto, PromoDto };

/** UI-форматированная подписка для существующих компонентов кабинета. */
export interface CabinetSubscription {
  sku: string;
  name: string;
  icon: string | null;
  projectSku: string;
  categorySku: string | null;
  amount: string;
  currencyId: number;
  billingPeriodId: number;
  firstBillingDate: string;
  nextBillingDate: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  promos: PromoDto[];
  stateId: number;
  comment: string | null;
  version: number;
}

export function toCabinetSubscription(dto: SubscriptionDto): CabinetSubscription {
  return {
    sku: dto.sku,
    name: dto.name,
    icon: dto.icon,
    projectSku: dto.projectSku,
    categorySku: dto.categorySku,
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    firstBillingDate: dto.firstBillingDate,
    nextBillingDate: dto.nextBillingDate,
    isTrial: dto.isTrial,
    trialEndsAt: dto.trialEndsAt,
    promos: dto.promos,
    stateId: dto.stateId,
    comment: dto.comment,
    version: dto.version,
  };
}
