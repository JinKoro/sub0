'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LangToggle } from '@/shared/components/ui/LangToggle';
import { SUB0, mono } from '@/shared/constants/tokens';
import { HeaderLogo } from './HeaderLogo';
import { BurgerButton } from './BurgerButton';

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

export function MarketingHeader() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burgerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (burgerRef.current && !burgerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
          href: '/faq',
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
          soon: true,
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

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 12 : 20,
        padding: isMobile ? '12px 16px' : '12px 28px',
        borderBottom: `1px solid ${SUB0.line}`,
        background: 'rgba(250,250,247,.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <HeaderLogo />

      {isMobile && (
        <div ref={burgerRef} style={{ position: 'relative' }}>
          <BurgerButton
            open={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            ariaLabel={t('меню', 'menu')}
          />
          {mobileOpen && <MarketingMobileDrawer nav={nav} onClose={() => setMobileOpen(false)} />}
        </div>
      )}

      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
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
                    padding: '8px 12px',
                    color: SUB0.ink,
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: openMenu === ni ? 1 : 0.75,
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    letterSpacing: 'inherit',
                    borderRadius: 8,
                    transition: 'opacity .15s, background .15s',
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
                  padding: '8px 12px',
                  color: SUB0.ink,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: 0.75,
                  borderRadius: 8,
                }}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
        {!isMobile && <LangToggle />}
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
        {!isMobile && (
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
        )}
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
                <Link
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
                    <div
                      style={{ fontSize: 12, color: SUB0.muted, marginTop: 2, lineHeight: 1.4 }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

interface DrawerProps {
  nav: NavGroup[];
  onClose: () => void;
}

function MarketingMobileDrawer({ nav, onClose }: DrawerProps) {
  const { t, lang, toggle } = useLang();

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        left: 16,
        right: 16,
        background: SUB0.panel,
        border: `1px solid ${SUB0.line}`,
        borderRadius: 12,
        boxShadow: '0 24px 60px -20px rgba(10,10,10,.18)',
        padding: 8,
        zIndex: 49,
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '8px 10px 6px' }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: mono,
            color: SUB0.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          {t('Навигация', 'Navigation')}
        </div>
        {nav.map((n, ni) => (
          <div key={ni} style={{ marginBottom: 4 }}>
            <div
              style={{
                padding: '10px 10px 4px',
                fontSize: 15,
                fontWeight: 700,
                color: SUB0.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {n.href ? (
                <Link
                  href={n.href}
                  onClick={onClose}
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
                <Link
                  key={ii}
                  href={item.href || '#'}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 0 7px 14px',
                    fontSize: 13,
                    fontWeight: 400,
                    color: SUB0.muted,
                    textDecoration: 'none',
                    opacity: item.soon ? 0.45 : 1,
                  }}
                >
                  {item.label}
                  {item.soon && <SoonBadge />}
                </Link>
              ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${SUB0.line}`, margin: '8px 0' }} />

      <div style={{ padding: '6px 10px' }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: mono,
            color: SUB0.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          {t('Язык интерфейса', 'Interface language')}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: 4, background: SUB0.soft, borderRadius: 8 }}>
          {(['ru', 'en'] as const).map((l) => {
            const isActive = lang === l;
            return (
              <button
                key={l}
                onClick={() => {
                  if (lang !== l) toggle();
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? SUB0.panel : 'transparent',
                  color: SUB0.ink,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: mono,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(10,10,10,.06)' : 'none',
                }}
              >
                {l.toUpperCase()}
                <span style={{ marginLeft: 6, fontWeight: 500, color: SUB0.muted, fontSize: 11 }}>
                  {l === 'ru' ? 'Рус.' : 'Eng.'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${SUB0.line}`, margin: '8px 0' }} />

      <div style={{ padding: '6px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link
          href="/registration"
          onClick={onClose}
          className="s-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
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
    </div>
  );
}
