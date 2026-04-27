'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/shared/contexts/lang-context'
import { SUB0, mono } from '@/shared/constants/tokens'
import { GoogleButton } from '@/features/auth/oauth-google/ui/GoogleButton'

export function LoginForm() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [focusField, setFocusField] = useState<'email' | 'pass' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const canSubmit = email.includes('@') && password.length >= 1

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError(false)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1200)
  }

  const inputStyle = (field: 'email' | 'pass'): CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${error ? SUB0.danger : focusField === field ? SUB0.blue : SUB0.line}`,
    borderRadius: 10,
    background: focusField === field ? '#fff' : SUB0.bg,
    fontSize: 15,
    color: SUB0.ink,
    outline: 'none',
    transition: 'border-color .15s, background .15s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  })

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#f0f7f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke={SUB0.good} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>
          {t('Добро пожаловать!', 'Welcome back!')}
        </h2>
        <p style={{ color: SUB0.muted, fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>
          {t('Вы успешно вошли в Sub0.', 'You have successfully signed in to Sub0.')}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block', padding: '13px 28px',
            background: SUB0.ink, color: '#fff',
            borderRadius: 10, fontSize: 15, fontWeight: 600,
            textDecoration: 'none', letterSpacing: '-0.01em',
            transition: 'opacity .15s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          {t('Перейти на главную', 'Go to home')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
      <h1 style={{
        fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
        marginBottom: 8, textAlign: 'center',
      }}>{t('Войти в аккаунт', 'Sign in')}</h1>
      <p style={{
        textAlign: 'center', color: SUB0.muted, fontSize: 14,
        marginBottom: 32, lineHeight: 1.5,
      }}>
        {t('Введите email и пароль для входа', 'Enter your email and password to sign in')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(false) }}
          onFocus={() => setFocusField('email')}
          onBlur={() => setFocusField(null)}
          style={inputStyle('email')}
          autoComplete="email"
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder={t('Пароль', 'Password')}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            onFocus={() => setFocusField('pass')}
            onBlur={() => setFocusField(null)}
            style={{ ...inputStyle('pass'), paddingRight: 44 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#aaa', lineHeight: 0,
            }}
          >
            {showPass ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        <a href="#" style={{ fontSize: 13, color: SUB0.blue, textDecoration: 'none', fontWeight: 500 }}>
          {t('Забыли пароль?', 'Forgot password?')}
        </a>
      </div>

      {error && (
        <div style={{
          padding: '11px 14px', borderRadius: 8,
          background: '#fff5f2', border: '1px solid #f5c5b5',
          fontSize: 13, color: SUB0.danger, marginBottom: 14,
        }}>
          {t('Неверный email или пароль. Попробуйте ещё раз.', 'Incorrect email or password. Please try again.')}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        style={{
          width: '100%', padding: '14px',
          background: canSubmit ? SUB0.ink : SUB0.line,
          color: canSubmit ? SUB0.bg : '#aaa',
          border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
          letterSpacing: '-0.01em', transition: 'background .2s, transform .15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
        }}
        onMouseOver={e => { if (canSubmit) e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {loading ? (
          <>
            <span style={{
              width: 16, height: 16, border: '2px solid #555',
              borderTopColor: SUB0.bg, borderRadius: '50%',
              animation: 's-spin .7s linear infinite', display: 'inline-block',
            }} />
            {t('Входим…', 'Signing in…')}
          </>
        ) : t('Войти', 'Sign in')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: SUB0.line }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: '#aaa', letterSpacing: '0.06em' }}>
          {t('ИЛИ', 'OR')}
        </span>
        <div style={{ flex: 1, height: 1, background: SUB0.line }} />
      </div>

      <GoogleButton />

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: SUB0.muted }}>
        {t('Нет аккаунта? ', "Don't have an account? ")}
        <Link href="/registration" style={{ color: SUB0.blue, fontWeight: 600, textDecoration: 'none' }}>
          {t('Зарегистрироваться', 'Sign up')}
        </Link>
      </p>
    </form>
  )
}
