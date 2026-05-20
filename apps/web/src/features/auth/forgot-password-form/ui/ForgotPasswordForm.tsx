'use client';

import { CSSProperties, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/shared/contexts/lang-context';
import { SUB0 } from '@/shared/constants/tokens';
import { forgotPassword } from '@/shared/api/auth';
import { EmailSentScreen } from '@/shared/components/auth/EmailSentScreen';

export function ForgotPasswordForm() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [focus, setFocus] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes('@') && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      // Backend always returns 200 (anti-enumeration). We unconditionally
      // show the success screen even if it didn't.
      await forgotPassword(email);
      setLoading(false);
      setSubmitted(true);
    } catch {
      setLoading(false);
      setError(t('Что-то пошло не так. Попробуйте ещё раз.', 'Something went wrong. Try again.'));
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${focus ? SUB0.blue : SUB0.line}`,
    borderRadius: 10,
    background: focus ? '#fff' : SUB0.bg,
    fontSize: 15,
    color: SUB0.ink,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  };

  if (submitted) {
    return (
      <EmailSentScreen
        email={email}
        titleRu="Письмо отправлено"
        titleEn="Email sent"
        bodyRu="Если аккаунт существует, мы отправили ссылку для сброса пароля на "
        bodyEn="If an account exists, we sent a password reset link to "
      />
    );
  }

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
        {t('Сброс пароля', 'Reset password')}
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
          'Введите email — отправим ссылку для установки нового пароля.',
          'Enter your email — we will send a link to set a new password.',
        )}
      </p>

      <input
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={inputStyle}
        autoComplete="email"
      />

      {error && (
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 8,
            background: '#fff5f2',
            border: '1px solid #f5c5b5',
            fontSize: 13,
            color: SUB0.danger,
            marginTop: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
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
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'inherit',
        }}
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
            {t('Отправляем…', 'Sending…')}
          </>
        ) : (
          t('Отправить ссылку', 'Send reset link')
        )}
      </button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: SUB0.muted }}>
        {t('Вспомнили пароль? ', 'Remembered your password? ')}
        <Link href="/login" style={{ color: SUB0.blue, fontWeight: 600, textDecoration: 'none' }}>
          {t('Войти', 'Log in')}
        </Link>
      </p>
    </form>
  );
}
