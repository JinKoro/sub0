'use client';

import { CSSProperties, useState } from 'react';
import Link from 'next/link';
import { Locale } from '@subzero/shared';
import { useLang } from '@/shared/contexts/lang-context';
import { SUB0 } from '@/shared/constants/tokens';
import { register } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { EmailSentScreen } from '@/shared/components/auth/EmailSentScreen';

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
    return (
      <EmailSentScreen
        email={email}
        titleRu="Завершите регистрацию"
        titleEn="Complete your registration"
        bodyRu="Отправили письмо со ссылкой для завершения регистрации на "
        bodyEn="We sent a confirmation link to "
      />
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
