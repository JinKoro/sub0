import { Suspense } from 'react';
import { SubscriptionsPage } from '@/_pages/subscriptions/ui/SubscriptionsPage';

export default function Page() {
  return (
    <Suspense>
      <SubscriptionsPage />
    </Suspense>
  );
}
