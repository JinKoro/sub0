'use client';

import { useState } from 'react';
import { deleteSubscription } from '@/entities/subscription/api/remove';
import { ApiError } from '@/shared/api/client';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useLang } from '@/shared/contexts/lang-context';
import { useSubscriptions } from '@/shared/contexts/subscriptions-context';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  sku: string;
  name: string;
  onDeleted: () => void;
}

export function DeleteSubscriptionButton({ sku, name, onDeleted }: Props) {
  const { t } = useLang();
  const { refresh: refreshSubscriptions } = useSubscriptions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteSubscription(sku);
      void refreshSubscriptions();
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? t('Подписка уже удалена', 'Subscription already gone')
          : t('Не удалось удалить', 'Failed to delete'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        style={{
          padding: '10px 16px',
          borderRadius: 9,
          border: `1px solid ${SUB0.danger}`,
          background: 'transparent',
          color: SUB0.danger,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {t('Удалить подписку', 'Delete subscription')}
      </button>
      <ConfirmDialog
        open={open}
        title={t('Удалить подписку?', 'Delete subscription?')}
        description={
          error ??
          t(
            `«${name}» и вся история списаний удалятся безвозвратно. Это действие нельзя отменить.`,
            `«${name}» and all its billing history will be permanently deleted. This action cannot be undone.`,
          )
        }
        confirmLabel={t('Удалить навсегда', 'Delete permanently')}
        cancelLabel={t('Отмена', 'Cancel')}
        destructive
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
