import type { PaymentDto, PaymentListResponse } from '@subzero/shared';

export interface PaymentListArgs {
  customerId: string;
  page: number;
  pageSize: number;
}

export interface CustomerPlanState {
  /** Текущий план (Plan enum). */
  planId: number;
  /** До какой даты действует план; NULL для FREE. */
  planExpiresAt: Date | null;
  /** state_id кастомера (CustomerState). Нужен для email-verified gate
   *  перед оплатой — апгрейд разрешён только из ACTIVE. */
  stateId: number;
}

export interface UpgradeArgs {
  customerId: string;
  /** sku новой payment-записи (генерится сервисом, чтобы тестам было удобно). */
  paymentSku: string;
  providerId: number;
  providerPaymentId: string;
  amount: string;
  currencyId: number;
  statusId: number;
  paidPlanId: number;
  paidUntil: Date;
  /** Новый план кастомера — обычно Plan.PRO. */
  newPlanId: number;
}

export interface PaymentRepository {
  list(args: PaymentListArgs): Promise<PaymentListResponse>;
  /** Read-only снимок плана: нужен сервису, чтобы решить продлевать ли
   *  от `plan_expires_at` или от `now`. */
  findCustomerPlanState(customerId: string): Promise<CustomerPlanState | null>;
  /** Атомарно: insert payment + update customer (plan_id, plan_expires_at,
   *  version+1). Возвращает свежий DTO платежа. */
  upgrade(args: UpgradeArgs): Promise<PaymentDto>;
}

export type { PaymentDto };
