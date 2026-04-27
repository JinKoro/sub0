import { ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  children: ReactNode;
  pad?: string;
  bg?: string;
  id?: string;
}

export function Section({ children, pad = '120px 48px', bg, id }: Props) {
  return (
    <section
      id={id}
      style={{
        background: bg || 'transparent',
        padding: pad,
        borderTop: `1px solid ${SUB0.line}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>{children}</div>
    </section>
  );
}
