'use client';

import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function PricingHero() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <section
      id="top"
      style={{
        background: SUB0.bg,
        padding: isMobile ? '24px 20px 0' : '40px 48px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(${SUB0.line} 1px,transparent 1px),linear-gradient(90deg,${SUB0.line} 1px,transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)',
          opacity: 0.5,
        }}
      />
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: mono,
            fontSize: 12,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: SUB0.muted,
            paddingBottom: isMobile ? 24 : 36,
          }}
        >
          <Link
            href="/"
            className="s-a"
            style={{ color: SUB0.muted, textDecoration: 'none' }}
          >
            {t('Главная', 'Home')}
          </Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: SUB0.ink, fontWeight: 600 }}>{t('Тарифы', 'Pricing')}</span>
        </nav>

        <div style={{ paddingBottom: isMobile ? 20 : 32 }}>
          <h1
            style={{
              fontSize: isMobile ? 40 : 64,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              margin: '0 0 20px',
              color: SUB0.ink,
              maxWidth: 820,
            }}
          >
            {t('Тарифы', 'Plans')}
          </h1>
          <p
            style={{
              fontSize: isMobile ? 16 : 19,
              lineHeight: 1.55,
              color: '#444',
              maxWidth: 600,
              margin: 0,
            }}
          >
            {t(
              'Выберите подходящий тариф для управления своими подписками.',
              'Choose the right plan to manage your subscriptions.',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
