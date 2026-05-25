'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { SubscriptionForm } from '@/features/subscription-form/ui/SubscriptionForm';
import { fromDto } from '@/features/subscription-form/types';
import { getSubscription } from '@/entities/subscription/api/get';
import { ApiError } from '@/shared/api/client';
import type { SubscriptionDto } from '@subzero/shared';
import { PageShell } from './PageShell';

interface Props {
  sku: string;
}

export function EditSubscriptionPage({ sku }: Props) {
  const { t } = useLang();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    getSubscription(sku)
      .then((s) => {
        if (!alive) return;
        setData(s);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) setStatus('notfound');
        else setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [sku]);

  const goList = () => router.push('/account/subscriptions');

  if (status === 'loading') {
    return (
      <PageShell
        title={t('Загрузка…', 'Loading…')}
        eyebrow={t('Редактирование подписки', 'Edit subscription')}
        onClose={goList}
      >
        <Card padding={40}>
          <div
            style={{ textAlign: 'center', color: SUB0.muted, fontSize: 14, fontFamily: mono }}
          >
            {t('Загрузка…', 'Loading…')}
          </div>
        </Card>
      </PageShell>
    );
  }

  if (status === 'notfound') {
    return (
      <PageShell
        title={t('Подписка не найдена', 'Subscription not found')}
        eyebrow={t('Редактирование подписки', 'Edit subscription')}
        onClose={goList}
      >
        <Card padding={40}>
          <div style={{ textAlign: 'center', color: SUB0.muted, fontSize: 14 }}>
            {t('Возможно, она была удалена.', 'It may have been deleted.')}
          </div>
        </Card>
      </PageShell>
    );
  }

  if (status === 'error' || !data) {
    return (
      <PageShell
        title={t('Не удалось загрузить', 'Failed to load')}
        eyebrow={t('Редактирование подписки', 'Edit subscription')}
        onClose={goList}
      >
        <Card padding={40}>
          <div style={{ textAlign: 'center', color: SUB0.danger, fontSize: 14 }}>
            {t('Попробуйте обновить страницу', 'Try refreshing the page')}
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={data.name}
      eyebrow={t('Редактирование подписки', 'Edit subscription')}
      onClose={goList}
    >
      <Card padding={0}>
        <SubscriptionForm initial={fromDto(data)} onClose={goList} />
      </Card>
    </PageShell>
  );
}
