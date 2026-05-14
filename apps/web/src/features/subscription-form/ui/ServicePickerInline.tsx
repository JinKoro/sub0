'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { CATEGORIES, PRESET_SERVICES, type PresetService } from '@/entities/subscription/model/cabinet-mock';

interface Props {
  onPick: (service: PresetService) => void;
}

export function ServicePickerInline({ onPick }: Props) {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = q
    ? PRESET_SERVICES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : PRESET_SERVICES;
  const showResults = open && filtered.length > 0;

  return (
    <div style={{ padding: '0 24px 4px' }}>
      <div
        ref={ref}
        style={{
          position: 'relative',
          background: SUB0.bg,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 5,
              background: `${SUB0.blue}18`,
              color: SUB0.blue,
              fontFamily: mono,
              fontWeight: 800,
              fontSize: 11,
            }}
          >
            ★
          </span>
          <div style={{ fontSize: 12, fontWeight: 700, color: SUB0.ink }}>
            {t(
              'Выбрать сервис — заполним часть полей за вас',
              "Pick a service — we'll fill the name & category",
            )}
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontFamily: mono,
              color: SUB0.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {t('необязательно', 'optional')}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: SUB0.panel,
            border: `1px solid ${open ? SUB0.ink : SUB0.line}`,
            borderRadius: 8,
            padding: '8px 12px',
            transition: 'border-color .12s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke={SUB0.muted} strokeWidth="1.5" />
            <path
              d="M9.5 9.5L12 12"
              stroke={SUB0.muted}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t(
              'Netflix, Spotify, Notion, ChatGPT…',
              'Netflix, Spotify, Notion, ChatGPT…',
            )}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: SUB0.muted,
                fontFamily: mono,
                fontSize: 14,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {showResults && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 12,
              right: 12,
              zIndex: 60,
              background: SUB0.panel,
              border: `1px solid ${SUB0.line}`,
              borderRadius: 10,
              boxShadow: '0 16px 40px -16px rgba(10,10,10,.18)',
              padding: 4,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {filtered.map((p) => {
              const meta = CATEGORIES.find((c) => c.id === p.cat);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    onPick(p);
                    setQ('');
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = SUB0.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogoPill char={p.char} color={p.color} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: SUB0.ink }}>{p.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: mono,
                        color: SUB0.muted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 2,
                          background: meta?.color ?? SUB0.muted,
                        }}
                      />
                      {meta ? t(meta.name, meta.nameEn) : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: mono, color: SUB0.muted }}>
                    {t('Заполнить', 'Use')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
