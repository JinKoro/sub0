'use client';

import { CSSProperties, useState } from 'react';
import Link from 'next/link';
import { Locale } from '@subzero/shared';
import { useLang } from '@/shared/contexts/lang-context';
import { SUB0 } from '@/shared/constants/tokens';
import { register } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';

// ── Provider icons ─────────────────────────────────────────────────────────────

function AppIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: bg,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

const GMAIL_ICON = (
  <AppIcon bg="#fff">
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      <path
        d="M2 0h20c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V2C0 .9.9 0 2 0z"
        fill="#fff"
      />
      <path d="M0 2l12 8L24 2" stroke="#DADCE0" strokeWidth=".5" fill="none" />
      <path d="M0 2v14h4V6.5L12 12l8-5.5V16h4V2L12 10 0 2z" fill="#EA4335" />
      <path d="M0 2l12 8L24 2l-12 8L0 2z" fill="#EA4335" />
      <path d="M0 16V2l4 4.5V16H0z" fill="#34A853" />
      <path d="M24 16V2l-4 4.5V16h4z" fill="#FBBC05" />
      <path d="M4 6.5V16h16V6.5L12 12 4 6.5z" fill="#4285F4" />
    </svg>
  </AppIcon>
);

const OUTLOOK_ICON = (
  <AppIcon bg="#0078D4">
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
      <rect x="1" y="1" width="14" height="18" rx="2" fill="#fff" fillOpacity=".15" />
      <text
        x="8"
        y="14"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        O
      </text>
      <rect x="13" y="4" width="10" height="12" rx="1.5" fill="#fff" fillOpacity=".2" />
      <polyline points="13,4 18,10 23,4" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  </AppIcon>
);

const ICLOUD_ICON = (
  <AppIcon bg="linear-gradient(145deg, #5AC8FA 0%, #007AFF 100%)">
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
      <path
        d="M20 8.5C19.5 5.5 17 3 14 3c-2.5 0-4.7 1.5-5.8 3.7C5.3 7 3 9.5 3 12.5 3 16.1 5.9 19 9.5 19h11c3 0 5.5-2.5 5.5-5.5 0-2.8-2.1-5.1-4.8-5.5"
        fill="#fff"
        fillOpacity=".9"
      />
      <path
        d="M9 13l3 3 5-5"
        stroke="#007AFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </AppIcon>
);

const YAHOO_ICON = (
  <AppIcon bg="#6001D2">
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <text
        x="11"
        y="15"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        Y!
      </text>
    </svg>
  </AppIcon>
);

const MAILRU_ICON = (
  <AppIcon bg="#FF6633">
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      <rect
        x="1"
        y="2"
        width="22"
        height="14"
        rx="2"
        fill="#fff"
        fillOpacity=".2"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth=".8"
      />
      <path d="M1 4l11 7 11-7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  </AppIcon>
);

const YANDEX_ICON = (
  <AppIcon bg="#FC3F1D">
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <text
        x="11"
        y="15"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        Я
      </text>
    </svg>
  </AppIcon>
);

const PROTON_ICON = (
  <AppIcon bg="#6D4AFF">
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path
        d="M4 16V4h7c3.3 0 6 2.7 6 6s-2.7 6-6 6H9v-5h2c.6 0 1-.4 1-1s-.4-1-1-1H9v7H4z"
        fill="#fff"
      />
    </svg>
  </AppIcon>
);

const FASTMAIL_ICON = (
  <AppIcon bg="#0E2E5C">
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <text
        x="11"
        y="15"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        FM
      </text>
    </svg>
  </AppIcon>
);

// ── Provider map ───────────────────────────────────────────────────────────────

type Provider = { nameRu: string; name: string; url: string; icon: React.ReactNode };

