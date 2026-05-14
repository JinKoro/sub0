import { ReactNode } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';

interface Props {
  children: ReactNode;
  color?: string;
  bg?: string;
  dot?: boolean;
}

export function Pill({ children, color = SUB0.ink, bg = SUB0.soft, dot }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11,
        fontFamily: mono,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      )}
      {children}
    </span>
  );
}
