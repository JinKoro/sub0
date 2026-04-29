'use client';

import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function FinalCTA() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: SUB0.ink,
        color: SUB0.bg,
        padding: isMobile ? '80px 20px' : '140px 48px',
        borderTop: `1px solid ${SUB0.ink}`,
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
          backgroundImage: `linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
        }}
      />

      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #2a2a2a',
            background: '#141414',
            fontSize: 12,
            fontFamily: mono,
            color: SUB0.blue,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: SUB0.blue,
              display: 'inline-block',
            }}
          />
          {t('Начните за 2 минуты', 'Start in 2 minutes')}
        </div>

        <h2
          style={{
            fontSize: isMobile ? 40 : 72,
            fontWeight: 700,
            lineHeight: 1.03,
            letterSpacing: '-0.035em',
            margin: '0 0 20px',
          }}
        >
          {t('Начни контролировать подписки', 'Take control of your subscriptions')}
          <br />
          <span style={{ color: SUB0.blue }}>{t('уже сегодня.', 'today.')}</span>
        </h2>

        <p
          style={{
            fontSize: isMobile ? 16 : 18,
            color: '#bfbfb8',
            maxWidth: 620,
            margin: '0 auto 40px',
            lineHeight: 1.5,
          }}
        >
          {t(
            'Бесплатно, без карты, с живым парсером писем. Отменить подписку на Sub0 можно в два клика.',
            'Free, no card required, with a live inbox parser. You can cancel Sub0 itself in two clicks.',
          )}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            className="s-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: isMobile ? '15px 22px' : '18px 28px',
              background: SUB0.blue,
              color: '#fff',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: isMobile ? 15 : 17,
              textDecoration: 'none',
              flex: isMobile ? '1 1 auto' : 'unset',
              justifyContent: 'center',
            }}
          >
            {t('Начать бесплатно', 'Start free')} →
          </Link>
          <a
            href="#"
            className="s-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: isMobile ? '15px 20px' : '18px 24px',
              background: 'transparent',
              color: SUB0.bg,
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              fontWeight: 500,
              fontSize: isMobile ? 15 : 17,
              textDecoration: 'none',
              flex: isMobile ? '1 1 auto' : 'unset',
              justifyContent: 'center',
            }}
          >
            {t('Связаться с нами', 'Book a call')}
          </a>
        </div>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontFamily: mono,
            fontSize: 13,
            color: '#999',
          }}
        >
          <span>✓ {t('Бесплатно навсегда', 'Free forever')}</span>
          <span>✓ {t('Без карты', 'No card')}</span>
          <span>✓ {t('Удаление данных по запросу', 'Delete your data any time')}</span>
        </div>
      </div>
    </section>
  );
}
