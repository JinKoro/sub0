'use client';

import { useRouter } from 'next/navigation';
import { SubsListView } from './SubsListView';

export function SubscriptionsPage() {
  const router = useRouter();
  return (
    <SubsListView onEdit={(sub) => router.push(`/account/subscriptions/${sub.sku}`)} />
  );
}
