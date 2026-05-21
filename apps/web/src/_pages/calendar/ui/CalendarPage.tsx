'use client';

import { useCallback, useMemo, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { Card } from '@/shared/components/ui/Card';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { CAB_SUBS, CATEGORIES } from '@/entities/subscription/model/cabinet-mock';
import { useProjects } from '@/shared/contexts/projects-context';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import {
  toRub,
  fromRub,
  curSymbol,
  monthLong,
} from '@/shared/constants/cabinet';
import { YearJump } from './YearJump';

interface Cell {
  d: number;
  m: number;
  y: number;
  dim: boolean;
}

const navArrow = {
  width: 32,
  height: 32,
  borderRadius: 7,
  border: `1px solid ${SUB0.line}`,
  background: SUB0.panel,
  color: SUB0.ink,
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
  lineHeight: 1,
} as const;

const isLive = (s: CabinetSubscription) => s.status !== 'archive' && s.status !== 'paused';

export function CalendarPage() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const { currency, project } = useCabinet();
  const { projects } = useProjects();
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const items = useMemo(
    () => (project === 'all' ? CAB_SUBS : CAB_SUBS.filter((s) => s.project === project)),
    [project],
  );

  const occurrencesFor = useCallback(
    (y: number, m: number, d: number): CabinetSubscription[] => {
      const cellDate = new Date(y, m, d);
      return items.filter((s) => {
        if (s.cycle === 'monthly') {
          if (s.nextDay !== d) return false;
        } else if (s.cycle === 'yearly') {
          if (s.nextDay !== d || s.nextMonth - 1 !== m) return false;
        } else {
          return false;
        }
        if (!isLive(s) && cellDate > today) return false;
        return true;
      });
    },
    [items, today],
  );

  const cells = useMemo<Cell[]>(() => {
    const { y, m } = view;
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysPrev = new Date(y, m, 0).getDate();
    const out: Cell[] = [];
    for (let i = 0; i < firstDow; i += 1) {
      const d = daysPrev - firstDow + 1 + i;
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      out.push({ d, m: pm, y: py, dim: true });
    }
    for (let d = 1; d <= daysInMonth; d += 1) out.push({ d, m, y, dim: false });
    while (out.length < 42) {
      const d = out.length - daysInMonth - firstDow + 1;
      const nm = m === 11 ? 0 : m + 1;
      const ny = m === 11 ? y + 1 : y;
      out.push({ d, m: nm, y: ny, dim: true });
    }
    return out;
  }, [view]);

  const monthOccurrences = useMemo(() => {
    const out: { cell: Cell; its: CabinetSubscription[] }[] = [];
    cells.forEach((c) => {
      if (c.dim) return;
      const its = occurrencesFor(c.y, c.m, c.d);
      if (its.length) out.push({ cell: c, its });
    });
    return out;
  }, [cells, occurrencesFor]);

  const monthTotal = monthOccurrences.reduce(
    (s, mo) => s + mo.its.reduce((a, x) => a + toRub(x.price, x.cur), 0),
    0,
  );
  const monthCount = monthOccurrences.reduce((s, mo) => s + mo.its.length, 0);

  const isPastMonth =
    view.y < today.getFullYear() ||
    (view.y === today.getFullYear() && view.m < today.getMonth());

  const goPrev = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const goNext = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  const goToday = () => setView({ y: today.getFullYear(), m: today.getMonth() });

  const dows =
    lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const fmtTotal = (rub: number) =>
    `${Math.round(fromRub(rub, currency)).toLocaleString('ru-RU')} ${curSymbol(currency)}`;

  const selected = selectedKey
    ? (() => {
        const parts = selectedKey.split('-').map(Number) as [number, number, number];
        const [sy, sm, sd] = parts;
        const its = occurrencesFor(sy, sm, sd);
        if (!its.length) return null;
        const cellDate = new Date(sy, sm, sd);
        const isPast = cellDate < today && cellDate.toDateString() !== today.toDateString();
        return { y: sy, m: sm, d: sd, its, isPast };
      })()
    : null;

  return (
    <div
      style={{
        padding: isMobile ? '20px 16px' : '32px 28px',
        maxWidth: 1320,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'end',
          marginBottom: isMobile ? 18 : 24,
          gap: isMobile ? 14 : 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            {t('История и план списаний', 'Charges — history & upcoming')}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t('Календарь', 'Calendar')}
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            padding: isMobile ? '10px 14px' : 0,
            background: isMobile ? SUB0.panel : 'transparent',
            border: isMobile ? `1px solid ${SUB0.line}` : 'none',
            borderRadius: isMobile ? 10 : 0,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {isPastMonth
              ? t('Списано в этом месяце', 'Charged this month')
              : t('Будет списано в этом месяце', 'To be charged this month')}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: SUB0.blue,
              fontFeatureSettings: '"tnum"',
              marginTop: 2,
            }}
          >
            {fmtTotal(monthTotal)}
          </div>
        </div>
      </div>

      <Card padding={0}>
        {isMobile ? (
          <div style={{ borderBottom: `1px solid ${SUB0.line}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                gap: 8,
              }}
            >
              <button onClick={goPrev} style={navArrow} aria-label={t('Прошлый месяц', 'Previous month')}>
                ‹
              </button>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {monthLong(view.m, lang).replace(/^./, (c) => c.toUpperCase())}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      color: SUB0.muted,
                      fontFamily: mono,
                    }}
                  >
                    {view.y}
                  </span>
                </div>
                {isPastMonth && (
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: mono,
                      fontWeight: 700,
                      padding: '2px 6px',
                      background: SUB0.soft,
                      color: SUB0.muted,
                      borderRadius: 3,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t('ИСТОРИЯ', 'PAST')}
                  </span>
                )}
              </div>
              <button onClick={goNext} style={navArrow} aria-label={t('Следующий месяц', 'Next month')}>
                ›
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px 12px',
                gap: 10,
              }}
            >
              <button
                onClick={goToday}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: `1px solid ${SUB0.line}`,
                  background: SUB0.panel,
                  color: SUB0.ink,
                  fontSize: 12,
                  fontFamily: mono,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('Сегодня', 'Today')}
              </button>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  fontSize: 11,
                  fontFamily: mono,
                  color: SUB0.muted,
                }}
              >
                <span>
                  {monthCount} {t('спис.', 'chrg')}
                </span>
                <span style={{ width: 1, height: 14, background: SUB0.line }} />
                <YearJump
                  value={view.y}
                  onChange={(y) => setView((v) => ({ ...v, y }))}
                  today={today}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: `1px solid ${SUB0.line}`,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={goPrev} style={navArrow} aria-label={t('Прошлый месяц', 'Previous month')}>
                ‹
              </button>
              <button onClick={goNext} style={navArrow} aria-label={t('Следующий месяц', 'Next month')}>
                ›
              </button>
              <button
                onClick={goToday}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: `1px solid ${SUB0.line}`,
                  background: SUB0.panel,
                  color: SUB0.ink,
                  fontSize: 12,
                  fontFamily: mono,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                {t('Сегодня', 'Today')}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {monthLong(view.m, lang).replace(/^./, (c) => c.toUpperCase())}
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 400, color: SUB0.muted, fontFamily: mono }}
              >
                {view.y}
              </div>
              {isPastMonth && (
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: mono,
                    fontWeight: 700,
                    padding: '2px 6px',
                    background: SUB0.soft,
                    color: SUB0.muted,
                    borderRadius: 3,
                    letterSpacing: '0.08em',
                  }}
                >
                  {t('ИСТОРИЯ', 'PAST')}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 14,
                fontSize: 11,
                fontFamily: mono,
                color: SUB0.muted,
                alignItems: 'center',
              }}
            >
              <span>
                {monthCount} {t('спис.', 'chrg')}
              </span>
              <span style={{ width: 1, height: 14, background: SUB0.line }} />
              <YearJump
                value={view.y}
                onChange={(y) => setView((v) => ({ ...v, y }))}
                today={today}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: `1px solid ${SUB0.line}`,
            background: SUB0.bg,
          }}
        >
          {dows.map((d) => (
            <div
              key={d}
              style={{
                padding: isMobile ? '8px 2px' : '10px 12px',
                fontSize: isMobile ? 10 : 11,
                fontFamily: mono,
                color: SUB0.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {isMobile ? d.slice(0, 2) : d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, i) => {
            const its = cell.dim ? [] : occurrencesFor(cell.y, cell.m, cell.d);
            const cellDate = new Date(cell.y, cell.m, cell.d);
            const isTodayCell = cellDate.toDateString() === today.toDateString();
            const isPast = cellDate < today && !isTodayCell;
            const key = `${cell.y}-${cell.m}-${cell.d}`;
            const isSelected = selectedKey === key;
            const has = its.length > 0;
            const maxPills = isMobile ? 1 : 5;
            const pillSize = isMobile ? 16 : 22;

            return (
              <button
                key={i}
                onClick={() => has && setSelectedKey(isSelected ? null : key)}
                disabled={!has || cell.dim}
                style={{
                  minHeight: isMobile ? 64 : 110,
                  padding: isMobile ? 4 : 8,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  borderRight: `1px solid ${SUB0.line2}`,
                  borderBottom: `1px solid ${SUB0.line2}`,
                  borderTop: 'none',
                  borderLeft: 'none',
                  cursor: has ? 'pointer' : 'default',
                  background: isSelected
                    ? SUB0.ink
                    : isTodayCell
                      ? '#fff8f3'
                      : cell.dim
                        ? SUB0.bg
                        : SUB0.panel,
                  color: isSelected ? '#fff' : SUB0.ink,
                  position: 'relative',
                  opacity: cell.dim ? 0.6 : 1,
                  transition: 'background .12s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMobile ? 'center' : 'stretch',
                  gap: isMobile ? 2 : 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: isMobile ? 'center' : 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: isMobile ? 0 : 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: mono,
                      fontWeight: isTodayCell ? 800 : 600,
                      color: isSelected
                        ? '#fff'
                        : cell.dim
                          ? SUB0.muted
                          : isTodayCell
                            ? '#fff'
                            : SUB0.ink,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 999,
                      padding: isTodayCell ? '0 6px' : 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isTodayCell && !isSelected ? SUB0.blue : 'transparent',
                      lineHeight: 1,
                    }}
                  >
                    {cell.d}
                  </span>
                </div>
                {has && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isMobile ? 'center' : 'flex-start',
                      flexWrap: isMobile ? 'nowrap' : 'wrap',
                      gap: 0,
                      marginTop: isMobile ? 0 : 'auto',
                      maxWidth: '100%',
                    }}
                  >
                    {its.slice(0, maxPills).map((s, idx) => (
                      <span
                        key={`${s.id}-${idx}`}
                        title={s.name}
                        style={{
                          width: pillSize,
                          height: pillSize,
                          borderRadius: 999,
                          background: s.color ?? SUB0.muted,
                          color: '#fff',
                          fontSize: isMobile ? 8 : 10,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${
                            isSelected
                              ? SUB0.ink
                              : isTodayCell
                                ? '#fff8f3'
                                : cell.dim
                                  ? SUB0.bg
                                  : SUB0.panel
                          }`,
                          marginLeft: idx === 0 ? 0 : -7,
                          flexShrink: 0,
                          opacity: isPast && !isLive(s) ? 0.55 : 1,
                          filter: isPast ? 'saturate(0.85)' : 'none',
                        }}
                      >
                        {s.char || '·'}
                      </span>
                    ))}
                    {its.length > maxPills && (
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: isMobile ? 9 : 10,
                          fontWeight: 700,
                          marginLeft: isMobile ? 3 : 6,
                          color: isSelected ? 'rgba(255,255,255,.85)' : SUB0.muted,
                        }}
                      >
                        +{its.length - maxPills}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div
            style={{
              borderTop: `1px solid ${SUB0.line}`,
              padding: '16px 20px',
              background: SUB0.bg,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {selected.d} {monthLong(selected.m, lang)} {selected.y}
                </div>
                <div style={{ fontSize: 12, fontFamily: mono, color: SUB0.muted }}>
                  {selected.its.length}{' '}
                  {selected.its.length === 1
                    ? t('подписка', 'subscription')
                    : t('подписок', 'subscriptions')}
                </div>
                {selected.isPast && (
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: mono,
                      fontWeight: 700,
                      padding: '2px 6px',
                      background: SUB0.soft,
                      color: SUB0.muted,
                      borderRadius: 3,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t('СПИСАНО', 'CHARGED')}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 8,
              }}
            >
              {selected.its.map((s) => {
                const meta = CATEGORIES.find((c) => c.id === s.cat);
                const proj = projects.find((p) => p.id === s.project);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: SUB0.panel,
                      border: `1px solid ${SUB0.line}`,
                      borderRadius: 8,
                    }}
                  >
                    <LogoPill char={s.char} color={s.color ?? SUB0.muted} icon={s.icon} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: mono,
                          color: SUB0.muted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 2,
                            background: meta?.color ?? SUB0.muted,
                          }}
                        />
                        {meta ? t(meta.name, meta.nameEn) : ''}
                        <span style={{ opacity: 0.5 }}>·</span>
                        <span>{proj ? proj.name : ''}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFeatureSettings: '"tnum"',
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 4,
                      }}
                    >
                      <span>{Number(s.price).toLocaleString('ru-RU')}</span>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: SUB0.muted,
                          fontWeight: 600,
                        }}
                      >
                        {s.cur}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div
        style={{
          marginTop: 12,
          padding: '10px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 11,
          fontFamily: mono,
          color: SUB0.muted,
          alignItems: 'center',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: '#fff8f3',
              border: '1px solid #f3d6c2',
              borderRadius: 3,
            }}
          />
          {t('Сегодня', 'Today')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: SUB0.bg,
              border: `1px solid ${SUB0.line}`,
              borderRadius: 3,
            }}
          />
          {t('Соседний месяц', 'Adjacent month')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: SUB0.muted,
              opacity: 0.55,
              borderRadius: 999,
              filter: 'saturate(0.85)',
            }}
          />
          {t(
            'Списания на паузе/в архиве — только в прошлом',
            'Paused / archived — past only',
          )}
        </span>
      </div>
    </div>
  );
}
