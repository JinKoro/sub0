import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum, PaymentStatus } from '@subzero/shared';

/** Результат «оплаты» у провайдера. Идёт в `payment.provider_payment_id` /
 *  `payment.status_id` и используется для идемпотентности вебхуков. */
export interface ProviderCharge {
  providerId: PaymentProviderEnum;
  providerPaymentId: string;
  statusId: PaymentStatus;
}

export interface PaymentProvider {
  /** Синхронное «списание»: для mock — мгновенный SUCCEEDED, для реальных
   *  эквайеров будет редирект + webhook → отдельный flow. */
  charge(args: {
    customerId: string;
    amount: string;
    currencyId: number;
    paidPlanId: number;
  }): Promise<ProviderCharge>;
}

/** Dev-провайдер: мгновенно возвращает SUCCEEDED. Используется в MVP до
 *  подписания договоров с эквайерами (см. roadmap §«Оплата»). */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async charge(): Promise<ProviderCharge> {
    return {
      providerId: PaymentProviderEnum.MOCK,
      providerPaymentId: randomUUID(),
      statusId: PaymentStatus.SUCCEEDED,
    };
  }
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
