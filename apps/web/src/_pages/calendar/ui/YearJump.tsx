'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';

interface Props {
  value: number;
  onChange: (y: number) => void;
  today: Date;
}

export function YearJump({ value, onChange, today }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const ty = today.getFullYear();
  const years: number[] = [];
  for (let y = ty - 6; y <= ty + 4; y += 1) years.push(y);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          border: `1px solid ${SUB0.line}`,
          borderRadius: 6,
          background: SUB0.panel,
          color: SUB0.ink,
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {value}
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          style={{
            opacity: 0.5,
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
            minWidth: 100,
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 8,
            boxShadow: '0 16px 40px -16px rgba(10,10,10,.18)',
            padding: 4,
            zIndex: 70,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {years.map((y) => (
            <button
              key={y}
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                width: '100%',
                padding: '6px 10px',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: y === value ? SUB0.soft : 'transparent',
                textAlign: 'left',
                fontFamily: mono,
                fontSize: 12,
                fontWeight: 700,
                color: SUB0.ink,
              }}
              onMouseEnter={(e) => {
                if (y !== value) e.currentTarget.style.background = SUB0.bg;
              }}
              onMouseLeave={(e) => {
                if (y !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{y}</span>
              {y === ty && <span style={{ fontSize: 9, color: SUB0.muted, fontWeight: 600 }}>·</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
