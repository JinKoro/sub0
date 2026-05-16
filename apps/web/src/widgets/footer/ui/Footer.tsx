'use client';

import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface Col {
  title: string;
  items: Array<[string, string]>;
  soon?: boolean;
  soonItems?: number[];
}

const SoonBadge = () => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 700,
      fontFamily: mono,
      letterSpacing: '0.06em',
      color: '#fff',
      background: SUB0.blue,
      borderRadius: 4,
      padding: '2px 5px',
      marginLeft: 4,
      whiteSpace: 'nowrap',
    }}
  >
    СКОРО
  </span>
);

export function Footer() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const cols: Col[] = [
    {
      title: t('Продукт', 'Product'),
      items: [
        [t('Дашборд', 'Dashboard'), '#dashboard'],
        [t('Аналитика', 'Analytics'), '#'],
        [t('Уведомления', 'Notifications'), '#'],
        [t('Мобильное приложение', 'Mobile app'), '#'],
      ],
      soonItems: [3],
    },
    {
      title: t('Инструменты', 'Tools'),
      items: [
        [t('Калькулятор подписок', 'Calculator'), '#'],
        [t('Конвертер валют', 'Currency converter'), '#'],
      ],
      soon: true,
    },
    {
      title: t('Ресурсы', 'Resources'),
      items: [
        [t('Блог', 'Blog'), '#'],
        ['FAQ', '/faq'],
        ['Roadmap', '#'],
        [t('Отзывы', 'Reviews'), '/reviews'],
        [t('Карта сайта', 'Sitemap'), '#'],
      ],
      soonItems: [0, 2, 4],
    },
    {
      title: t('Компания', 'Company'),
      items: [
        [t('О проекте', 'About'), '#'],
        [t('Контакты', 'Contact'), '/contacts'],
        [t('Правовые документы', 'Legal'), '/legal'],
      ],
    },
  ];

  return (
    <footer
      style={{
        background: SUB0.bg,
        color: SUB0.ink,
        padding: isMobile ? '56px 20px 32px' : '80px 48px 40px',
        borderTop: `1px solid ${SUB0.line}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.4fr repeat(4, 1fr)',
            gap: isMobile ? 24 : 32,
            marginBottom: 56,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: SUB0.ink,
                  color: SUB0.bg,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ▚
              </span>
              <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>Sub0</span>
            </div>
            <p style={{ fontSize: 14, color: SUB0.muted, lineHeight: 1.5, maxWidth: 260 }}>
              {t(
                'Контроль над подписками — личными и рабочими. Один список, ноль сюрпризов.',
                'Control over your subscriptions — personal and at work. One list, no surprises.',
              )}
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: SUB0.muted,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                {c.title}
              </div>
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
                {c.items.map(([label, href], idx) => {
                  const soon = c.soon || (c.soonItems && c.soonItems.includes(idx));
                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        className="s-a"
                        style={{
                          color: SUB0.ink,
                          textDecoration: 'none',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          opacity: soon ? 0.6 : 1,
                        }}
                      >
                        {label}
                        {soon && <SoonBadge />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: `1px solid ${SUB0.line}`,
            fontSize: 13,
            color: SUB0.muted,
            fontFamily: mono,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>© 2026 Sub0 · {t('все подписки под контролем', 'all subs, zero surprises')}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a
              href="mailto:support@sub0.app"
              className="s-a"
              style={{ color: SUB0.muted, textDecoration: 'none' }}
            >
              {t('Почта', 'Email')} · support@sub0.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
