'use client';

import { ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface Props {
  label: string;
  hint?: string;
  children: ReactNode;
  last?: boolean;
}

export function Row({ label, hint, children, last }: Props) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '200px 1fr',
        gap: isMobile ? 8 : 18,
        padding: isMobile ? '14px 16px' : '16px 24px',
        borderBottom: last ? 'none' : `1px solid ${SUB0.line2}`,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ paddingTop: isMobile ? 0 : 9 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: SUB0.ink }}>{label}</div>
        {hint && (
          <div
            style={{
              fontSize: 11,
              color: SUB0.muted,
              marginTop: 3,
              lineHeight: 1.45,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