const PROVIDERS: Record<string, Provider> = {
  'gmail.com': {
    nameRu: 'Открыть Gmail',
    name: 'Open Gmail',
    url: 'https://mail.google.com',
    icon: GMAIL_ICON,
  },
  'googlemail.com': {
    nameRu: 'Открыть Gmail',
    name: 'Open Gmail',
    url: 'https://mail.google.com',
    icon: GMAIL_ICON,
  },
  'outlook.com': {
    nameRu: 'Открыть Outlook',
    name: 'Open Outlook',
    url: 'https://outlook.live.com',
    icon: OUTLOOK_ICON,
  },
  'hotmail.com': {
    nameRu: 'Открыть Outlook',
    name: 'Open Outlook',
    url: 'https://outlook.live.com',
    icon: OUTLOOK_ICON,
  },
  'live.com': {
    nameRu: 'Открыть Outlook',
    name: 'Open Outlook',
    url: 'https://outlook.live.com',
    icon: OUTLOOK_ICON,
  },
  'msn.com': {
    nameRu: 'Открыть Outlook',
    name: 'Open Outlook',
    url: 'https://outlook.live.com',
    icon: OUTLOOK_ICON,
  },
  'icloud.com': {
    nameRu: 'Открыть iCloud Mail',
    name: 'Open iCloud Mail',
    url: 'https://www.icloud.com/mail',
    icon: ICLOUD_ICON,
  },
  'me.com': {
    nameRu: 'Открыть iCloud Mail',
    name: 'Open iCloud Mail',
    url: 'https://www.icloud.com/mail',
    icon: ICLOUD_ICON,
  },
  'mac.com': {
    nameRu: 'Открыть iCloud Mail',
    name: 'Open iCloud Mail',
    url: 'https://www.icloud.com/mail',
    icon: ICLOUD_ICON,
  },
  'yahoo.com': {
    nameRu: 'Открыть Yahoo Mail',
    name: 'Open Yahoo Mail',
    url: 'https://mail.yahoo.com',
    icon: YAHOO_ICON,
  },
  'yahoo.ru': {
    nameRu: 'Открыть Yahoo Mail',
    name: 'Open Yahoo Mail',
    url: 'https://mail.yahoo.com',
    icon: YAHOO_ICON,
  },
  'ymail.com': {
    nameRu: 'Открыть Yahoo Mail',
    name: 'Open Yahoo Mail',
    url: 'https://mail.yahoo.com',
    icon: YAHOO_ICON,
  },
  'mail.ru': {
    nameRu: 'Открыть Mail.ru',
    name: 'Open Mail.ru',
    url: 'https://mail.ru',
    icon: MAILRU_ICON,
  },
  'list.ru': {
    nameRu: 'Открыть Mail.ru',
    name: 'Open Mail.ru',
    url: 'https://mail.ru',
    icon: MAILRU_ICON,
  },
  'inbox.ru': {
    nameRu: 'Открыть Mail.ru',
    name: 'Open Mail.ru',
    url: 'https://mail.ru',
    icon: MAILRU_ICON,
  },
  'bk.ru': {
    nameRu: 'Открыть Mail.ru',
    name: 'Open Mail.ru',
    url: 'https://mail.ru',
    icon: MAILRU_ICON,
  },
  'yandex.ru': {
    nameRu: 'Открыть Яндекс Почту',
    name: 'Open Yandex Mail',
    url: 'https://mail.yandex.ru',
    icon: YANDEX_ICON,
  },
  'yandex.com': {
    nameRu: 'Открыть Яндекс Почту',
    name: 'Open Yandex Mail',
    url: 'https://mail.yandex.ru',
    icon: YANDEX_ICON,
  },
  'ya.ru': {
    nameRu: 'Открыть Яндекс Почту',
    name: 'Open Yandex Mail',
    url: 'https://mail.yandex.ru',
    icon: YANDEX_ICON,
  },
  'protonmail.com': {
    nameRu: 'Открыть Proton Mail',
    name: 'Open Proton Mail',
    url: 'https://mail.proton.me',
    icon: PROTON_ICON,
  },
  'proton.me': {
    nameRu: 'Открыть Proton Mail',
    name: 'Open Proton Mail',
    url: 'https://mail.proton.me',
    icon: PROTON_ICON,
  },
  'fastmail.com': {
    nameRu: 'Открыть Fastmail',
    name: 'Open Fastmail',
    url: 'https://www.fastmail.com',
    icon: FASTMAIL_ICON,
  },
  'fastmail.fm': {
    nameRu: 'Открыть Fastmail',
    name: 'Open Fastmail',
    url: 'https://www.fastmail.com',
    icon: FASTMAIL_ICON,
  },
};

function getProvider(email: string): Provider | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return PROVIDERS[domain] ?? null;
}

// ── RegisterForm ───────────────────────────────────────────────────────────────

