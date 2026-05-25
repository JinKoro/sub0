import type {
  NewPromoDto,
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionUpdateDto,
  UpdatePromoDto,
} from '@subzero/shared';

/** Один элемент списка промо в форме. uid — стабильный React key. sku/version — только для существующих. */
export interface PromoFormItem {
  uid: string;
  sku?: string;
  version?: number;
  amount: string;
  endsAt: string;
}

/** Режим формы при создании: новая подписка (только следующее списание) vs история. */
export type SubscriptionFormMode = 'new' | 'existing';

/** Internal form state. Stores raw user input as strings; converted to DTO on submit. */
export interface SubscriptionFormState {
  /** Когда редактируем существующую — sku + version для optimistic lock. */
  sku?: string;
  version?: number;

  /** Только для create. На edit поля считаем как 'existing' (показываем оба DatePicker). */
  mode: SubscriptionFormMode;

  projectSku: string;
  serviceSku: string | null;

  /** При выборе сервиса берётся из service.name; кастомное имя override. */
  nameCustom: string;
  iconCustom: string | null;

  categorySku: string;

  amount: string; // '500.00' format
  currencyId: number; // Currency enum value
  billingPeriodId: number; // BillingPeriod enum value
  /** Дата первого исторического списания (для backfill). Пустая в mode='new'. */
  firstBillingDate: string; // YYYY-MM-DD
  /** Дата следующего планируемого списания. Заполнена всегда. */
  nextBillingDate: string; // YYYY-MM-DD

  isTrial: boolean;
  trialEndsAt: string; // ISO (YYYY-MM-DD); empty for none

  promos: PromoFormItem[];

  comment: string;

  /** Только для edit; ACTIVE/PAUSED/CANCELLED. ARCHIVED ставится только при удалении аккаунта. */
  stateId?: number;
}

let uidCounter = 0;
export function newPromoUid(): string {
  uidCounter += 1;
  return `new-${Date.now().toString(36)}-${uidCounter}`;
}

/** Маппер DTO -> form state. */
export function fromDto(dto: SubscriptionDto): SubscriptionFormState {
  return {
    sku: dto.sku,
    version: dto.version,
    mode: 'existing',
    projectSku: dto.projectSku,
    serviceSku: dto.serviceSku,
    nameCustom: dto.name,
    iconCustom: null,
    categorySku: dto.categorySku ?? '',
    amount: dto.amount,
    currencyId: dto.currencyId,
    billingPeriodId: dto.billingPeriodId,
    firstBillingDate: toDateInput(dto.firstBillingDate),
    nextBillingDate: toDateInput(dto.nextBillingDate),
    isTrial: dto.isTrial,
    trialEndsAt: toDateInput(dto.trialEndsAt ?? ''),
    promos: dto.promos.map((p) => ({
      uid: p.sku,
      sku: p.sku,
      version: p.version,
      amount: p.amount,
      endsAt: toDateInput(p.endsAt),
    })),
    comment: dto.comment ?? '',
    stateId: dto.stateId,
  };
}

/** Маппер form state -> create DTO. */
export function toCreateDto(state: SubscriptionFormState): SubscriptionCreateDto {
  const promos: NewPromoDto[] = state.promos
    .filter((p) => p.amount.trim() && p.endsAt.trim())
    .map((p) => ({ amount: p.amount.trim(), endsAt: p.endsAt }));

  // mode='new': истории нет → firstBillingDate = nextBillingDate (первый цикл — следующее списание).
  // mode='existing': пользователь указал и историю, и ближайшее списание.
  const firstBillingDate =
    state.mode === 'existing' ? state.firstBillingDate : state.nextBillingDate;

  return {
    projectSku: state.projectSku,
    serviceSku: state.serviceSku || null,
    nameCustom: state.serviceSku ? null : state.nameCustom.trim() || null,
    iconCustom: state.iconCustom?.trim() || null,
    categorySku: state.categorySku,
    amount: state.amount,
    currencyId: state.currencyId,
    billingPeriodId: state.billingPeriodId,
    firstBillingDate,
    nextBillingDate: state.nextBillingDate,
    isTrial: state.isTrial,
    trialEndsAt: state.isTrial ? state.trialEndsAt || null : null,
    comment: state.comment.trim() || null,
    promos: promos.length ? promos : undefined,
  };
}

export function toUpdateDto(state: SubscriptionFormState): SubscriptionUpdateDto {
  if (state.version == null) throw new Error('toUpdateDto: version missing');

  const promos: Array<NewPromoDto | UpdatePromoDto> = state.promos
    .filter((p) => p.amount.trim() && p.endsAt.trim())
    .map((p): NewPromoDto | UpdatePromoDto => {
      if (p.sku && p.version != null) {
        return {
          sku: p.sku,
          version: p.version,
          amount: p.amount.trim(),
          endsAt: p.endsAt,
        };
      }
      return { amount: p.amount.trim(), endsAt: p.endsAt };
    });

  // firstBillingDate иммутабельно до появления редактора billing_history — не отправляем.
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
    nextBillingDate: state.nextBillingDate,
    isTrial: state.isTrial,
    trialEndsAt: state.isTrial ? state.trialEndsAt || null : null,
    comment: state.comment.trim() || null,
    stateId: state.stateId,
    promos,
  };
}

/** Приводит ISO/datetime → YYYY-MM-DD для DatePicker. */
function toDateInput(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  return m ? m[1]! : '';
}
