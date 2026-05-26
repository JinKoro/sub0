'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { Card } from '@/shared/components/ui/Card';
import { CardHeader } from '@/shared/components/ui/CardHeader';
import { Pill } from '@/shared/components/ui/Pill';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import { Currency } from '@subzero/shared';
import { monthShort, monthLong, curSymbol } from '@/shared/constants/cabinet';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useExchangeRates, useToRub } from '@/shared/contexts/exchange-rates-context';

const CAB_CUR_TO_ENUM: Record<string, number> = {
  RUB: Currency.RUB,
  USD: Currency.USD,
  EUR: Currency.EUR,
  BYN: Currency.BYN,
};

interface Cell {
  day: number;
  month: number;
  year: number;
  key: string;
}

interface Props {
  subs: CabinetSubscription[];
}

export function MiniCalendar({ subs }: Props) {
  const { t, lang } = useLang();
  const { currency } = useCabinet();
  const { rates } = useExchangeRates();
  const toRub = useToRub();
  const targetRate = rates[CAB_CUR_TO_ENUM[currency] ?? Currency.RUB] ?? 1;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const today = new Date();
  const days: Cell[] = [];
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      key: `${d.getMonth()}-${d.getDate()}`,
    });
  }

  const firstWeekday = today.getDay() || 7;
  const cells: (Cell | null)[] = [];
  for (let i = 1; i < firstWeekday; i += 1) cells.push(null);
  cells.push(...days);

  const dayItems = (cell: Cell) =>
    subs.filter((s) => s.nextMonth === cell.month + 1 && s.nextDay === cell.day);
  const totalSum = days.reduce(
    (acc, c) => acc + dayItems(c).reduce((s, x) => s + toRub(x.price, x.cur), 0),
    0,
  );

  const fmtLocale = (rub: number) =>
    `${Math.round(rub / targetRate).toLocaleString('ru-RU')} ${curSymbol(currency)}`;

  const dayLabels =
    lang === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const selectedCell = selectedKey ? days.find((c) => c.key === selectedKey) ?? null : null;
  const selectedItems = selectedCell ? dayItems(selectedCell) : [];
  const selectedTotal = selectedItems.reduce((s, x) => s + toRub(x.price, x.cur), 0);

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
          const its = dayItems(cell);
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
                  {its.slice(0, 3).map((s, idx) => (
                    <span
                      key={s.id}
                      title={s.name}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: s.color ?? SUB0.muted,
                        color: '#fff',
                        fontSize: 8,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${isSelected ? SUB0.ink : SUB0.panel}`,
                        marginLeft: idx === 0 ? 0 : -5,
                      }}
                    >
                      {s.color ? s.char : '·'}
                    </span>
                  ))}
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
            {selectedItems.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: s.color ?? SUB0.muted,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {s.char || '·'}
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
                  {s.name}
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
                  {fmtLocale(toRub(s.price, s.cur))}
                </div>
              </div>
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
