'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Section } from '@/shared/components/ui/Section';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';

export function ForWhom() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const personalFeatures = [
    t('Импорт из банковских выписок или почты', 'Import from personal inbox'),
    t('Напоминания о списаниях', 'Trial-ending reminders'),
    t('Календарь списаний', 'One-click cancel via partners'),
  ];

  const businessFeatures = [
    t('Рабочие проекты с ролями', 'Workspaces with roles'),
    t('Аналитика и календарь списаний', 'Owner, payer, seats'),
    t('Отчёты и экспорт в бухгалтерию', 'Finance-ready reports'),
  ];

  return (
    <Section bg={SUB0.bg} pad={isMobile ? '64px 20px' : '120px 48px'}>
      <SectionEyebrow num="06">{t('Для кого', "Who it's for")}</SectionEyebrow>
      <H2 accent={t('и для бизнеса.', 'and one for business.')}>
        {t('Один Sub0 для себя —', 'One Sub0 for you —')}
      </H2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
          marginTop: 56,
        }}
      >
        {/* Personal */}
        <div
          style={{
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 14,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minHeight: 360,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: SUB0.ink,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              ◐
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: SUB0.muted,
                  fontFamily: mono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                ЛИЧНОЕ
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {t('Пользователь', 'You, at home')}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: '#444', margin: 0 }}>
            {t(
              'Контролируйте личные подписки — от стримингов до фитнеса. Следите, куда утекают 4000 ₽ в месяц.',
              'Track your personal subscriptions — streaming, music, fitness. Find out where that $41/mo goes.',
            )}
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {personalFeatures.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: SUB0.blue, fontWeight: 700, fontFamily: mono }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>0 ₽</span>
            <span style={{ color: SUB0.muted, fontFamily: mono, fontSize: 13 }}>
              {t('бесплатно навсегда', 'free forever')}
            </span>
          </div>
        </div>

        {/* Business */}
        <div
          style={{
            background: SUB0.ink,
            color: SUB0.bg,
            borderRadius: 14,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minHeight: 360,
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
              backgroundImage:
                'radial-gradient(circle at 100% 0%, rgba(19,71,255,.35), transparent 50%)',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: SUB0.blue,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              ◈
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: '#aaa',
                  fontFamily: mono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                БИЗНЕС
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {t('Команда или компания', 'Teams & businesses')}
              </div>
            </div>
          </div>
          <p
            style={{
              position: 'relative',
              fontSize: 15,
              lineHeight: 1.55,
              color: '#cfcfc6',
              margin: 0,
            }}
          >
            {t(
              'Контролируйте все корпоративные подписки в одном месте. Без таблиц в Excel и записей в блокноте.',
              'Sub0 surfaces your full SaaS stack: who pays, who has access, when to renew. No more Google Sheets.',
            )}
          </p>
          <ul
            style={{
              position: 'relative',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {businessFeatures.map((f) => (
              <li
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  color: '#e6e6df',
                }}
              >
                <span style={{ color: SUB0.blue, fontWeight: 700, fontFamily: mono }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div
            style={{
              position: 'relative',
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {t('Скоро', 'Soon')}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