export function RegisterForm() {
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agree1, setAgree1] = useState(true);
  const [agree2, setAgree2] = useState(true);
  const [focusField, setFocusField] = useState<'name' | 'email' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && email.includes('@') && agree1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await register({
        email,
        name,
        marketingConsent: agree2,
        localeId: lang === 'en' ? Locale.EN : Locale.RU,
      });
      setLoading(false);
      setSubmitted(true);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof ApiError && err.status === 409
          ? t('Этот email уже зарегистрирован.', 'This email is already registered.')
          : t('Что-то пошло не так. Попробуйте ещё раз.', 'Something went wrong. Try again.'),
      );
    }
  }

  const inputStyle = (field: 'name' | 'email'): CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${focusField === field ? SUB0.blue : SUB0.line}`,
    borderRadius: 10,
    background: focusField === field ? '#fff' : SUB0.bg,
    fontSize: 15,
    color: SUB0.ink,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  });

  if (submitted) {
    const provider = getProvider(email);
    return (
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: 16,
            lineHeight: 1.15,
          }}
        >
          {t('Завершите регистрацию', 'Complete your registration')}
        </h2>
        <p style={{ color: SUB0.muted, fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          {t(
            'Отправили письмо со ссылкой для завершения регистрации на ',
            'We sent a confirmation link to ',
          )}
          <strong style={{ color: SUB0.ink, fontWeight: 600 }}>{email}</strong>
        </p>

        {provider && (
          <a
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: SUB0.ink,
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'opacity .15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {provider.icon}
            <span>{t(provider.nameRu, provider.name)}</span>
          </a>
        )}
      </div>
    );
  }

  const checkboxes: Array<{
    id: string;
    checked: boolean;
    set: (v: boolean) => void;
    label: React.ReactNode;
  }> = [
    {
      id: 'agree1',
      checked: agree1,
      set: setAgree1,
      label: (
        <>
          {t('Я ознакомлен(а) с ', 'I have read the ')}
          <a href="#" style={{ color: SUB0.blue }}>
            {t('офертой', 'terms')}
          </a>
          {t(' и даю ', ' and ')}
          <a href="#" style={{ color: SUB0.blue }}>
            {t('согласие', 'consent')}
          </a>
          {t(' на обработку персональных данных', ' to personal data processing')}
        </>
      ),
    },
    {
      id: 'agree2',
      checked: agree2,
      set: setAgree2,
      label: (
        <>
          {t('Я даю ', 'I ')}
          <a href="#" style={{ color: SUB0.blue }}>
            {t('согласие', 'consent')}
          </a>
          {t(' на получение информационных рассылок', ' to receive informational mailings')}
        </>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {t('Создать аккаунт', 'Create account')}
      </h1>
      <p
        style={{
          textAlign: 'center',
          color: SUB0.muted,
          fontSize: 14,
          marginBottom: 32,
          lineHeight: 1.5,
        }}
      >
        {t(
          'Введите имя и email, чтобы начать отслеживать подписки',
          'Enter your name and email to start tracking subscriptions',
        )}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder={t('Иван Иванов', 'John Doe')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocusField('name')}
          onBlur={() => setFocusField(null)}
          style={inputStyle('name')}
          autoComplete="name"
        />
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusField('email')}
          onBlur={() => setFocusField(null)}
          style={inputStyle('email')}
          autoComplete="email"
        />
      </div>

      {error && (
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 8,
            background: '#fff5f2',
            border: '1px solid #f5c5b5',
            fontSize: 13,
            color: SUB0.danger,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        style={{
          width: '100%',
          padding: '14px',
          background: canSubmit ? SUB0.ink : SUB0.line,
          color: canSubmit ? SUB0.bg : '#aaa',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          letterSpacing: '-0.01em',
          transition: 'background .2s, transform .15s',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'inherit',
        }}
        onMouseOver={(e) => {
          if (canSubmit) e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid #555',
                borderTopColor: SUB0.bg,
                borderRadius: '50%',
                animation: 's-spin .7s linear infinite',
                display: 'inline-block',
              }}
            />
            {t('Создаём аккаунт…', 'Creating account…')}
          </>
        ) : (
          t('Создать аккаунт', 'Create account')
        )}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checkboxes.map(({ id, checked, set, label }) => (
          <label
            key={id}
            style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}
          >
            <span
              onClick={() => set(!checked)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                flexShrink: 0,
                marginTop: 1,
                border: `2px solid ${checked ? SUB0.blue : '#ccc'}`,
                background: checked ? SUB0.blue : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .15s',
              }}
            >
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4l3 3 5-6"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ fontSize: 13, color: SUB0.muted, lineHeight: 1.5 }}>{label}</span>
          </label>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: SUB0.muted }}>
        {t('Уже есть аккаунт? ', 'Already have an account? ')}
        <Link href="/login" style={{ color: SUB0.blue, fontWeight: 600, textDecoration: 'none' }}>
          {t('Войти', 'Log in')}
        </Link>
      </p>
    </form>
  );
}
