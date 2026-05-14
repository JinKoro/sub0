'use client';

import { PageHero } from '@/shared/components/ui/PageHero';
import { useLang } from '@/shared/contexts/lang-context';

export function PricingHero() {
  const { t } = useLang();

  return (
    <PageHero
      breadcrumbs={[
        { label: t('Главная', 'Home'), href: '/' },
        { label: t('Тарифы', 'Pricing') },
      ]}
      title={t('Тарифы', 'Plans')}
      description={t(
        'Выберите подходящий тариф для управления своими подписками.',
        'Choose the right plan to manage your subscriptions.',
      )}
      compactBottom
    />
  );
}
