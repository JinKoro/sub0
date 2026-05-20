'use client';

import { CSSProperties, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PASSWORD_MIN, isValidPassword } from '@subzero/shared';
import { useLang } from '@/shared/contexts/lang-context';
import { SUB0 } from '@/shared/constants/tokens';
import { resetPassword } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState<'pw' | 'cf' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const pwOk = isValidPassword(password);
  const match = password.length > 0 && password === confirm;
  const canSubmit = pwOk && match && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      // Banner is rendered by LoginForm based on ?reset=ok.
      router.replace('/login?reset=ok');
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.status === 400) {
        // Token invalid / expired / used / archived account / weak password
        // (we already gated weak password on the frontend, so 400 here means
        // the token itself is no longer usable).
        setExpired(true);
      } else {
        setError(t('Что-то пошло не так. Попробуйте ещё раз.', 'Something went wrong. Try again.'));
      }
    }
  }

  const inputStyle = (field: 'pw' | 'cf'): CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${focus === field ? SUB0.blue : SUB0.line}`,
    borderRadius: 10,
    background: focus === field ? '#fff' : SUB0.bg,
    fontSize: 15,
    color: SUB0.ink,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  });

  const title: CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: 8,
    textAlign: 'center',
  };
  const subtitle: CSSProperties = {
    textAlign: 'center',
    color: SUB0.muted,
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 1.5,
  };
  const primaryBtn = (enabled: boolean): CSSProperties => ({
    width: '100%',
    padding: '14px',
    background: enabled ? SUB0.ink : SUB0.line,
    color: enabled ? SUB0.bg : '#aaa',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
  });

  if (!token) {
    return (
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={title}>{t('Ссылка неполная', 'Incomplete link')}</h1>
        <p style={subtitle}>
          {t(
            'Откройте ссылку из письма для сброса пароля.',
            'Open the link from the email to reset your password.',
          )}
        </p>
        <Link
          href="/forgot-password"
          style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          {t('Запросить ссылку', 'Request a link')}
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={title}>{t('Ссылка недействительна', 'Link is no longer valid')}</h1>
        <p style={subtitle}>
          {t(
            'Ссылка просрочена или уже использована. Запросите новое письмо.',
            'The link expired or was already used. Request a new email.',
          )}
        </p>
        <Link
          href="/forgot-password"
          style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          {t('Запросить новое письмо', 'Request a new email')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
      <h1 style={title}>{t('Новый пароль', 'New password')}</h1>
      <p style={subtitle}>
        {t('Придумайте новый пароль для входа в Sub0.', 'Create a new password to sign in to Sub0.')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder={t('Новый пароль', 'New password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocus('pw')}
            onBlur={() => setFocus(null)}
            style={{ ...inputStyle('pw'), paddingRight: 44 }}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={t('Показать пароль', 'Show password')}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: '#aaa',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            {show ? t('Скрыть', 'Hide') : t('Показать', 'Show')}
          </button>
        </div>
        <input
          type={show ? 'text' : 'password'}
          placeholder={t('Повторите пароль', 'Repeat password')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onFocus={() => setFocus('cf')}
          onBlur={() => setFocus(null)}
          style={inputStyle('cf')}
          autoComplete="new-password"
        />
      </div>

      <p style={{ fontSize: 12, color: SUB0.muted, margin: '10px 2px 0', lineHeight: 1.5 }}>
        {t(
          `Минимум ${PASSWORD_MIN} символов, хотя бы одна буква и одна цифра.`,
          `At least ${PASSWORD_MIN} characters, with a letter and a digit.`,
        )}
        {confirm.length > 0 && !match && (
          <span style={{ color: SUB0.danger, display: 'block', marginTop: 4 }}>
            {t('Пароли не совпадают.', 'Passwords do not match.')}
          </span>
        )}
      </p>

      {error && (
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 8,
            background: '#fff5f2',
            border: '1px solid #f5c5b5',
            fontSize: 13,
            color: SUB0.danger,
            margin: '14px 0',
          }}
        >
          {error}
        </div>
      )}

      <button type="submit" disabled={!canSubmit} style={{ ...primaryBtn(canSubmit), marginTop: 20 }}>
        {loading ? t('Сохраняем…', 'Saving…') : t('Сохранить пароль', 'Save password')}
      </button>
    </form>
  );
}
