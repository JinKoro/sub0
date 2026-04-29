'use client';

import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface Doc {
  id: string;
  ru: string;
  en: string;
  desc_ru: string;
  desc_en: string;
  size: string;
}

const DOCS: Doc[] = [
  {
    id: 'offer',
    ru: 'Публичная оферта',
    en: 'Public offer',
    desc_ru: 'Договор-оферта на использование сайта sub0.ru и сервиса.',
    desc_en: 'Public offer agreement for the use of sub0.ru and the service.',
    size: 'PDF · 184 KB',
  },
  {
    id: 'privacy',
    ru: 'Политика обработки и защиты персональных данных',
    en: 'Personal data processing and protection policy',
    desc_ru: 'Принципы и условия обработки персональных данных пользователей.',
    desc_en: "Principles and terms of processing users' personal data.",
    size: 'PDF · 142 KB',
  },
  {
    id: 'cookies',
    ru: 'Политика обработки файлов cookie',
    en: 'Cookie processing policy',
    desc_ru: 'Состав, цели и сроки хранения файлов cookie на сайте.',
    desc_en: 'Composition, purposes and retention periods of cookies on the website.',
    size: 'PDF · 96 KB',
  },
];

function DocIconLg() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.5 2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5L11.5 2Z" />
      <path d="M11.5 2V6.5H16" />
      <path d="M7 10.5h6" />
      <path d="M7 13.5h6" />
      <path d="M7 7.5h2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.5v8" />
      <path d="M4.5 7.5 8 11l3.5-3.5" />
      <path d="M3 13h10" />
    </svg>
  );
}

export function LegalDocs() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: SUB0.panel,
        borderTop: `1px solid ${SUB0.line}`,
        padding: isMobile ? '40px 20px 80px' : '72px 48px 140px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 11,
            color: SUB0.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: isMobile ? 20 : 28,
          }}
        >
          <span style={{ width: 24, height: 1, background: SUB0.line }} />
          {t('Документы', 'Documents')}
        </div>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            background: SUB0.bg,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {DOCS.map((d, i) => (
            <li
              key={d.id}
              style={{
                borderTop: i === 0 ? 'none' : `1px solid ${SUB0.line}`,
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 14 : 24,
                padding: isMobile ? '24px 22px' : '28px 36px',
                color: SUB0.ink,
                cursor: 'default',
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: SUB0.muted,
                  letterSpacing: '0.08em',
                  minWidth: isMobile ? 'auto' : 36,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: SUB0.panel,
                  border: `1px solid ${SUB0.line}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: SUB0.ink,
                }}
              >
                <DocIconLg />
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: isMobile ? 17 : 19,
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.3,
                    color: SUB0.ink,
                    marginBottom: 6,
                  }}
                >
                  {t(d.ru, d.en)}
                </div>
                <div style={{ fontSize: 14, color: SUB0.muted, lineHeight: 1.5 }}>
                  {t(d.desc_ru, d.desc_en)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 12 : 20,
                  flexShrink: 0,
                  marginLeft: isMobile ? 0 : 'auto',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'space-between' : 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 12,
                    color: SUB0.muted,
                    letterSpacing: '0.04em',
                  }}
                >
                  {d.size}
                </span>
                <span
                  aria-label={t('Скоро', 'Soon')}
                  title={t('Скоро будет доступно для скачивания', 'Will be available soon')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: SUB0.panel,
                    border: `1px solid ${SUB0.line}`,
                    color: SUB0.muted,
                    flexShrink: 0,
                    opacity: 0.6,
                  }}
                >
                  <DownloadIcon />
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p
          style={{
            marginTop: isMobile ? 28 : 40,
            fontSize: 13,
            color: SUB0.muted,
            lineHeight: 1.6,
            maxWidth: 760,
            fontFamily: mono,
            letterSpacing: '0.01em',
          }}
        >
          {t(
            'Документы скоро будут доступны для скачивания в формате PDF. По любым вопросам — ',
            'Documents will soon be available for download in PDF format. For any questions — ',
          )}
          <span style={{ whiteSpace: 'nowrap' }}>
            <Link
              href="/contacts"
              className="s-a"
              style={{ color: SUB0.blue, textDecoration: 'none' }}
            >
              {t('свяжитесь с нами', 'get in touch')}
            </Link>
            .
          </span>
        </p>
      </div>
    </section>
  );
}
