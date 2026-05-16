'use client';

import { PageHero } from '@/shared/components/ui/PageHero';
import { useLang } from '@/shared/contexts/lang-context';

export function ReviewsHero() {
  const { t } = useLang();

  return (
    <PageHero
      breadcrumbs={[
        { label: t('Главная', 'Home'), href: '/' },
        { label: t('Отзывы', 'Reviews') },
      ]}
      title={t('Отзывы', 'Reviews')}
      description={t(
        'Что говорят о Sub0 те, кто уже навёл порядок в подписках. Поделитесь своим опытом — это поможет другим.',
        'What people say about Sub0 after sorting their subscriptions. Share your experience — it helps others.',
      )}
    />
  );
}
