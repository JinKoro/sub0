'use client';

import { ReactNode } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

const SUPPORT_EMAIL = 'support@sub0.app';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        paddingBottom: 12,
        borderBottom: `1px dashed ${SUB0.line}`,
      }}
    >
      <dt
        style={{
          fontFamily: mono,
          fontSize: 12,
          color: SUB0.muted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          minWidth: 80,
          flexShrink: 0,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: mono,
          fontSize: 15,
          color: SUB0.ink,
          fontWeight: 500,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5Z" />
      <path d="M9 1.5V5.5H13" />
      <path d="M5.5 8.5h5" />
      <path d="M5.5 11h5" />
    </svg>
  );
}

function Eyebrow({
  text,
  gridColumn,
  gridRow,
  marginTop,
}: {
  text: string;
  gridColumn: string;
  gridRow: string;
  marginTop?: number;
}) {
  return (
    <div
      style={{
        gridColumn,
        gridRow,
        fontFamily: mono,
        fontSize: 11,
        color: SUB0.muted,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop,
      }}
    >
      <span style={{ width: 24, height: 1, background: SUB0.line }} />
      {text}
    </div>
  );
}

export function ContactsBody() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const leadParts: [string, ReactNode, string] = [
    t(
      'Опишите вопрос как можно подробнее — приложите скриншоты, если нужно. Это поможет ответить быстрее и точнее. Пишите на ',
      'Describe your question in as much detail as possible — attach screenshots if needed. It helps us answer faster and more accurately. Email us at ',
    ),
    <a
      key="mail"
      href={`mailto:${SUPPORT_EMAIL}`}
      className="s-a"
      style={{
        color: SUB0.blue,
        textDecoration: 'none',
        fontWeight: 500,
        fontFamily: mono,
      }}
    >
      {SUPPORT_EMAIL}
    </a>,
    t(' — отвечаем в рабочий день.', ' — we reply within a business day.'),
  ];

  return (
    <section
      style={{
        background: SUB0.panel,
        borderTop: `1px solid ${SUB0.line}`,
        padding: isMobile ? '40px 20px 80px' : '72px 48px 140px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
          gridTemplateRows: 'auto 1fr',
          columnGap: isMobile ? 32 : 64,
          rowGap: isMobile ? 16 : 20,
          alignItems: 'start',
        }}
      >
        <Eyebrow
          text={t('Реквизиты', 'Legal entity')}
          gridColumn="1"
          gridRow="1"
        />

        <Eyebrow
          text={t('Связаться с нами', 'Get in touch')}
          gridColumn={isMobile ? '1' : '2'}
          gridRow={isMobile ? '3' : '1'}
          marginTop={isMobile ? 16 : 0}
        />

        <div
          style={{
            gridColumn: '1',
            gridRow: '2',
            background: SUB0.bg,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 16,
            padding: isMobile ? '28px 24px' : '36px 40px',
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              color: SUB0.ink,
              marginBottom: 24,
            }}
          >
            {t(
              'ИП Бровченко Татьяна Владимировна',
              'IE Brovchenko Tatiana Vladimirovna',
            )}
          </div>

          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label={t('ИНН', 'INN')} value="470323695437" />
            <Row label={t('ОГРНИП', 'OGRNIP')} value="325470400004784" />
          </dl>

          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: `1px solid ${SUB0.line}`,
            }}
          >
            <a
              href="#"
              className="s-a"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                color: SUB0.ink,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: SUB0.panel,
                  border: `1px solid ${SUB0.line}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DocIcon />
              </span>
              <span>{t('Правовые документы', 'Legal documents')}</span>
              <span style={{ color: SUB0.muted, fontFamily: mono, fontSize: 13 }}>→</span>
            </a>
          </div>
        </div>

        <div
          style={{
            gridColumn: isMobile ? '1' : '2',
            gridRow: isMobile ? '4' : '2',
            paddingTop: isMobile ? 0 : 4,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 22 : 28,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              color: SUB0.ink,
              marginBottom: 16,
            }}
          >
            {t('Напишите нам.', 'Get in touch.')}
          </div>

          <p
            style={{
              fontSize: isMobile ? 15 : 17,
              color: '#444',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 480,
            }}
          >
            {leadParts[0]}
            {leadParts[1]}
            {leadParts[2]}
          </p>
        </div>
      </div>
    </section>
  );
}
