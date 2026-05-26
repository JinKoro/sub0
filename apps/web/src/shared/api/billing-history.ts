import type { BillingHistoryListQuery, BillingHistoryListResponse } from '@subzero/shared';

import { api } from './client';

export function listBillingHistory(
  q: BillingHistoryListQuery,
): Promise<BillingHistoryListResponse> {
  const sp = new URLSearchParams({ from: q.from, to: q.to });
  if (q.projectSku) sp.set('projectSku', q.projectSku);
  return api<BillingHistoryListResponse>(`/billing-history?${sp.toString()}`);
}

export type { BillingHistoryListQuery, BillingHistoryListResponse };
