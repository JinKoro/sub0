'use client';

import { PageHero } from '@/shared/components/ui/PageHero';
import { useLang } from '@/shared/contexts/lang-context';

export function LegalHero() {
  const { t } = useLang();

  return (
    <PageHero
      breadcrumbs={[
        { label: t('Главная', 'Home'), href: '/' },
        { label: t('Правовые документы', 'Legal documents') },
      ]}
      title={t('Правовые документы', 'Legal documents')}
      description={t(
        'ИП Бровченко Татьяна Владимировна предоставляет право использования сайта sub0.ru на основании публичной оферты. В соответствии с пунктом 2 статьи 437 Гражданского Кодекса Российской Федерации лицо, производящее акцепт оферты, становится Лицензиатом, акцепт оферты равнозначен заключению договора.',
        'IE Brovchenko Tatiana Vladimirovna grants the right to use the sub0.ru website on the basis of a public offer. In accordance with paragraph 2 of article 437 of the Civil Code of the Russian Federation, a person accepting the offer becomes the Licensee; acceptance of the offer is equivalent to entering into a contract.',
      )}
      titleMaxWidth={880}
      descriptionMaxWidth={760}
    />
  );
}
