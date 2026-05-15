'use client';

import { CSSProperties } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';

interface Props {
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'password' | 'email';
  mono?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function Input({ value, onChange, type = 'text', mono: useMono, placeholder, disabled }: Props) {
  const style: CSSProperties = {
    flex: 1,
    minWidth: 200,
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: disabled ? SUB0.soft : SUB0.panel,
    fontSize: 14,
    fontFamily: useMono ? mono : 'inherit',
    color: disabled ? SUB0.muted : SUB0.ink,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
  };
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    />
  );
}
