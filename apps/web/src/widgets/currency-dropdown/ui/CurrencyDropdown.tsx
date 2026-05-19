'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { usePrefs } from '@/shared/hooks/use-prefs';
import { CURRENCY_OPTIONS } from '@/shared/constants/cabinet';

export function CurrencyDropdown() {
  const { t } = useLang();
  const { currency } = useCabinet();
  const { setCurrency } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = CURRENCY_OPTIONS.find((o) => o.id === currency) ?? CURRENCY_OPTIONS[0]!;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: SUB0.panel,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 700,
          color: SUB0.ink,
        }}
      >
        <span>{selected.sym}</span>
        <span style={{ color: SUB0.muted, fontSize: 11 }}>{selected.id}</span>
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          style={{
            opacity: 0.4,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          }}
        >
          <path
            d="M1 1l3 3 3-3"
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
            right: 0,
            minWidth: 220,
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 10,
            boxShadow: '0 16px 40px -16px rgba(10,10,10,.15)',
            padding: 6,
            zIndex: 80,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: mono,
              color: SUB0.muted,
              padding: '6px 10px 4px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('Валюта аналитики', 'Analytics currency')}
          </div>
          <div
            style={{
              fontSize: 11,
              color: SUB0.muted,
              padding: '0 10px 8px',
              lineHeight: 1.4,
              borderBottom: `1px solid ${SUB0.line}`,
            }}
          >
            {t(
              'Только для сводных сумм. Цены подписок в оригинальной валюте.',
              'For totals only. Subscription prices shown in their original currency.',
            )}
          </div>
          <div style={{ paddingTop: 4 }}>
            {CURRENCY_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setCurrency(o.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: currency === o.id ? SUB0.soft : 'transparent',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: 14,
                    width: 20,
                    color: SUB0.ink,
                  }}
                >
                  {o.sym}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: SUB0.ink }}>
                  {t(o.label, o.labelEn)}
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted }}>{o.id}</span>
                {currency === o.id && (
                  <span
                    style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700, fontSize: 12 }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
