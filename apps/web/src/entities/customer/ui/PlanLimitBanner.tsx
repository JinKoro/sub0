'use client';

import Link from 'next/link';

import { Card } from '@/shared/components/ui/Card';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';

import type { PlanLimit } from '../model/use-plan-limit';

interface Props {
  limit: PlanLimit;
}

/** Жёлтый баннер апсейла: на reached («5/5») и на предпоследнем слоте.
 *  Кнопка ведёт в #billing, чтобы юзер оказался в апгрейде в один клик.
 *  Для PRO (limit = Infinity) — ничего не рисуем. */
export function PlanLimitBanner({ limit }: Props) {
  const { t } = useLang();
  if (!limit.isFree) return null;
  if (limit.used < limit.limit - 1) return null;

  const text = t(
    `${limit.used} из ${limit.limit} — обновитесь до Pro для безлимита`,
    `${limit.used} of ${limit.limit} — upgrade to Pro for unlimited`,
  );

  return (
    <Card
      padding={12}
      style={{
        marginBottom: 14,
        background: '#fff3d6',
        borderColor: SUB0.warn,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: 13, fontFamily: mono, color: SUB0.ink }}>{text}</div>
      <Link
        href="/account/settings#billing"
        style={{
          fontSize: 12,
          fontFamily: mono,
          color: SUB0.ink,
          fontWeight: 700,
          textDecoration: 'underline',
        }}
      >
        {t('Перейти на Pro', 'Upgrade to Pro')}
      </Link>
    </Card>
  );
}
