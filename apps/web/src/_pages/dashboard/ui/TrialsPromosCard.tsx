'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { SubscriptionDto } from '@subzero/shared';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import { chargeRub, isLive, subChar } from '@/shared/contexts/subscriptions-context';
import { monthLong } from '@/shared/constants/cabinet';
import { useFormatRub } from '../lib/format';

interface Props {
  subs: SubscriptionDto[];
}

interface Item {
  sub: SubscriptionDto;
  kind: 'trial' | 'promo';
  endsAt: Date;
}

export function TrialsPromosCard({ subs }: Props) {
  const { t, lang } = useLang();
  const fmt = useFormatRub();
  const { rates } = useExchangeRates();

  const items = useMemo<Item[]>(() => {
    const now = new Date();
    const out: Item[] = [];
    for (const s of subs) {
      if (!isLive(s)) continue;
      if (s.isTrial && s.trialEndsAt) {
        const ends = new Date(s.trialEndsAt);
        if (ends > now) {
          out.push({ sub: s, kind: 'trial', endsAt: ends });
          continue; // trial и promo одновременно — в карточке показываем триал как приоритетный
        }
      }
      // promo с минимальным amount, у которого endsAt > now
      let best: { amount: number; endsAt: Date } | null = null;
      for (const p of s.promos) {
        const ends = new Date(p.endsAt);
        if (ends <= now) continue;
        const a = Number(p.amount);
        if (best === null || a < best.amount) best = { amount: a, endsAt: ends };
      }
      if (best) out.push({ sub: s, kind: 'promo', endsAt: best.endsAt });
    }
    out.sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
    return out;
  }, [subs]);

  return (
    <Card
      padding={20}
      style={{
        background: items.length > 0 ? '#fff8f3' : SUB0.panel,
        borderColor: items.length > 0 ? '#f3d6c2' : SUB0.line,
      }}
    >
      <CardHeader title={t('Пробные и промо — на контроль', 'Trials & promos — watch out')} />
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
          const tagColor = isTrial ? SUB0.danger : SUB0.warn;
          const tagBg = isTrial ? '#fdecea' : '#fff3d6';
          const tagLabel = isTrial ? t('ПРОБНЫЙ', 'TRIAL') : t('ПРОМО', 'PROMO');
          const now = new Date();
          const amountRub = chargeRub(it.sub, rates, now);

          return (
            <Link
              key={`${it.kind}-${it.sub.sku}`}
              href={`/account/subscriptions/${it.sub.sku}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: SUB0.panel,
                border: `1px solid ${SUB0.line}`,
                borderRadius: 10,
                textDecoration: 'none',
                color: SUB0.ink,
              }}
            >
              <LogoPill
                char={subChar(it.sub)}
                color={it.sub.color ?? SUB0.muted}
                icon={it.sub.icon}
                size={32}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{it.sub.name}</span>
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
                  {t('Истекает', 'Ends')} {it.endsAt.getDate()}{' '}
                  {monthLong(it.endsAt.getMonth(), lang)} · {fmt(amountRub)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
