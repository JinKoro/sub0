'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { SubscriptionForm } from '@/features/subscription-form/ui/SubscriptionForm';
import { getSubscription } from '@/entities/subscription/api/get';
import type { SubscriptionDto } from '@subzero/shared';
import { PageShell } from './PageShell';
import { PageTabs } from './PageTabs';
import { SubsListView } from './SubsListView';
import { FileUploadView } from './FileUploadView';

type Mode = 'list' | 'new' | 'edit';

// Temporary adapter: SubscriptionDto → existing SubscriptionFormInitial shape.
// Task 13 will rewrite SubscriptionForm against the DTO directly; for now we
// just pipe in enough fields so the form renders in edit mode without crashing.
function toFormInitial(dto: SubscriptionDto) {
  return {
    // `id` here doubles as edit-mode marker; SubscriptionFormInitial.id is
    // currently `number`, but typecheck for this file is expected to break
    // until Task 13 — see AGENTS.md / task notes.
    id: dto.sku as unknown as number,
    name: dto.name,
    char: (dto.name.charAt(0) || '?').toUpperCase(),
    color: '#0a0a0a',
    cat: dto.categorySku ?? 'other',
    project: dto.projectSku,
    price: dto.amount,
    cur: 'RUB' as const,
    cycle: 'monthly' as const,
    status: 'active' as const,
    note: dto.comment ?? '',
    trial: dto.isTrial,
    promo: false,
    nextDate: dto.nextBillingDate,
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
        setEditSku(sub.sku);
        setMode('edit');
      }}
    />
  );
}
