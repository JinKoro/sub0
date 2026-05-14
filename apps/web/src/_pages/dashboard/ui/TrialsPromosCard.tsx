'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import { toRub, monthLong } from '@/shared/constants/cabinet';
import { useFormatRub } from '../lib/format';

interface Props {
  subs: CabinetSubscription[];
}

interface Item extends CabinetSubscription {
  kind: 'trial' | 'promo';
}

export function TrialsPromosCard({ subs }: Props) {
  const { t, lang } = useLang();
  const fmt = useFormatRub();

  const trials: Item[] = subs.filter((s) => s.trial).map((s) => ({ ...s, kind: 'trial' as const }));
  const promos: Item[] = subs
    .filter((s) => s.promo && !s.trial)
    .map((s) => ({ ...s, kind: 'promo' as const }));
  const items: Item[] = [...trials, ...promos];

  return (
    <Card
      padding={20}
      style={{
        background: items.length > 0 ? '#fff8f3' : SUB0.panel,
        borderColor: items.length > 0 ? '#f3d6c2' : SUB0.line,
      }}
    >
      <CardHeader
        title={t('Пробные и промо — на контроль', 'Trials & promos — watch out')}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 && (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: SUB0.muted,
              fontSize: 13,
            }}
          >
            {t('Нет активных пробных и промо 🎉', 'No active trials or promos 🎉')}
          </div>
        )}
        {items.map((it) => {
          const isTrial = it.kind === 'trial';
          const endsDay = isTrial ? it.nextDay : it.promoEndsDay ?? it.nextDay;
          const endsMonth = isTrial ? it.nextMonth : it.promoEndsMonth ?? it.nextMonth;
          const tagColor = isTrial ? SUB0.danger : SUB0.warn;
          const tagBg = isTrial ? '#fdecea' : '#fff3d6';
          const tagLabel = isTrial ? t('ПРОБНЫЙ', 'TRIAL') : t('ПРОМО', 'PROMO');

          return (
            <div
              key={`${it.kind}-${it.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: SUB0.panel,
                border: `1px solid ${SUB0.line}`,
                borderRadius: 10,
              }}
            >
              <LogoPill char={it.char} color={it.color ?? SUB0.muted} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: tagColor,
                      background: tagBg,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {tagLabel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
                  {t('Истекает', 'Ends')} {endsDay} {monthLong(endsMonth - 1, lang)} ·{' '}
                  {fmt(toRub(it.price, it.cur))}/{t('мес', 'mo')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
