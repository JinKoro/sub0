import type { PaymentDto, PaymentListQuery, PaymentListResponse } from '@subzero/shared';

import { api } from './client';

export function listPayments(q: PaymentListQuery = {}): Promise<PaymentListResponse> {
  const sp = new URLSearchParams();
  if (q.page) sp.set('page', String(q.page));
  if (q.pageSize) sp.set('pageSize', String(q.pageSize));
  const qs = sp.toString();
  return api<PaymentListResponse>(`/customers/me/payments${qs ? `?${qs}` : ''}`);
}

/** Mock-апгрейд тарифа. После успешного ответа вызывающий обязан
 *  обновить профиль (getMe), чтобы plan_id переключился на PRO. */
export function upgradePlan(paidPlanId: number): Promise<PaymentDto> {
  return api<PaymentDto>('/customers/me/upgrade', {
    method: 'POST',
    body: JSON.stringify({ paidPlanId }),
  });
}

export type { PaymentDto, PaymentListQuery, PaymentListResponse };
