'use client';

import { ReactNode } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface Props {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}

export function PageShell({ title, eyebrow, onClose, children }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        padding: isMobile ? '20px 16px' : '32px 28px',
        maxWidth: 1320,
        margin: '0 auto',
      }}
    >
      <nav
        aria-label="breadcrumbs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          fontSize: 12,
          fontFamily: mono,
          color: SUB0.muted,
          marginBottom: 14,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: SUB0.muted,
            textTransform: 'inherit',
            letterSpacing: 'inherit',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = SUB0.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = SUB0.muted)}
        >
          {t('Подписки', 'Subscriptions')}
        </button>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: SUB0.ink, fontWeight: 600 }}>{eyebrow}</span>
      </nav>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
