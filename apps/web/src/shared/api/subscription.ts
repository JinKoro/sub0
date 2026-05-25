import type {
  SubscriptionCreateDto,
  SubscriptionDto,
  SubscriptionListQuery,
  SubscriptionListResponse,
  SubscriptionUpdateDto,
} from '@subzero/shared';

import { api } from './client';

export function listSubscriptions(q: SubscriptionListQuery = {}): Promise<SubscriptionListResponse> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return api<SubscriptionListResponse>(`/subscriptions${qs ? `?${qs}` : ''}`);
}

export function getSubscription(sku: string): Promise<SubscriptionDto> {
  return api<SubscriptionDto>(`/subscriptions/${sku}`);
}

export function createSubscription(dto: SubscriptionCreateDto): Promise<SubscriptionDto> {
  return api<SubscriptionDto>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateSubscription(
  sku: string,
  dto: SubscriptionUpdateDto,
): Promise<SubscriptionDto> {
  return api<SubscriptionDto>(`/subscriptions/${sku}`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function deleteSubscription(sku: string): Promise<void> {
  return api<void>(`/subscriptions/${sku}`, { method: 'DELETE' });
}

export type { SubscriptionDto, SubscriptionCreateDto, SubscriptionUpdateDto };
