import type { Metadata } from 'next';
import { PricingPage } from '@/_pages/pricing/ui/PricingPage';

export const metadata: Metadata = {
  title: 'Sub0 — Тарифы',
  description: 'Free, Pro и Team. Платите только за то, что действительно нужно.',
  openGraph: {
    title: 'Sub0 — Тарифы',
    description: 'Free, Pro и Team. Платите только за то, что действительно нужно.',
  },
};

export default function Pricing() {
  return <PricingPage />;
}
