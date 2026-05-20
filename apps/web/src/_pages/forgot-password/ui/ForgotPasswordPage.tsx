'use client';

import Link from 'next/link';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { SUB0, mono } from '@/shared/constants/tokens';
import { LangToggle } from '@/shared/components/ui/LangToggle';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form/ui/ForgotPasswordForm';
import { SidePanel } from '@/_pages/register/ui/SidePanel';

export function ForgotPasswordPage() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        minHeight: '100vh',
      }}
    >
      {!isMobile && (
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <SidePanel />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '16px 20px' : '20px 40px',
            borderBottom: `1px solid ${SUB0.line}`,
            gap: 12,
          }}
        >
          {isMobile && (
            <Link
              href="/"
              style={{
                display: 'inline-flex',
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
            </Link>
          )}
          <div style={{ flex: 1 }} />
          <LangToggle />
          {!isMobile && (
            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: SUB0.muted,
              }}
            >
              {t('Вспомнили пароль?', 'Remembered it?')}
            </span>
          )}
          <Link
            href="/login"
            style={{
              padding: isMobile ? '7px 14px' : '8px 18px',
              border: `1.5px solid ${SUB0.ink}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: SUB0.ink,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              transition: 'background .15s, color .15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = SUB0.ink;
              e.currentTarget.style.color = SUB0.bg;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = SUB0.ink;
            }}
          >
            {t('Войти', 'Log in')}
          </Link>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '32px 20px' : '48px 40px',
          }}
        >
          <ForgotPasswordForm />
        </div>

        <div
          style={{
            padding: isMobile ? '14px 20px' : '16px 40px',
            borderTop: `1px solid ${SUB0.line}`,
            textAlign: 'center',
          }}
        >
          <span style={{ fontFamily: mono, fontSize: 11, color: '#aaa', letterSpacing: '0.04em' }}>
            {t(
              'Sub0 © 2026 — Все подписки под контролем',
              'Sub0 © 2026 — All subscriptions under control',
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
