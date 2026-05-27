'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  href: string;
  children: ReactNode;
  /** При true — рендерим <button disabled> вместо ссылки. Используется,
   *  например, для лимита Free тарифа на «+ Новая подписка». */
  disabled?: boolean;
  /** Подсказка-tooltip (нативная). Имеет смысл вместе с disabled. */
  title?: string;
}

export function CabinetCtaButton({ href, children, disabled, title }: Props) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box' as const,
    height: 36,
    padding: '0 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600 as const,
    lineHeight: 1,
    textDecoration: 'none',
    fontFamily: 'inherit',
    border: 'none',
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={title}
        style={{
          ...baseStyle,
          background: SUB0.soft,
          color: SUB0.muted,
          cursor: 'not-allowed',
          opacity: 0.7,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="s-btn"
      style={{
        ...baseStyle,
        background: SUB0.ink,
        color: SUB0.bg,
        cursor: 'pointer',
      }}
    >
      {children}
    </Link>
  );
}
