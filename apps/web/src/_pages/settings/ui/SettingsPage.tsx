'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';

interface Anchor {
  id: 'account' | 'billing' | 'notifications';
  ru: string;
  en: string;
  ruSub: string;
  enSub: string;
}

const ANCHORS: Anchor[] = [
  {
    id: 'account',
    ru: 'Настройки аккаунта',
    en: 'Account settings',
    ruSub: 'Профиль, валюта, таймзона, язык — придёт в следующей задаче.',
    enSub: 'Profile, currency, timezone, language — coming in the next task.',
  },
  {
    id: 'billing',
    ru: 'Тарифы и оплата',
    en: 'Plans & billing',
    ruSub: 'Подписка Sub0, история счетов и способы оплаты.',
    enSub: 'Sub0 plan, invoice history and payment methods.',
  },
  {
    id: 'notifications',
    ru: 'Уведомления',
    en: 'Notifications',
    ruSub: 'Правила email-напоминаний о списаниях и продлениях.',
    enSub: 'Email reminder rules for charges and renewals.',
  },
];

export function SettingsPage() {
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
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: mono,
            color: SUB0.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          {t('Личный кабинет', 'Cabinet')}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          {t('Настройки', 'Settings')}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ANCHORS.map((a) => (
          <Card key={a.id} padding={24}>
            <section id={a.id}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: mono,
                  color: SUB0.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                #{a.id}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 8,
                }}
              >
                {t(a.ru, a.en)}
              </div>
              <div style={{ fontSize: 14, color: SUB0.muted, maxWidth: 600 }}>
                {t(a.ruSub, a.enSub)}
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: '20px 24px',
                  border: `1px dashed ${SUB0.line}`,
                  borderRadius: 10,
                  background: SUB0.bg,
                  fontSize: 13,
                  fontFamily: mono,
                  color: SUB0.muted,
                  textAlign: 'center',
                }}
              >
                {t('Содержимое раздела — в следующей задаче.', 'Section content — coming next task.')}
              </div>
            </section>
          </Card>
        ))}
      </div>
    </div>
  );
}
