'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SubscriptionDto } from '@subzero/shared';
import { Currency } from '@subzero/shared';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import { Pill } from '@/shared/components/ui/Pill';
import { monthShort, monthLong, curSymbol } from '@/shared/constants/cabinet';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import {
  chargeRub,
  curToEnum,
  occurrencesInRange,
  subChar,
} from '@/shared/contexts/subscriptions-context';

interface Cell {
  day: number;
  month: number;
  year: number;
  key: string;
}

interface Props {
  subs: SubscriptionDto[];
}

interface DayHit {
  sub: SubscriptionDto;
  amountRub: number;
}

export function MiniCalendar({ subs }: Props) {
  const { t, lang } = useLang();
  const { currency } = useCabinet();
  const { rates } = useExchangeRates();
  const targetRate = rates[curToEnum(currency) ?? Currency.RUB] ?? 1;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const days = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      });
    }
    return out;
  }, [today]);

  const horizon = useMemo(() => {
    const h = new Date(today);
    h.setDate(today.getDate() + 29);
    h.setHours(23, 59, 59, 999);
    return h;
  }, [today]);

  // Карта day-key → подписки которые имеют там occurrence
  const byDay = useMemo<Record<string, DayHit[]>>(() => {
    const now = new Date();
    const map: Record<string, DayHit[]> = {};
    for (const s of subs) {
      const occ = occurrencesInRange(s, today, horizon);
      if (occ.length === 0) continue;
      const amountRub = chargeRub(s, rates, now);
      for (const d of occ) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        (map[key] ??= []).push({ sub: s, amountRub });
      }
    }
    return map;
  }, [subs, rates, today, horizon]);

  const firstWeekday = today.getDay() || 7;
  const cells: (Cell | null)[] = [];
  for (let i = 1; i < firstWeekday; i += 1) cells.push(null);
  cells.push(...days);

  const totalSum = useMemo(() => {
    let s = 0;
    for (const c of days) for (const hit of byDay[c.key] ?? []) s += hit.amountRub;
    return s;
  }, [days, byDay]);

  const fmtLocale = (rub: number) =>
    `${Math.round(rub / targetRate).toLocaleString('ru-RU')} ${curSymbol(currency)}`;

  const dayLabels =
    lang === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const selectedCell = selectedKey ? days.find((c) => c.key === selectedKey) ?? null : null;
  const selectedItems = selectedCell ? byDay[selectedCell.key] ?? [] : [];
  const selectedTotal = selectedItems.reduce((s, x) => s + x.amountRub, 0);

  return (
    <Card padding={20}>
      <CardHeader
        title={t('Календарь списаний', 'Renewal calendar')}
        right={<Pill>{t('на 30 дней', 'next 30 days')}</Pill>}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          fontFamily: mono,
          fontSize: 10,
          color: SUB0.muted,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {dayLabels.map((d) => (
          <div key={d} style={{ textAlign: 'center' }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((cell, i) => {
          if (cell === null) return <div key={`pad-${i}`} />;
          const d = cell.day;
          const its = byDay[cell.key] ?? [];
          const has = its.length > 0;
          const isToday = i === firstWeekday - 1;
          const isSelected = selectedKey === cell.key;
          const isMonthStart = d === 1;
          return (
            <button
              key={cell.key}
              onClick={() => has && setSelectedKey(isSelected ? null : cell.key)}
              disabled={!has}
              style={{
                aspectRatio: '1 / 1',
                background: isSelected ? SUB0.ink : isToday ? '#fff8f3' : SUB0.panel,
                color: isSelected ? '#fff' : SUB0.ink,
                borderRadius: 6,
                padding: '4px 5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isSelected
                  ? `1px solid ${SUB0.ink}`
                  : isToday
                    ? '1px solid #f3d6c2'
                    : `1px solid ${SUB0.line2}`,
                cursor: has ? 'pointer' : 'default',
                opacity: has || isToday ? 1 : 0.55,
                position: 'relative',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: isSelected ? '#fff' : has ? SUB0.ink : SUB0.muted,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 3,
                }}
              >
                {d}
                {isMonthStart && (
                  <span style={{ fontSize: 8, opacity: 0.6, fontWeight: 500 }}>
                    {monthShort(cell.month, lang).slice(0, 3).toLowerCase()}
                  </span>
                )}
              </span>
              {has && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
                  {its.slice(0, 3).map((hit, idx) => {
                    const hasIcon = Boolean(hit.sub.icon);
                    return (
                      <span
                        key={hit.sub.sku}
                        title={hit.sub.name}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          background: hasIcon ? '#fff' : hit.sub.color ?? SUB0.muted,
                          color: '#fff',
                          fontSize: 8,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1.5px solid ${isSelected ? SUB0.ink : SUB0.panel}`,
                          marginLeft: idx === 0 ? 0 : -5,
                          overflow: 'hidden',
                        }}
                      >
                        {hasIcon ? (
                          <Image
                            src={hit.sub.icon as string}
                            alt={hit.sub.name}
                            width={10}
                            height={10}
                            unoptimized
                            style={{ objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          subChar(hit.sub)
                        )}
                      </span>
                    );
                  })}
                  {its.length > 3 && (
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9,
                        fontWeight: 700,
                        marginLeft: 4,
                        color: isSelected ? '#fff' : SUB0.muted,
                      }}
                    >
                      +{its.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedCell && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: SUB0.soft,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {selectedCell.day} {monthLong(selectedCell.month, lang)} ·{' '}
              <span style={{ fontFamily: mono, color: SUB0.muted, fontWeight: 500 }}>
                {selectedItems.length}{' '}
                {lang === 'en'
                  ? selectedItems.length === 1
                    ? 'subscription'
                    : 'subscriptions'
                  : selectedItems.length === 1
                    ? 'подписка'
                    : selectedItems.length < 5
                      ? 'подписки'
                      : 'подписок'}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontFeatureSettings: '"tnum"' }}>
              {fmtLocale(selectedTotal)}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {selectedItems.map((hit) => (
              <Link
                key={hit.sub.sku}
                href={`/account/subscriptions/${hit.sub.sku}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  textDecoration: 'none',
                  color: SUB0.ink,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: hit.sub.color ?? SUB0.muted,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {subChar(hit.sub)}
                </span>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hit.sub.name}
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFeatureSettings: '"tnum"',
                    flexShrink: 0,
                  }}
                >
                  {fmtLocale(hit.amountRub)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px dashed ${SUB0.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: SUB0.muted,
          fontFamily: mono,
        }}
      >
        <span>{t('Всего за 30 дней', '30-day total')}</span>
        <span style={{ color: SUB0.ink, fontWeight: 700 }}>{fmtLocale(totalSum)}</span>
      </div>
    </Card>
  );
}
