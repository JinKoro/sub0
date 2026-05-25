'use client';

import { useState } from 'react';
import { purgeSubscriptions } from '@/entities/subscription/api/purge';
import { ApiError } from '@/shared/api/client';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useLang } from '@/shared/contexts/lang-context';
import { sBtnDanger } from '@/_pages/settings/ui/parts/styles';

const FLASH_MS = 2000;

export function DeleteAllSubscriptionsAction() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await purgeSubscriptions();
      setOpen(false);
      setDone(true);
      setTimeout(() => setDone(false), FLASH_MS);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? t(`Ошибка ${err.status}`, `Error ${err.status}`)
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
        style={sBtnDanger}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {done
          ? t('Подписки удалены', 'Subscriptions deleted')
          : t('Удалить подписки', 'Delete subscriptions')}
      </button>
      <ConfirmDialog
        open={open}
        title={t('Удалить все подписки?', 'Delete all subscriptions?')}
        description={
          error ??
          t(
            'Удалит подписки и историю списаний во всех проектах. Действие необратимо.',
            'Removes all subscriptions and billing history across all projects. Irreversible.',
          )
        }
        confirmLabel={t('Удалить', 'Delete')}
        cancelLabel={t('Отмена', 'Cancel')}
        destructive
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
