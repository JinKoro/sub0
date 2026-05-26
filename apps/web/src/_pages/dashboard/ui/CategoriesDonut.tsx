'use client';

import { useMemo } from 'react';
import type { SubscriptionDto } from '@subzero/shared';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import { Pill } from '@/shared/components/ui/Pill';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import { useCategories } from '@/shared/contexts/categories-context';
import { isLive, monthlyRub } from '@/shared/contexts/subscriptions-context';
import { useFormatRub } from '../lib/format';

const OTHER_KEY = '__other__';

interface Props {
  subs: SubscriptionDto[];
}

export function CategoriesDonut({ subs }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const fmt = useFormatRub();
  const { rates } = useExchangeRates();
  const { items: categories, bySku } = useCategories();

  const { segments, total } = useMemo(() => {
    const now = new Date();
    const byCat: Record<string, number> = {};
    for (const s of subs) {
      if (!isLive(s)) continue;
      const key = s.categorySku ?? OTHER_KEY;
      byCat[key] = (byCat[key] ?? 0) + monthlyRub(s, rates, now);
    }
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const tot = entries.reduce((acc, [, v]) => acc + v, 0);
    return { segments: entries, total: tot };
  }, [subs, rates]);

  const donutSize = isMobile ? 130 : 160;
  const donutR = isMobile ? 48 : 60;
  const donutCirc = 2 * Math.PI * donutR;
  const donutStroke = isMobile ? 18 : 22;

  let acc = 0;
  const arcs = segments.map(([key, v]) => {
    const meta = key === OTHER_KEY ? undefined : bySku(key);
    const pct = total === 0 ? 0 : v / total;
    const dash = pct * donutCirc;
    const out = {
      key,
      v,
      pct,
      dash,
      offset: -acc * donutCirc,
      color: meta?.color ?? SUB0.muted,
      label:
        key === OTHER_KEY
          ? t('Другое', 'Other')
          : meta
            ? lang === 'en' ? meta.nameEn : meta.nameRu
            : t('Другое', 'Other'),
    };
    acc += pct;
    return out;
  });

  if (categories.length === 0 && segments.length > 0) {
    // словарь ещё не подгружен — рендерим без названий
  }

  return (
    <Card padding={24}>
      <CardHeader
        title={t('По категориям', 'By category')}
        right={<Pill>{t('Этот месяц', 'This month')}</Pill>}
      />
      {segments.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: SUB0.muted, fontSize: 13 }}>
          {t('Нет активных подписок', 'No active subscriptions')}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <svg
            width={donutSize}
            height={donutSize}
            viewBox={`0 0 ${donutSize} ${donutSize}`}
            style={{ flexShrink: 0 }}
          >
            <g transform={`translate(${donutSize / 2}, ${donutSize / 2}) rotate(-90)`}>
              <circle r={donutR} fill="none" stroke={SUB0.soft} strokeWidth={donutStroke} />
              {arcs.map((s, i) => (
                <circle
                  key={i}
                  r={donutR}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={donutStroke}
                  strokeDasharray={`${s.dash} ${donutCirc - s.dash}`}
                  strokeDashoffset={s.offset}
                />
              ))}
            </g>
            <text
              x={donutSize / 2}
              y={donutSize / 2 + 5}
              textAnchor="middle"
              style={{
                fontSize: isMobile ? 14 : 17,
                fontWeight: 700,
                fill: SUB0.ink,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {fmt(total)}
            </text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            {arcs.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  padding: '5px 0',
                  borderBottom: `1px solid ${SUB0.line}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </span>
                <span style={{ fontFamily: mono, color: SUB0.muted, fontSize: 11, flexShrink: 0 }}>
                  {Math.round(s.pct * 100)}%
                </span>
                <span
                  style={{
                    fontFamily: mono,
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                    textAlign: 'right',
                    minWidth: 56,
                  }}
                >
                  {fmt(s.v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
