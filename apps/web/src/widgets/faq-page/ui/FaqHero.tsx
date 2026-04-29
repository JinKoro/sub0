'use client';

import { PageHero } from '@/shared/components/ui/PageHero';
import { useLang } from '@/shared/contexts/lang-context';

export function FaqHero() {
  const { t } = useLang();

  return (
    <PageHero
      breadcrumbs={[
        { label: t('Главная', 'Home'), href: '/' },
        { label: t('Вопросы и ответы', 'FAQ') },
      ]}
      title={t('Вопросы и ответы', 'Questions & Answers')}
      description={t(
        'Ответы на ключевые вопросы, которые помогут быстро разобраться в работе сервиса.',
        'Answers to key questions that will help you quickly understand how the service works.',
      )}
    />
  );
}
