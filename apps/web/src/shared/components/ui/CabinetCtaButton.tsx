'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { SUB0 } from '@/shared/constants/tokens';

interface Props {
  href: string;
  children: ReactNode;
}

export function CabinetCtaButton({ href, children }: Props) {
  return (
    <Link
      href={href}
      className="s-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        height: 36,
        padding: '0 14px',
        borderRadius: 8,
        background: SUB0.ink,
        color: SUB0.bg,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        textDecoration: 'none',
        fontFamily: 'inherit',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </Link>
  );
}
