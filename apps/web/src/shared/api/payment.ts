import type { PaymentListQuery, PaymentListResponse } from '@subzero/shared';

import { api } from './client';

export function listPayments(q: PaymentListQuery = {}): Promise<PaymentListResponse> {
  const sp = new URLSearchParams();
  if (q.page) sp.set('page', String(q.page));
  if (q.pageSize) sp.set('pageSize', String(q.pageSize));
  const qs = sp.toString();
  return api<PaymentListResponse>(`/customers/me/payments${qs ? `?${qs}` : ''}`);
}

export type { PaymentListQuery, PaymentListResponse };
