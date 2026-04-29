'use client';

import { useState } from 'react';
import { Header } from '@/widgets/header/ui/Header';
import { Footer } from '@/widgets/footer/ui/Footer';
import { FinalCTA } from '@/widgets/home-page/ui/FinalCTA';
import { PricingHero } from '@/widgets/pricing-page/ui/PricingHero';
import { PricingPlans } from '@/widgets/pricing-page/ui/PricingPlans';
import { PricingComparison } from '@/widgets/pricing-page/ui/PricingComparison';
import { PricingFAQ } from '@/widgets/pricing-page/ui/PricingFAQ';

export function PricingPage() {
  const [billing, setBilling] = useState<'month' | 'year'>('month');

  return (
    <>
      <Header />
      <PricingHero />
      <PricingPlans billing={billing} setBilling={setBilling} />
      <PricingComparison billing={billing} />
      <PricingFAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
