'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { SubscriptionForm } from '@/features/subscription-form/ui/SubscriptionForm';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import { PageShell } from './PageShell';
import { PageTabs } from './PageTabs';
import { SubsListView } from './SubsListView';
import { FileUploadView } from './FileUploadView';

type Mode = 'list' | 'new' | 'edit';

function toFormInitial(sub: CabinetSubscription) {
  return {
    id: sub.id,
    name: sub.name,
    char: sub.char,
    color: sub.color ?? SUB0.muted,
    cat: sub.cat,
    project: sub.project,
    price: sub.price,
    cur: sub.cur,
    cycle: sub.cycle,
    status: sub.status,
    note: sub.note,
    trial: sub.trial,
    promo: !!sub.promo,
    nextDate: '',
    trialEnds: '',
    promos: [],
  };
}

export function SubscriptionsPage() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get('new') === '1' ? 'new' : 'list',
  );
  const [editing, setEditing] = useState<CabinetSubscription | null>(null);
  const [newTab, setNewTab] = useState<'manual' | 'file' | 'inbox'>('manual');

  useEffect(() => {
    if (searchParams.get('new') === '1' && mode === 'list') {
      setMode('new');
      setNewTab('manual');
    }
  }, [searchParams, mode]);

  const goList = () => {
    setMode('list');
    setEditing(null);
    if (searchParams.get('new')) router.replace('/account/subscriptions');
  };

  if (mode === 'edit' && editing) {
    return (
      <PageShell
        title={editing.name}
        eyebrow={t('Редактирование подписки', 'Edit subscription')}
        onClose={goList}
      >
        <Card padding={0}>
          <SubscriptionForm initial={toFormInitial(editing)} onClose={goList} />
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
          {newTab === 'manual' && (
            <SubscriptionForm
              initial={{
                name: '',
                char: '?',
                color: SUB0.blue,
                cat: 'other',
                project: 'personal',
                cycle: 'monthly',
                price: '',
                cur: 'RUB',
              }}
              onClose={goList}
            />
          )}
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
        setEditing(sub);
        setMode('edit');
      }}
    />
  );
}
