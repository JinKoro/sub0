'use client';

import { useEffect, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { SettingsAccount } from './SettingsAccount';
import { SettingsBilling } from './SettingsBilling';
import { SettingsNotifications } from './SettingsNotifications';
import { SettingsSecurity } from './SettingsSecurity';

type SectionId = 'account' | 'billing' | 'notifications' | 'security';

interface Section {
  id: SectionId;
  ru: string;
  en: string;
  ic: string;
}

const SECTIONS: Section[] = [
  { id: 'account', ru: 'Аккаунт', en: 'Account', ic: '◈' },
  { id: 'billing', ru: 'Тарифы', en: 'Plans', ic: '₽' },
  { id: 'notifications', ru: 'Уведомления', en: 'Notifications', ic: '◐' },
  { id: 'security', ru: 'Безопасность и вход', en: 'Security & sign-in', ic: '✦' },
];

function readSectionFromHash(): SectionId {
  if (typeof window === 'undefined') return 'account';
  const h = (window.location.hash || '').replace('#', '');
  return (SECTIONS.find((s) => s.id === h)?.id ?? 'account') as SectionId;
}

export function SettingsPage() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  // Section state is one-way derived from URL hash. The sidebar pushes the
  // hash directly; this effect picks it up. Avoids the StrictMode race we'd
  // get from a second "section → hash" reverse-sync effect.
  const [section, setSection] = useState<SectionId>('account');

  useEffect(() => {
    setSection(readSectionFromHash());
    // Reset scroll on initial mount — the URL hash drives section state,
    // not anchor scrolling, so we'd otherwise land on a half-scrolled page.
    window.scrollTo(0, 0);
    let lastHash = window.location.hash;
    const sync = () => {
      const h = window.location.hash;
      if (h === lastHash) return;
      lastHash = h;
      setSection(readSectionFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', sync);
    // Next.js Link with the same pathname uses history.pushState, which
    // doesn't fire hashchange. Patch it (scoped to this mount) so same-page
    // hash navigation from the user menu / header tab still updates state.
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      origPush.apply(this, args);
      sync();
    };
    window.history.replaceState = function (...args) {
      origReplace.apply(this, args);
      sync();
    };
    return () => {
      window.removeEventListener('hashchange', sync);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  const navigateSection = (id: SectionId) => {
    setSection(id);
    if (window.location.hash !== `#${id}`) {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: isMobile ? '20px 16px 60px' : '32px 28px 80px',
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '240px 1fr',
          gap: isMobile ? 16 : 32,
          alignItems: 'start',
        }}
      >
        <nav
          style={{
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? 'auto' : 80,
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: isMobile ? 6 : 2,
            overflowX: isMobile ? 'auto' : 'visible',
            padding: isMobile ? '4px 2px' : 0,
          }}
        >
          {SECTIONS.map((s) => {
            const on = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => navigateSection(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: isMobile ? '9px 14px' : '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: on ? SUB0.ink : 'transparent',
                  color: on ? SUB0.bg : SUB0.ink,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    width: 24,
                    textAlign: 'center',
                    color: on ? SUB0.bg : SUB0.muted,
                    opacity: on ? 0.9 : 1,
                    fontWeight: 700,
                    fontSize: s.ic === '₽' ? 15 : 18,
                  }}
                >
                  {s.ic}
                </span>
                <span style={{ flex: 1 }}>{t(s.ru, s.en)}</span>
              </button>
            );
          })}
        </nav>

        <div>
          {section === 'account' && <SettingsAccount />}
          {section === 'billing' && <SettingsBilling />}
          {section === 'notifications' && <SettingsNotifications />}
          {section === 'security' && <SettingsSecurity />}
        </div>
      </div>
    </div>
  );
}
