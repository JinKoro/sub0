'use client';

import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Section } from '@/shared/components/ui/Section';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';

const CHANNELS = [
  {
    icon: '✉',
    ru: 'На почту',
    en: 'Email',
    subRu: 'Получайте важные уведомления прямо в почтовый ящик',
    subEn: 'Get critical notifications delivered straight to your inbox',
  },
  {
    icon: '✈',
    ru: 'В Telegram и MAX',
    en: 'Telegram & MAX',
    subRu: 'Мгновенные оповещения в мессенджеры, чтобы не пропустить ни одного списания',
    subEn: 'Instant messenger alerts so you never miss a subscription charge',
  },
  {
    icon: '⚡',
    ru: 'Вебхуки',
    en: 'Webhooks',
    subRu: 'Отправляйте события в свои системы и автоматизируйте реакцию на списания',
    subEn: 'Send events to your own systems and automate responses to charges',
  },
];

const ICON_BG = [SUB0.ink, SUB0.blue, '#0a7a3f'];

export function Notifications() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <Section bg={SUB0.bg} pad={isMobile ? '64px 20px' : '120px 48px'}>
      <SectionEyebrow num="11">{t('Уведомления', 'Notifications')}</SectionEyebrow>
      <H2>
        {t('Надёжные ', 'Reliable ')}
        <span style={{ color: SUB0.blue }}>{t('оповещения.', 'alerts.')}</span>
      </H2>
      <p
        style={{
          fontSize: 17,
          color: SUB0.muted,
          maxWidth: 520,
          lineHeight: 1.6,
          margin: '16px 0 56px',
        }}
      >
        {t(
          'Уведомления помогут вовремя среагировать на любое списание.',
          'Notifications help you react to any charge in time.',
        )}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {CHANNELS.map((c, i) => (
          <div
            key={i}
            style={{
              background: SUB0.panel,
              border: `1px solid ${SUB0.line}`,
              borderRadius: 14,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                height: 48,
                width: 48,
                borderRadius: 12,
                background: ICON_BG[i],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff',
              }}
            >
              {c.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 10,
                }}
              >
                {t(c.ru, c.en)}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: '#555' }}>
                {t(c.subRu, c.subEn)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
