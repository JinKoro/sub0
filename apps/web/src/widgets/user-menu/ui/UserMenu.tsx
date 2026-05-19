'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SUB0, mono } from '@/shared/constants/tokens';
import { Plan } from '@subzero/shared';
import { useLang } from '@/shared/contexts/lang-context';
import { useProfile } from '@/shared/contexts/profile-context';
import { logout } from '@/shared/api/auth';

interface MenuItem {
  ic: string;
  lbl: string;
  lblEn: string;
  href: string;
  iconSize?: number;
}

export function UserMenu() {
  const { t } = useLang();
  const { profile, initials } = useProfile();
  const displayName = profile?.name?.trim() || profile?.email || '';
  const email = profile?.email ?? '';
  const planLabel = profile ? (Plan[profile.planId] ?? 'FREE') : 'FREE';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // ignore — redirect regardless; middleware will gate protected routes
    }
    setOpen(false);
    router.replace('/login');
  }

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const items: MenuItem[] = [
    { ic: '⚙', lbl: 'Настройки аккаунта', lblEn: 'Account settings', href: '/settings#account' },
    { ic: '₽', lbl: 'Тарифы и оплата', lblEn: 'Plans & billing', href: '/settings#billing', iconSize: 15 },
    { ic: '↗', lbl: 'Перейти на главную', lblEn: 'Back to home', href: '/' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('Меню пользователя', 'User menu')}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 999,
            background: SUB0.blue,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            border: `2px solid ${open ? SUB0.ink : 'transparent'}`,
            transition: 'border-color .15s',
          }}
        >
          {initials}
        </span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 280,
            background: SUB0.panel,
            border: `1px solid ${SUB0.line}`,
            borderRadius: 12,
            boxShadow: '0 24px 60px -20px rgba(10,10,10,.18)',
            padding: 6,
            zIndex: 80,
          }}
        >
          <div
            style={{
              padding: '12px 12px 14px',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              borderBottom: `1px solid ${SUB0.line}`,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: SUB0.blue,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {initials}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: SUB0.ink }}>
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: SUB0.muted,
                  fontFamily: mono,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {email}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${SUB0.line}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: SUB0.soft,
                  fontSize: 11,
                  fontFamily: mono,
                  fontWeight: 700,
                  color: SUB0.ink,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: SUB0.blue }} />
                {planLabel}
              </span>
              <span style={{ fontSize: 12, color: SUB0.muted }}>
                {t('Текущий тариф', 'Current plan')}
              </span>
            </div>
          </div>

          <div style={{ padding: 4 }}>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                scroll={false}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: SUB0.ink,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = SUB0.soft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  style={{
                    width: 22,
                    color: SUB0.muted,
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: it.iconSize ?? 18,
                    textAlign: 'center',
                  }}
                >
                  {it.ic}
                </span>
                {t(it.lbl, it.lblEn)}
              </Link>
            ))}
            <div style={{ borderTop: `1px solid ${SUB0.line}`, margin: '4px 0' }} />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 10px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: loggingOut ? 'default' : 'pointer',
                color: SUB0.danger,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf0eb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 22,
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 18,
                  textAlign: 'center',
                }}
              >
                ↩
              </span>
              {loggingOut ? t('Выходим…', 'Logging out…') : t('Выйти', 'Log out')}
            </button>
          </div>

          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="s-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              margin: 6,
              padding: '12px 14px',
              background: SUB0.ink,
              color: SUB0.bg,
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ✦ {t('Обновить до Pro', 'Upgrade to Pro')}
          </Link>
        </div>
      )}
    </div>
  );
}
