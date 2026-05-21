import type { ServiceDto, ServiceListResponse } from '@subzero/shared';

import { api } from './client';

export interface ListServicesParams {
  q?: string;
  categorySku?: string;
  limit?: number;
}

export function listServices(params: ListServicesParams = {}): Promise<ServiceListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.categorySku) sp.set('categorySku', params.categorySku);
  if (params.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return api<ServiceListResponse>(`/services${qs ? `?${qs}` : ''}`);
}

export type { ServiceDto };
