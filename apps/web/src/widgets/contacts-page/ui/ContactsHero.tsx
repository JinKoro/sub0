'use client';

import { PageHero } from '@/shared/components/ui/PageHero';
import { useLang } from '@/shared/contexts/lang-context';

export function ContactsHero() {
  const { t } = useLang();

  return (
    <PageHero
      breadcrumbs={[
        { label: t('Главная', 'Home'), href: '/' },
        { label: t('Контакты', 'Contacts') },
      ]}
      title={t('Контакты', 'Contacts')}
      description={t(
        'Отправьте свой вопрос на email и мы ответим в ближайшее время.',
        "Send us your question by email and we'll get back to you shortly.",
      )}
    />
  );
}
