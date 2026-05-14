import { ReactNode } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';

interface Props {
  title: string;
  sub?: string;
  right?: ReactNode;
}

export function CardHeader({ title, sub, right }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: SUB0.ink }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {right}
    </div>
  );
}
