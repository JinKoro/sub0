'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { monthLong } from '@/shared/constants/cabinet';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const navBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: `1px solid ${SUB0.line}`,
  background: SUB0.panel,
  color: SUB0.ink,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
} as const;

const quickBtn = {
  flex: 1,
  padding: '6px 10px',
  borderRadius: 6,
  border: `1px solid ${SUB0.line}`,
  background: SUB0.panel,
  color: SUB0.ink,
  fontSize: 12,
  fontFamily: mono,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

export function DatePicker({ value, onChange, placeholder }: Props) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const parsed = value
    ? (value.split('-').map(Number) as [number, number, number])
    : null;
  const today = new Date();
  const initialDate = parsed
    ? new Date(parsed[0], parsed[1] - 1, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const [view, setView] = useState(initialDate);

  const display = parsed
    ? `${parsed[2]} ${monthLong(parsed[1] - 1, lang)} ${parsed[0]}`
    : '';

  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysPrev = new Date(y, m, 0).getDate();

  const cells: { d: number; mo: -1 | 0 | 1 }[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push({ d: daysPrev - firstDow + 1 + i, mo: -1 });
  for (let i = 1; i <= daysInMonth; i += 1) cells.push({ d: i, mo: 0 });
  while (cells.length < 42) cells.push({ d: cells.length - daysInMonth - firstDow + 1, mo: 1 });

  const isSelected = (cell: { d: number; mo: -1 | 0 | 1 }) =>
    !!parsed && cell.mo === 0 && parsed[0] === y && parsed[1] - 1 === m && parsed[2] === cell.d;
  const isToday = (cell: { d: number; mo: -1 | 0 | 1 }) =>
    cell.mo === 0 &&
    y === today.getFullYear() &&
    m === today.getMonth() &&
    cell.d === today.getDate();

  const pick = (cell: { d: number; mo: -1 | 0 | 1 }) => {
    let py = y;
    let pm = m;
    const pd = cell.d;
    if (cell.mo === -1) {
      pm -= 1;
      if (pm < 0) {
        pm = 11;
        py -= 1;
      }
    }
    if (cell.mo === 1) {
      pm += 1;
      if (pm > 11) {
        pm = 0;
        py += 1;
      }
    }
    const mm = String(pm + 1).padStart(2, '0');
    const dd = String(pd).padStart(2, '0');
    onChange(`${py}-${mm}-${dd}`);
    setOpen(false);
  };

  const dows =
    lang === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: `1px solid ${open ? SUB0.ink : SUB0.line}`,
          background: SUB0.panel,
          color: parsed ? SUB0.ink : SUB0.muted,
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'border-color .12s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect
            x="1.5"
            y="2.5"
            width="11"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M1.5 5.5h11M4.5 1v3M9.5 1v3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: parsed ? 600 : 400 }}>
          {display || placeholder || t('Выберите дату', 'Pick a date')}
        </span>
        <svg
          width="9"
          height="6"
          viewBox="0 0 9 6"
          fill="none"
          style={{
            opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          }}
        >
          <path
            d="M1 1l3.5 3.5L8 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 280,
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 12,
            boxShadow: '0 16px 40px -16px rgba(10,10,10,.18)',
            padding: 12,
            zIndex: 90,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setView(new Date(y, m - 1, 1))}
              style={navBtn}
            >
              ‹
            </button>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: mono,
                letterSpacing: '0.02em',
              }}
            >
              {monthLong(m, lang)} {y}
            </div>
            <button
              type="button"
              onClick={() => setView(new Date(y, m + 1, 1))}
              style={navBtn}
            >
              ›
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4,
            }}
          >
            {dows.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: 10,
                  fontFamily: mono,
                  color: SUB0.muted,
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '4px 0',
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((cell, i) => {
              const sel = isSelected(cell);
              const isT = isToday(cell);
              const dim = cell.mo !== 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(cell)}
                  style={{
                    padding: '6px 0',
                    borderRadius: 6,
                    border:
                      isT && !sel ? `1px solid ${SUB0.line}` : '1px solid transparent',
                    background: sel ? SUB0.ink : 'transparent',
                    color: sel ? SUB0.bg : dim ? '#bdbcb4' : SUB0.ink,
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: sel ? 700 : 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!sel) e.currentTarget.style.background = SUB0.soft;
                  }}
                  onMouseLeave={(e) => {
                    if (!sel) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {cell.d}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${SUB0.line}`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                onChange(`${d.getFullYear()}-${mm}-${dd}`);
                setOpen(false);
              }}
              style={quickBtn}
            >
              {t('Сегодня', 'Today')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              style={quickBtn}
            >
              {t('Очистить', 'Clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
