import { ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  title: string;
  sub?: string;
  right?: ReactNode;
  danger?: boolean;
}

export function SectionHead({ title, sub, right, danger }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0 0',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: danger ? SUB0.danger : SUB0.ink,
          }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>{sub}</div>
        )}
      </div>
      {right}
    </div>
  );
}
