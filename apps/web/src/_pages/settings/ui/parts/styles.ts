import type { CSSProperties } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

export const sBtnPrimary: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: SUB0.ink,
  color: SUB0.bg,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export const sBtnSecondary: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${SUB0.line}`,
  background: SUB0.panel,
  color: SUB0.ink,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export const sBtnGhost: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: SUB0.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export const sBtnDanger: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #f3d6c2',
  background: SUB0.panel,
  color: SUB0.danger,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
