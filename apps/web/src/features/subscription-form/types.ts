import type {
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionUpdateDto,
} from '@subzero/shared';

/** Internal form state. Stores raw user input as strings; converted to DTO on submit. */
export interface SubscriptionFormState {
  /** Когда редактируем существующую — sku + version для optimistic lock. */
  sku?: string;
  version?: number;

  projectSku: string;
  serviceSku: string | null;

  /** При выборе сервиса берётся из service.name; кастомное имя override. */
  nameCustom: string;
  iconCustom: string | null;

  categorySku: string;

  amount: string; // '500.00' format
  currencyId: number; // Currency enum value
  billingPeriodId: number; // BillingPeriod enum value
  firstBillingDate: string; // ISO 8601 (YYYY-MM-DD)

  isTrial: boolean;
  promoAmount: string; // empty string for "no promo"
  promoEndsAt: string; // ISO (YYYY-MM-DD); empty for none

  comment: string;

  /** Только для edit; ACTIVE/PAUSED/CANCELLED. ARCHIVED ставится через DELETE. */
  stateId?: number;
}

/** Маппер DTO -> form state. */
export function fromDto(dto: SubscriptionDto): SubscriptionFormState {
  return {
    sku: dto.sku,
    version: dto.version,
    projectSku: dto.projectSku,
    serviceSku: dto.serviceSku,
    nameCustom: dto.name, // используется как видимое имя
    iconCustom: null,
    categorySku: dto.categorySku ?? '',
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    firstBillingDate: toDateInput(dto.firstBillingDate),
    isTrial: dto.isTrial,
    promoAmount: dto.promoAmount ?? '',
    promoEndsAt: toDateInput(dto.promoEndsAt ?? ''),
    comment: dto.comment ?? '',
    stateId: dto.stateId,
  };
}

/** Маппер form state -> create DTO. */
export function toCreateDto(state: SubscriptionFormState): SubscriptionCreateDto {
  return {
    projectSku: state.projectSku,
    serviceSku: state.serviceSku || null,
    // Если выбран сервис — nameCustom не шлём, иначе обязательное имя.
    nameCustom: state.serviceSku ? null : state.nameCustom.trim() || null,
    iconCustom: state.iconCustom?.trim() || null,
    categorySku: state.categorySku,
    amount: state.amount,
    currencyId: state.currencyId,
    billingPeriodId: state.billingPeriodId,
    firstBillingDate: state.firstBillingDate,
    isTrial: state.isTrial,
    promoAmount: state.isTrial ? '0' : state.promoAmount.trim() || null,
    promoEndsAt: state.promoEndsAt.trim() || null,
    comment: state.comment.trim() || null,
  };
}

export function toUpdateDto(state: SubscriptionFormState): SubscriptionUpdateDto {
  if (state.version == null) throw new Error('toUpdateDto: version missing');
  return {
    version: state.version,
    projectSku: state.projectSku,
    serviceSku: state.serviceSku ?? null,
    nameCustom: state.serviceSku ? null : state.nameCustom.trim() || null,
    iconCustom: state.iconCustom?.trim() || null,
    categorySku: state.categorySku,
    amount: state.amount,
    currencyId: state.currencyId,
    billingPeriodId: state.billingPeriodId,
    firstBillingDate: state.firstBillingDate,
    isTrial: state.isTrial,
    promoAmount: state.isTrial ? '0' : state.promoAmount.trim() || null,
    promoEndsAt: state.promoEndsAt.trim() || null,
    comment: state.comment.trim() || null,
    stateId: state.stateId,
  };
}

/** Приводит ISO/datetime → YYYY-MM-DD для <input type="date">. */
function toDateInput(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  return m ? m[1]! : '';
}
