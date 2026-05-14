'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import { Pill } from '@/shared/components/ui/Pill';
import { CATEGORIES } from '@/entities/subscription/model/cabinet-mock';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import { toRub } from '@/shared/constants/cabinet';
import { useFormatRub } from '../lib/format';

interface Props {
  subs: CabinetSubscription[];
}

export function CategoriesDonut({ subs }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const fmt = useFormatRub();

  const byCat: Record<string, number> = {};
  subs.forEach((s) => {
    if (s.status === 'paused' || s.status === 'archive') return;
    const v = toRub(s.price, s.cur);
    const m = s.cycle === 'yearly' ? v / 12 : v;
    byCat[s.cat] = (byCat[s.cat] ?? 0) + m;
  });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  const donutSize = isMobile ? 130 : 160;
  const donutR = isMobile ? 48 : 60;
  const donutCirc = 2 * Math.PI * donutR;
  const donutStroke = isMobile ? 18 : 22;

  let acc = 0;
  const segments = entries.map(([cat, v]) => {
    const pct = total === 0 ? 0 : v / total;
    const dash = pct * donutCirc;
    const seg = {
      cat,
      v,
      pct,
      dash,
      offset: -acc * donutCirc,
      color: CATEGORIES.find((c) => c.id === cat)?.color ?? SUB0.muted,
    };
    acc += pct;
    return seg;
  });

  return (
    <Card padding={24}>
      <CardHeader
        title={t('По категориям', 'By category')}
        right={<Pill>{t('Этот месяц', 'This month')}</Pill>}
      />
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg
          width={donutSize}
          height={donutSize}
          viewBox={`0 0 ${donutSize} ${donutSize}`}
          style={{ flexShrink: 0 }}
        >
          <g transform={`translate(${donutSize / 2}, ${donutSize / 2}) rotate(-90)`}>
            <circle r={donutR} fill="none" stroke={SUB0.soft} strokeWidth={donutStroke} />
            {segments.map((s, i) => (
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
          {segments.map((s) => {
            const meta = CATEGORIES.find((c) => c.id === s.cat);
            return (
              <div
                key={s.cat}
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
                  {meta ? t(meta.name, meta.nameEn) : s.cat}
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
            );
          })}
        </div>
      </div>
    </Card>
  );
}
