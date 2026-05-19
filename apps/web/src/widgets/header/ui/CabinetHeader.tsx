'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { CURRENCY_OPTIONS } from '@/shared/constants/cabinet';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { usePrefs } from '@/shared/hooks/use-prefs';
import { ProjectSwitcher } from '@/widgets/project-switcher/ui/ProjectSwitcher';
import { CurrencyDropdown } from '@/widgets/currency-dropdown/ui/CurrencyDropdown';
import { UserMenu } from '@/widgets/user-menu/ui/UserMenu';
import { HeaderLogo } from './HeaderLogo';
import { BurgerButton } from './BurgerButton';

interface Tab {
  id: string;
  label: string;
  labelEn: string;
  href: string;
}

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Обзор', labelEn: 'Overview', href: '/dashboard' },
  { id: 'subscriptions', label: 'Подписки', labelEn: 'Subscriptions', href: '/subscriptions' },
  { id: 'calendar', label: 'Календарь', labelEn: 'Calendar', href: '/calendar' },
  { id: 'notifications', label: 'Уведомления', labelEn: 'Notifications', href: '/settings#notifications' },
];

function activeTabId(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/subscriptions')) return 'subscriptions';
  if (pathname.startsWith('/calendar')) return 'calendar';
  if (pathname.startsWith('/settings')) return 'notifications';
  return '';
}

export function CabinetHeader() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [burgerOpen, setBurgerOpen] = useState(false);
  const { currency } = useCabinet();
  const prefs = usePrefs();
  const burgerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBurgerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (burgerRef.current && !burgerRef.current.contains(e.target as Node)) {
        setBurgerOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const active = activeTabId(pathname);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
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
      <HeaderLogo hideText={isMobile} href="/dashboard" />

      {isMobile && (
        <div ref={burgerRef} style={{ position: 'relative' }}>
          <BurgerButton
            open={burgerOpen}
            onClick={() => setBurgerOpen((o) => !o)}
            ariaLabel={t('меню', 'menu')}
          />
          {burgerOpen && (
            <CabinetMobileDrawer
              currency={currency}
              setCurrency={prefs.setCurrency}
              onClose={() => setBurgerOpen(false)}
              active={active}
              lang={lang}
              setLang={prefs.setLang}
            />
          )}
        </div>
      )}

      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {TABS.map((tb) => {
            const isActive = active === tb.id;
            const goesToSettings = tb.href.startsWith('/settings');
            return (
              <Link
                key={tb.id}
                href={tb.href}
                scroll={!goesToSettings}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  background: isActive ? SUB0.ink : 'transparent',
                  color: isActive ? SUB0.bg : SUB0.muted,
                  transition: 'background .15s, color .15s',
                  textDecoration: 'none',
                }}
              >
                {t(tb.label, tb.labelEn)}
              </Link>
            );
          })}
        </nav>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
        <ProjectSwitcher isMobile={isMobile} />

        {!isMobile && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 2,
                padding: 3,
                background: SUB0.soft,
                borderRadius: 8,
                border: `1px solid ${SUB0.line}`,
              }}
            >
              {(['ru', 'en'] as const).map((l) => {
                const isActive = lang === l;
                return (
                  <button
                    key={l}
                    onClick={() => prefs.setLang(l)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 5,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? SUB0.panel : 'transparent',
                      color: isActive ? SUB0.ink : SUB0.muted,
                      fontFamily: mono,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <CurrencyDropdown />
          </>
        )}

        <UserMenu />
      </div>
    </header>
  );
}

interface DrawerProps {
  currency: string;
  setCurrency: (c: 'RUB' | 'USD' | 'EUR' | 'BYN') => void;
  onClose: () => void;
  active: string;
  lang: 'ru' | 'en';
  setLang: (l: 'ru' | 'en') => void;
}

function CabinetMobileDrawer({
  currency,
  setCurrency,
  onClose,
  active,
  lang,
  setLang,
}: DrawerProps) {
  const { t } = useLang();

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
        zIndex: 80,
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
          {t('Разделы', 'Sections')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map((tb) => {
            const isActive = active === tb.id;
            const goesToSettings = tb.href.startsWith('/settings');
            return (
              <Link
                key={tb.id}
                href={tb.href}
                scroll={!goesToSettings}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 6,
                  background: isActive ? SUB0.ink : 'transparent',
                  color: isActive ? SUB0.bg : SUB0.ink,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {t(tb.label, tb.labelEn)}
              </Link>
            );
          })}
        </div>
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
                onClick={() => setLang(l)}
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

      <div style={{ padding: '0 10px 8px' }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: mono,
            color: SUB0.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
            marginTop: 6,
          }}
        >
          {t('Валюта аналитики', 'Analytics currency')}
        </div>
        <div style={{ fontSize: 11, color: SUB0.muted, marginBottom: 8, lineHeight: 1.4 }}>
          {t(
            'Только для сводных сумм. Цены подписок — в оригинальной валюте.',
            'For totals only. Subscription prices shown in their original currency.',
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {CURRENCY_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setCurrency(o.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: currency === o.id ? SUB0.soft : 'transparent',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 14,
                  width: 24,
                  color: SUB0.ink,
                }}
              >
                {o.sym}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: SUB0.ink }}>
                {t(o.label, o.labelEn)}
              </span>
              <span style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted }}>{o.id}</span>
              {currency === o.id && (
                <span style={{ color: SUB0.blue, fontFamily: mono, fontWeight: 700, fontSize: 12 }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
