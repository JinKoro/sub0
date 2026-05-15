'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { TIMEZONES } from '@/shared/constants/cabinet';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function TimezoneDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = TIMEZONES.find((o) => o.id === value) ?? TIMEZONES[1]!;

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        minWidth: 0,
        width: '100%',
        maxWidth: 320,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '9px 12px',
          background: SUB0.panel,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          color: SUB0.ink,
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              color: SUB0.muted,
              letterSpacing: '0.04em',
            }}
          >
            {selected.offset}
          </span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.label}
          </span>
        </span>
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
            left: 0,
            right: 0,
            minWidth: '100%',
            maxWidth: 'calc(100vw - 32px)',
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 10,
            boxShadow: '0 16px 40px -16px rgba(10,10,10,.15)',
            padding: 6,
            zIndex: 80,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {TIMEZONES.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                onChange(o.id);
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
                background: value === o.id ? SUB0.soft : 'transparent',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 11,
                  width: 48,
                  color: SUB0.muted,
                }}
              >
                {o.offset}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: SUB0.ink }}>{o.label}</span>
              {value === o.id && (
                <span
                  style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700, fontSize: 12 }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
