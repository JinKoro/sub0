import { CSSProperties, ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, padding = 20, style, className }: Props) {
  return (
    <div
      className={className}
      style={{
        background: SUB0.panel,
        border: `1px solid ${SUB0.line}`,
        borderRadius: 12,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
