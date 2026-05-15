'use client';

import { SUB0 } from '@/shared/constants/tokens';

interface Option<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
}

export function SegControl<T extends string>({ value, onChange, options }: Props<T>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        borderRadius: 8,
        background: SUB0.soft,
        border: `1px solid ${SUB0.line}`,
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      {options.map((o) => {
        const isActive = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: isActive ? SUB0.panel : 'transparent',
              color: isActive ? SUB0.ink : SUB0.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: isActive ? '0 1px 2px rgba(10,10,10,.06)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
