'use client';

import { useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LangToggle } from '@/shared/components/ui/LangToggle';
import { SUB0, mono } from '@/shared/constants/tokens';

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="8" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  analytics: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 17V10M8 17V7M13 17V11M18 17V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  notifications: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 16.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  currency: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 8.5C7 7.12 8.34 6 10 6s3 1.12 3 2.5-1.34 2.5-3 2.5-3 1.12-3 2.5 1.34 2.5 3 2.5M10 4v1.5M10 14.5V16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  blog: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 4h14M3 8h10M3 12h14M3 16h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  faq: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 7.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="15" r=".8" fill="currentColor" />
    </svg>
  ),
  roadmap: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 4v12M4 4h4l2 2h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10h3l2 2h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  reviews: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5 5.1 17l.9-5.3-4-3.9 5.5-.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  sitemap: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="14" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.5" y="14" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6v4M3.5 14v-2.5a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5V14M10 10v4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

interface MenuItem {
  label: string;
  desc: string;
  href: string;
  icon?: ReactNode;
  soon?: boolean;
}

interface NavGroup {
  label: string;
  href?: string;
  feature?: { title: string; desc: string; soon?: boolean };
  items?: MenuItem[];
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
    }}
  >
    СКОРО
  </span>
);

export function Header() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nav: NavGroup[] = [
    {
      label: t('Продукт', 'Product'),
      feature: {
        title: t('Мобильное приложение', 'Mobile app'),
        desc: t(
          'Все подписки на ладони — скоро на iOS и Android',
          'All subscriptions in your pocket — coming to iOS & Android',
        ),
        soon: true,
      },
      items: [
        {
          label: t('Дашборд', 'Dashboard'),
          desc: t('Единый экран всех подписок и расходов', 'One screen for all subs and spending'),
          href: '#dashboard',
          icon: ICONS.dashboard,
        },
        {
          label: t('Аналитика', 'Analytics'),
          desc: t(
            'Графики, тренды и прогнозы по расходам',
            'Charts, trends and spending forecasts',
          ),
          href: '#',
          icon: ICONS.analytics,
        },
        {
          label: t('Уведомления', 'Notifications'),
          desc: t('Напоминания о списаниях и продлениях', 'Alerts for charges and renewals'),
          href: '#',
          icon: ICONS.notifications,
        },
      ],
    },
    {
      label: t('Инструменты', 'Tools'),
      feature: {
        title: t('Калькулятор подписок', 'Calculator'),
        desc: t(
          'Рассчитайте итоговую сумму за месяц и год',
          'Calculate your monthly and yearly totals',
        ),
        soon: true,
      },
      items: [
        {
          label: t('Конвертер валют', 'Currency converter'),
          desc: t('Мгновенный пересчёт в вашу валюту', 'Instant conversion to your currency'),
          href: '#',
          icon: ICONS.currency,
          soon: true,
        },
      ],
    },
    {
      label: t('Ресурсы', 'Resources'),
      feature: {
        title: t('Портал идей', 'Ideas portal'),
        desc: t(
          'Поделитесь идеями — голосуйте за фичи, которые ждёте',
          'Share ideas — vote for features you want',
        ),
        soon: true,
      },
      items: [
        {
          label: t('Блог', 'Blog'),
          desc: t('Разборы, советы и новости продукта', 'Guides, tips and product news'),
          href: '#',
          icon: ICONS.blog,
          soon: true,
        },
        {
          label: 'FAQ',
          desc: t('Ответы на частые вопросы', 'Answers to common questions'),
          href: '#faq',
          icon: ICONS.faq,
        },
        {
          label: 'Roadmap',
          desc: t(
            'Планы по развитию и ближайшие улучшения',
            'Development plans and upcoming improvements',
          ),
          href: '#',
          icon: ICONS.roadmap,
          soon: true,
        },
        {
          label: t('Отзывы', 'Reviews'),
          desc: t('Что говорят пользователи о Sub0', 'What users say about Sub0'),
          href: '#',
          icon: ICONS.reviews,
        },
        {
          label: t('Карта сайта', 'Sitemap'),
          desc: t('Навигация по всем страницам', 'Navigate all pages'),
          href: '#',
          icon: ICONS.sitemap,
          soon: true,
        },
      ],
    },
    { label: t('Тарифы', 'Pricing'), href: '/pricing' },
  ];

  const handleEnter = (key: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  if (isMobile) {
    return (
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${SUB0.line}`,
          background: 'rgba(250,250,247,.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <a
          href="#top"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: SUB0.ink,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 6,
              background: SUB0.ink,
              color: SUB0.bg,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            ▚
          </span>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>Sub0</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LangToggle />
          <Link
            href="/login"
            className="s-a"
            style={{
              color: SUB0.ink,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              opacity: 0.75,
            }}
          >
            {t('Войти', 'Log in')}
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('меню', 'menu')}
            style={{
              background: 'none',
              border: `1px solid ${SUB0.line}`,
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 3l12 12M15 3L3 15"
                  stroke={SUB0.ink}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 4h14M2 9h14M2 14h14"
                  stroke={SUB0.ink}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: SUB0.bg,
              boxShadow: '0 12px 40px rgba(0,0,0,.10)',
              padding: '12px 20px 32px',
              zIndex: 49,
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {nav.map((n, ni) => (
              <div key={ni} style={{ marginBottom: 4 }}>
                <div
                  style={{
                    padding: '14px 0 4px',
                    fontSize: 17,
                    fontWeight: 700,
                    color: SUB0.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {n.label} →
                    </Link>
                  ) : (
                    n.label
                  )}
                </div>
                {n.items &&
                  n.items.map((item, ii) => (
                    <a
                      key={ii}
                      href={item.href || '#'}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 0 7px 12px',
                        fontSize: 14,
                        fontWeight: 400,
                        color: SUB0.muted,
                        textDecoration: 'none',
                        opacity: item.soon ? 0.45 : 1,
                      }}
                    >
                      {item.label}
                      {item.soon && <SoonBadge />}
                    </a>
                  ))}
              </div>
            ))}
          </div>
        )}
      </header>
    );
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 48px',
        borderBottom: `1px solid ${SUB0.line}`,
        background: 'rgba(250,250,247,.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        gap: 32,
      }}
    >
      <a
        href="#top"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: SUB0.ink,
        }}
      >
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
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>Sub0</span>
      </a>

      <nav style={{ display: 'flex', gap: 28, flex: 1, justifyContent: 'center' }}>
        {nav.map((n, ni) =>
          n.items ? (
            <div
              key={ni}
              style={{ position: 'static' }}
              onMouseEnter={() => handleEnter(ni)}
              onMouseLeave={handleLeave}
            >
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: SUB0.ink,
                  fontSize: 15,
                  fontWeight: 500,
                  opacity: openMenu === ni ? 1 : 0.75,
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  letterSpacing: 'inherit',
                  transition: 'opacity .15s',
                }}
              >
                {n.label}
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  style={{
                    opacity: 0.5,
                    transform: openMenu === ni ? 'rotate(180deg)' : 'none',
                    transition: 'transform .2s',
                  }}
                >
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              key={ni}
              href={n.href ?? '#'}
              className="s-a"
              style={{
                color: SUB0.ink,
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 500,
                opacity: 0.75,
              }}
            >
              {n.label}
            </Link>
          ),
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LangToggle />
        <Link
          href="/login"
          className="s-a"
          style={{
            color: SUB0.ink,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            opacity: 0.75,
          }}
        >
          {t('Войти', 'Log in')}
        </Link>
        <Link
          href="/registration"
          className="s-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: SUB0.ink,
            color: SUB0.bg,
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          {t('Регистрация', 'Sign up')} →
        </Link>
      </div>

      {openMenu !== null && nav[openMenu]?.items && (
        <div
          onMouseEnter={() => handleEnter(openMenu)}
          onMouseLeave={handleLeave}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: SUB0.bg,
            borderBottom: `1px solid ${SUB0.line}`,
            boxShadow: '0 12px 40px rgba(0,0,0,.08)',
            animation: 'mega-drop-in .18s ease-out',
            zIndex: 49,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              padding: '24px 32px',
              display: 'flex',
              gap: 0,
              height: 240,
            }}
          >
            {nav[openMenu].feature && (
              <div
                style={{
                  width: 220,
                  flexShrink: 0,
                  padding: '20px 24px',
                  background: nav[openMenu].feature!.soon ? 'transparent' : SUB0.panel,
                  border: nav[openMenu].feature!.soon ? `1px dashed ${SUB0.line}` : 'none',
                  borderRadius: 12,
                  marginRight: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignSelf: 'stretch',
                  opacity: nav[openMenu].feature!.soon ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {nav[openMenu].feature!.title}
                  </span>
                  {nav[openMenu].feature!.soon && <SoonBadge />}
                </div>
                <div style={{ fontSize: 13, color: SUB0.muted, lineHeight: 1.5 }}>
                  {nav[openMenu].feature!.desc}
                </div>
              </div>
            )}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: nav[openMenu].items!.length > 3 ? '1fr 1fr' : '1fr',
                gap: 0,
              }}
            >
              {nav[openMenu].items!.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="s-a"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    textDecoration: 'none',
                    borderRadius: 8,
                    color: SUB0.ink,
                    opacity: item.soon ? 0.55 : 1,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = SUB0.panel)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: SUB0.muted, flexShrink: 0, marginTop: 1 }}>
                    {item.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                      {item.soon && <SoonBadge />}
                    </div>
                    <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2, lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
