'use client';

import { ReactNode, useMemo } from 'react';
import type { SubscriptionDto } from '@subzero/shared';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import {
  activePromoAmount,
  isLive,
  monthlyRub,
} from '@/shared/contexts/subscriptions-context';
import { useFormatRub } from '../lib/format';

interface KpiProps {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}

function Kpi({ label, value, highlight }: KpiProps) {
  return (
    <div
      style={{
        background: highlight ? SUB0.ink : SUB0.panel,
        color: highlight ? SUB0.bg : SUB0.ink,
        border: `1px solid ${highlight ? SUB0.ink : SUB0.line}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: mono,
          color: highlight ? '#cfcfc6' : SUB0.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'clamp(18px, 4.4vw, 26px)',
          fontWeight: 700,
          fontFeatureSettings: '"tnum"',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: highlight ? SUB0.bg : SUB0.ink,
          overflowWrap: 'anywhere',
          minWidth: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

interface Props {
  subs: SubscriptionDto[];
}

export function KpiRow({ subs }: Props) {
  const { t } = useLang();
  const fmt = useFormatRub();
  const isMobile = useIsMobile();
  const { rates, stale: ratesStale } = useExchangeRates();

  const { monthly, yearly, activeCount, trialCount, promoCount } = useMemo(() => {
    const now = new Date();
    const live = subs.filter(isLive);
    let m = 0;
    let trials = 0;
    let promos = 0;
    for (const s of live) {
      m += monthlyRub(s, rates, now);
      if (s.isTrial && s.trialEndsAt && new Date(s.trialEndsAt) > now) trials += 1;
      if (activePromoAmount(s, now) !== null && !s.isTrial) promos += 1;
    }
    return {
      monthly: m,
      yearly: m * 12,
      activeCount: live.length,
      trialCount: trials,
      promoCount: promos,
    };
  }, [subs, rates]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 16,
      }}
    >
      <Kpi label={t('Всего подписок', 'Total subs')} value={activeCount} />
      <Kpi
        label={
          ratesStale
            ? `${t('В месяц', 'Per month')} · ${t('курс устарел', 'rate stale')}`
            : t('В месяц', 'Per month')
        }
        value={fmt(monthly)}
        highlight
      />
      <Kpi label={t('Прогноз в год', 'Yearly forecast')} value={fmt(yearly)} />
      <Kpi
        label={t('Под контроль', 'Watch out')}
        value={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
              rowGap: 2,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: SUB0.danger }}>{trialCount}</span>
              <span style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono, fontWeight: 500 }}>
                {t('пробных', 'trial')}
              </span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ width: 1, height: 16, background: SUB0.line, alignSelf: 'center' }} />
              <span style={{ color: SUB0.warn }}>{promoCount}</span>
              <span style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono, fontWeight: 500 }}>
                {t('промо', 'promo')}
              </span>
            </span>
          </span>
        }
      />
    </div>
  );
}
