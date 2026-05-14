'use client';

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';

export interface SelectOption {
  v: string;
  l: string;
  sub?: string;
  sym?: string;
  leading?: ReactNode;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  width?: number | string;
  placeholder?: string;
  align?: 'left' | 'right';
}

export function Select({ value, onChange, options, width, placeholder, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find((o) => o.v === value);

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    [align]: 0,
    minWidth: '100%',
    maxWidth: 'calc(100vw - 32px)',
    background: SUB0.panel,
    border: `1px solid ${SUB0.line}`,
    borderRadius: 10,
    boxShadow: '0 16px 40px -16px rgba(10,10,10,.18)',
    padding: 4,
    zIndex: 90,
    maxHeight: 320,
    overflowY: 'auto',
  };

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-block', width: width ?? 'auto' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px 8px 12px',
          borderRadius: 8,
          border: `1px solid ${open ? SUB0.ink : SUB0.line}`,
          background: SUB0.panel,
          color: SUB0.ink,
          fontSize: 13,
          fontFamily: 'inherit',
          cursor: 'pointer',
          width: width ? '100%' : 'auto',
          transition: 'border-color .12s',
        }}
      >
        {selected?.sym && (
          <span style={{ fontFamily: mono, fontWeight: 700, color: SUB0.ink }}>{selected.sym}</span>
        )}
        {selected?.leading}
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            fontWeight: 600,
            color: selected ? SUB0.ink : SUB0.muted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selected?.l ?? placeholder ?? '—'}
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
            flexShrink: 0,
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
        <div style={dropdownStyle}>
          {options.map((o) => {
            const isActive = o.v === value;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => {
                  onChange(o.v);
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
                  background: isActive ? SUB0.soft : 'transparent',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = SUB0.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {o.sym && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontWeight: 700,
                      fontSize: 14,
                      width: 22,
                      color: SUB0.ink,
                    }}
                  >
                    {o.sym}
                  </span>
                )}
                {o.leading}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: SUB0.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {o.l}
                  </div>
                  {o.sub && (
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: mono,
                        color: SUB0.muted,
                        marginTop: 1,
                      }}
                    >
                      {o.sub}
                    </div>
                  )}
                </span>
                {isActive && (
                  <span
                    style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700, fontSize: 12 }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
