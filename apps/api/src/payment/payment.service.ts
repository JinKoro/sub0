import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Currency,
  CustomerState,
  EMAIL_NOT_VERIFIED_ERROR,
  PRO_MONTHLY_PRICE_RUB,
  PRO_YEARLY_PRICE_RUB,
  PaidPlan,
  Plan,
  type PaymentDto,
  type PaymentListQuery,
  type PaymentListResponse,
} from '@subzero/shared';

import type { PaymentProvider } from './payment-provider';
import type { PaymentRepository } from './payment.types';

const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

export interface PaymentServiceDeps {
  repo: PaymentRepository;
  provider: PaymentProvider;
  now: () => Date;
  generateSku: () => string;
}

export class PaymentService {
  private readonly repo: PaymentRepository;
  private readonly provider: PaymentProvider;
  private readonly now: () => Date;
  private readonly generateSku: () => string;

  constructor(deps: PaymentServiceDeps) {
    this.repo = deps.repo;
    this.provider = deps.provider;
    this.now = deps.now;
    this.generateSku = deps.generateSku;
  }

  async list(customerId: string, q: PaymentListQuery): Promise<PaymentListResponse> {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new BadRequestException(`pageSize must be between 1 and ${MAX_PAGE_SIZE}`);
    }
    return this.repo.list({ customerId, page, pageSize });
  }

  /** Mock-апгрейд тарифа: списываем через провайдера, фиксируем payment,
   *  переводим customer на PRO. Если уже PRO и `plan_expires_at > now` —
   *  продлеваем от даты окончания, иначе — от `now`. */
  async upgrade(customerId: string, paidPlanId: number): Promise<PaymentDto> {
    if (paidPlanId !== PaidPlan.PRO_MONTHLY && paidPlanId !== PaidPlan.PRO_YEARLY) {
      throw new BadRequestException('paidPlanId must be PaidPlan.PRO_MONTHLY or PRO_YEARLY');
    }

    const state = await this.repo.findCustomerPlanState(customerId);
    if (!state) throw new NotFoundException('customer not found');

    // Roadmap: «Email verification обязательна до первой оплаты».
    // CREATED — email ещё не подтверждён; ARCHIVED — soft-deleted.
    if (state.stateId !== CustomerState.ACTIVE) {
      throw new ForbiddenException({ message: EMAIL_NOT_VERIFIED_ERROR });
    }

    const now = this.now();
    const isActivePro =
      state.planId === Plan.PRO && state.planExpiresAt !== null && state.planExpiresAt > now;
    // Продлеваем от текущего конца действия, не от now — иначе юзер,
    // оплативший второй месяц на 25 числе, потерял бы 6 дней.
    const base = isActivePro ? state.planExpiresAt! : now;
    const paidUntil = addPeriod(base, paidPlanId);

    const amount =
      paidPlanId === PaidPlan.PRO_YEARLY ? PRO_YEARLY_PRICE_RUB : PRO_MONTHLY_PRICE_RUB;
    const currencyId = Currency.RUB;

    const charge = await this.provider.charge({
      customerId,
      amount,
      currencyId,
      paidPlanId,
    });

    return this.repo.upgrade({
      customerId,
      paymentSku: this.generateSku(),
      providerId: charge.providerId,
      providerPaymentId: charge.providerPaymentId,
      amount,
      currencyId,
      statusId: charge.statusId,
      paidPlanId,
      paidUntil,
      newPlanId: Plan.PRO,
    });
  }
}

function addPeriod(base: Date, paidPlanId: number): Date {
  const next = new Date(base);
  if (paidPlanId === PaidPlan.PRO_YEARLY) {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}
