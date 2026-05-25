'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { SubscriptionForm } from '@/features/subscription-form/ui/SubscriptionForm';
import { useProjects } from '@/shared/contexts/projects-context';
import { BillingPeriod, Currency } from '@subzero/shared';
import type { SubscriptionFormState } from '@/features/subscription-form/types';
import { PageShell } from './PageShell';
import { PageTabs } from './PageTabs';
import { FileUploadView } from './FileUploadView';

function newInitial(projectSku: string): SubscriptionFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    mode: 'new',
    projectSku,
    serviceSku: null,
    nameCustom: '',
    iconCustom: null,
    color: null,
    categorySku: '',
    amount: '',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '',
    nextBillingDate: today,
    isTrial: false,
    trialEndsAt: '',
    promos: [],
    comment: '',
  };
}

export function NewSubscriptionPage() {
  const { t } = useLang();
  const router = useRouter();
  const { projects } = useProjects();
  const [tab, setTab] = useState<'manual' | 'file' | 'inbox'>('manual');

  const goList = () => router.push('/account/subscriptions');
  const defaultProjectSku = useMemo(() => projects[0]?.sku ?? '', [projects]);

  return (
    <PageShell
      title={t('Добавить подписку', 'Add a subscription')}
      eyebrow={t('Новая подписка', 'New subscription')}
      onClose={goList}
    >
      <PageTabs
        tabs={[
          { id: 'manual', label: t('Создать вручную', 'Manual') },
          { id: 'file', label: t('Файл / выписка', 'File / statement'), badge: 'AI' },
          { id: 'inbox', label: t('Почта', 'Inbox'), badge: 'AI', soon: true },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      <Card padding={0} style={{ marginTop: 14 }}>
        {tab === 'manual' && defaultProjectSku ? (
          <SubscriptionForm initial={newInitial(defaultProjectSku)} onClose={goList} />
        ) : tab === 'manual' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: SUB0.muted }}>
              {t('Сначала создайте проект', 'Create a project first')}
            </div>
          </div>
        ) : null}
        {tab === 'file' && <FileUploadView />}
        {tab === 'inbox' && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: SUB0.muted }}>
              {t('Импорт из почты — скоро.', 'Inbox import — coming soon.')}
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
