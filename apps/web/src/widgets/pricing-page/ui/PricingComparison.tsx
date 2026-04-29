'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';
import { fmtRub } from '@/shared/lib/format';

type CellValue = boolean | string;
type Row = [string, CellValue, CellValue, CellValue];
interface Group {
  title: string;
  rows: Row[];
}

interface Props {
  billing: 'month' | 'year';
}

function Cell({ v }: { v: CellValue }) {
  if (v === true)
    return (
      <span
        aria-label="yes"
        style={{
          display: 'inline-flex',
          width: 22,
          height: 22,
          borderRadius: 999,
          background: '#e9f0ff',
          color: SUB0.blue,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        ✓
      </span>
    );
  if (v === false)
    return (
      <span
        aria-label="no"
        style={{
          display: 'inline-flex',
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'transparent',
          color: '#bcbcb4',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          border: `1px dashed ${SUB0.line}`,
        }}
      >
        —
      </span>
    );
  return <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{v}</span>;
}

export function PricingComparison({ billing }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const yearly = billing === 'year';

  const groups: Group[] = [
    {
      title: t('Подписки и проекты', 'Subscriptions & projects'),
      rows: [
        [t('Количество подписок', 'Subscription limit'), '5', t('Безлимит', 'Unlimited'), t('Безлимит', 'Unlimited')],
        [t('Совместный доступ к подпискам', 'Shared access to subscriptions'), false, false, true],
        [t('Количество проектов', 'Projects'), '1', '2', t('Безлимит', 'Unlimited')],
        [t('Архив отменённых подписок', 'Cancelled subs archive'), true, true, true],
        [t('Кастомные категории и теги', 'Custom categories & tags'), false, true, true],
      ],
    },
    {
      title: t('Импорт и AI', 'Import & AI'),
      rows: [
        [t('Ручной ввод', 'Manual entry'), true, true, true],
        [t('AI-импорт писем и выписок', 'AI import (emails & statements)'), false, t('5 раз / мес', '5 / month'), t('15 раз / мес', '15 / month')],
        [t('Распознавание чеков', 'Receipt OCR'), false, t('5 раз / мес', '5 / month'), t('15 раз / мес', '15 / month')],
      ],
    },
    {
      title: t('Уведомления', 'Notifications'),
      rows: [
        ['Email', true, true, true],
        ['Telegram', false, true, true],
        ['MAX', false, true, true],
        [t('Push в браузере и приложении', 'Browser & app push'), false, true, true],
        [t('Вебхуки', 'Webhooks'), false, false, true],
        [t('Гибкие правила за N дней', 'Custom rules — N days before'), false, true, true],
      ],
    },
    {
      title: t('Аналитика и отчёты', 'Analytics & reports'),
      rows: [
        [t('График трат', 'Spend chart'), t('Базовый набор', 'Basic set'), t('Полный набор', 'Full set'), t('Полный набор', 'Full set')],
        [t('Прогноз на год', 'Yearly forecast'), false, true, true],
        [t('Разбивка по категориям и проектам', 'By category & project'), false, true, true],
        [t('Сравнение периодов', 'Period comparison'), false, true, true],
        [t('Экспорт в CSV', 'CSV export'), false, true, true],
        [t('Документы для бухгалтерии', 'Accounting documents'), false, false, true],
      ],
    },
    {
      title: t('Команда и доступ', 'Team & access'),
      rows: [
        [t('Количество участников', 'Members'), '1', '1', t('Безлимит', 'Unlimited')],
        [t('Роли и права', 'Roles & permissions'), false, false, true],
        [t('Журнал действий', 'Activity log'), false, false, true],
        [t('SSO для компаний', 'SSO for companies'), false, false, t('По запросу', 'On request')],
      ],
    },
    {
      title: t('Поддержка и оплата', 'Support & billing'),
      rows: [
        [t('Помощь по почте', 'Email support'), true, true, true],
        [t('Приоритетная поддержка', 'Priority support'), false, false, true],
        [t('Оплата СБП и картой', 'SBP & card'), true, true, true],
        [t('Годовая оплата со скидкой 30%', '30% off when billed yearly'), false, true, true],
        [t('Договор для юрлиц', 'Contract for businesses'), false, false, true],
      ],
    },
  ];

  if (isMobile) {
    return (
      <section
        style={{
          background: SUB0.panel,
          padding: '56px 20px',
          borderTop: `1px solid ${SUB0.line}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionEyebrow num="01">{t('Сравнение', 'Compare')}</SectionEyebrow>
          <H2>
            {t('Что входит в каждый ', "What's in each ")}
            <span style={{ color: SUB0.blue }}>{t('тариф.', 'plan.')}</span>
          </H2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              marginTop: 36,
            }}
          >
            {groups.map((g, gi) => (
              <div
                key={gi}
                style={{
                  background: SUB0.bg,
                  border: `1px solid ${SUB0.line}`,
                  borderRadius: 12,
                  padding: '20px 18px',
                }}
              >
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: SUB0.blue,
                    marginBottom: 14,
                  }}
                >
                  {g.title}
                </div>
                {g.rows.map((row, ri) => (
                  <div
                    key={ri}
                    style={{
                      padding: '12px 0',
                      borderTop: ri === 0 ? 'none' : `1px dashed ${SUB0.line}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{row[0]}</div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8,
                      }}
                    >
                      {(['Free', 'Pro', 'Team'] as const).map((label, ci) => (
                        <div
                          key={label}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 4,
                            padding: '6px 8px',
                            border: `1px solid ${SUB0.line}`,
                            borderRadius: 8,
                            background: ci === 1 ? '#f5f8ff' : 'transparent',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: mono,
                              fontSize: 10,
                              color: SUB0.muted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {label}
                          </div>
                          <Cell v={row[ci + 1] as CellValue} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const proPrice = yearly
    ? `${fmtRub(Math.round(2490 / 12), { short: true })} / мес`
    : '290 ₽ / мес';

  const cols = [
    { name: 'Free', price: '0 ₽', featured: false, soon: false },
    { name: 'Pro', price: proPrice, featured: true, soon: false },
    { name: 'Team', price: '', featured: false, soon: true },
  ];

  return (
    <section
      style={{
        background: SUB0.panel,
        padding: '96px 48px',
        borderTop: `1px solid ${SUB0.line}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <div>
            <SectionEyebrow num="01">{t('Сравнение', 'Compare')}</SectionEyebrow>
            <H2>
              {t('Что входит в каждый ', "What's in each ")}
              <span style={{ color: SUB0.blue }}>{t('тариф.', 'plan.')}</span>
            </H2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.4fr) repeat(3, 1fr)',
            position: 'sticky',
            top: 72,
            zIndex: 5,
            background: SUB0.panel,
            borderTop: `1px solid ${SUB0.ink}`,
            borderBottom: `1px solid ${SUB0.line}`,
          }}
        >
          <div
            style={{
              padding: '18px 16px',
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SUB0.muted,
            }}
          >
            {t('Возможности', 'Features')}
          </div>
          {cols.map((c) => (
            <div
              key={c.name}
              style={{
                padding: '18px 16px',
                borderLeft: `1px solid ${SUB0.line}`,
                background: c.featured ? '#f5f8ff' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {c.name}
                {c.featured && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: SUB0.blue,
                      color: '#fff',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('Популярный', 'Popular')}
                  </span>
                )}
                {c.soon && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: SUB0.soft,
                      color: SUB0.blue,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('Скоро', 'Soon')}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, color: SUB0.muted }}>{c.price}</div>
            </div>
          ))}
        </div>

        {groups.map((g, gi) => (
          <div key={gi}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1.4fr) repeat(3, 1fr)',
                borderBottom: `1px solid ${SUB0.line}`,
                background: SUB0.bg,
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: SUB0.blue,
                  fontWeight: 700,
                }}
              >
                {String(gi + 1).padStart(2, '0')} · {g.title}
              </div>
              <div style={{ borderLeft: `1px solid ${SUB0.line}` }} />
              <div style={{ borderLeft: `1px solid ${SUB0.line}`, background: '#f5f8ff' }} />
              <div style={{ borderLeft: `1px solid ${SUB0.line}` }} />
            </div>
            {g.rows.map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 1.4fr) repeat(3, 1fr)',
                  borderBottom: `1px solid ${SUB0.line}`,
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fbfaf6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ padding: '16px', fontSize: 14, color: SUB0.ink }}>{row[0]}</div>
                {[1, 2, 3].map((ci) => (
                  <div
                    key={ci}
                    style={{
                      padding: '16px',
                      borderLeft: `1px solid ${SUB0.line}`,
                      background: ci === 2 ? '#f5f8ff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Cell v={row[ci] as CellValue} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
