'use client';

import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  open: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

export function BurgerButton({ open, onClick, ariaLabel = 'menu' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        background: open ? SUB0.ink : SUB0.panel,
        color: open ? SUB0.bg : SUB0.ink,
        border: `1px solid ${open ? SUB0.ink : SUB0.line}`,
        borderRadius: 8,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background .15s, color .15s, border-color .15s',
      }}
    >
      {open ? (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 3l12 12M15 3L3 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path
            d="M1 1h14M1 6h14M1 11h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
