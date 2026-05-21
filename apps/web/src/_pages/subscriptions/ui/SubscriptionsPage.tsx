'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { SubscriptionForm } from '@/features/subscription-form/ui/SubscriptionForm';
import {
  fromDto,
  type SubscriptionFormState,
} from '@/features/subscription-form/types';
import { getSubscription } from '@/entities/subscription/api/get';
import { useProjects } from '@/shared/contexts/projects-context';
import {
  BillingPeriod,
  Currency,
  type SubscriptionDto,
} from '@subzero/shared';
import { PageShell } from './PageShell';
import { PageTabs } from './PageTabs';
import { SubsListView } from './SubsListView';
import { FileUploadView } from './FileUploadView';

type Mode = 'list' | 'new' | 'edit';

function newInitial(projectSku: string): SubscriptionFormState {
  return {
    projectSku,
    serviceSku: null,
    nameCustom: '',
    iconCustom: null,
    categorySku: '',
    amount: '',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: new Date().toISOString().slice(0, 10),
    isTrial: false,
    promoAmount: '',
    promoEndsAt: '',
    comment: '',
  };
}

export function SubscriptionsPage() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { projects } = useProjects();
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get('new') === '1' ? 'new' : 'list',
  );
  const [editSku, setEditSku] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubscriptionDto | null>(null);
  const [newTab, setNewTab] = useState<'manual' | 'file' | 'inbox'>('manual');

  useEffect(() => {
    if (searchParams.get('new') === '1' && mode === 'list') {
      setMode('new');
      setNewTab('manual');
    }
  }, [searchParams, mode]);

  useEffect(() => {
    if (!editSku) {
      setEditing(null);
      return;
    }
    let alive = true;
    getSubscription(editSku)
      .then((s) => {
        if (alive) setEditing(s);
      })
      .catch(() => {
        if (alive) setEditSku(null);
      });
    return () => {
      alive = false;
    };
  }, [editSku]);

  const goList = () => {
    setMode('list');
    setEditSku(null);
    setEditing(null);
    if (searchParams.get('new')) router.replace('/account/subscriptions');
  };

  const defaultProjectSku = useMemo(() => projects[0]?.sku ?? '', [projects]);

  if (mode === 'edit' && editing) {
    return (
      <PageShell
        title={editing.name}
        eyebrow={t('Редактирование подписки', 'Edit subscription')}
        onClose={goList}
      >
        <Card padding={0}>
          <SubscriptionForm initial={fromDto(editing)} onClose={goList} />
        </Card>
      </PageShell>
    );
  }

  if (mode === 'new') {
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
          active={newTab}
          onChange={(id) => setNewTab(id as typeof newTab)}
        />

        <Card padding={0} style={{ marginTop: 14 }}>
          {newTab === 'manual' && defaultProjectSku ? (
            <SubscriptionForm initial={newInitial(defaultProjectSku)} onClose={goList} />
          ) : newTab === 'manual' ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: SUB0.muted }}>
                {t('Сначала создайте проект', 'Create a project first')}
              </div>
            </div>
          ) : null}
          {newTab === 'file' && <FileUploadView />}
          {newTab === 'inbox' && (
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

  return (
    <SubsListView
      onEdit={(sub) => {
        setEditSku(sub.sku);
        setMode('edit');
      }}
    />
  );
}
