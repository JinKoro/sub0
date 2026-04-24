'use client'

import { useLang } from '@/shared/contexts/lang-context'
import { LangToggle } from '@/shared/components/ui/LangToggle'
import { SUB0 } from '@/shared/constants/tokens'

const NAV = [
  { ru: 'Продукт', en: 'Product', href: '#product' },
  { ru: 'Инструменты', en: 'Tools', href: '#tools' },
  { ru: 'Ресурсы', en: 'Resources', href: '#resources' },
  { ru: 'Тарифы', en: 'Pricing', href: '#pricing' },
]

export function Header() {
  const { t } = useLang()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 48px',
      borderBottom: `1px solid ${SUB0.line}`,
      background: 'rgba(250,250,247,.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      gap: 32,
    }}>
      <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: SUB0.ink }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          background: SUB0.ink,
          color: SUB0.bg,
          fontSize: 14,
          fontWeight: 800,
        }}>▚</span>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em' }}>Sub0</span>
      </a>

      <nav style={{ display: 'flex', gap: 28, flex: 1, justifyContent: 'center' }}>
        {NAV.map(n => (
          <a
            key={n.en}
            href={n.href}
            className="s-a"
            style={{ color: SUB0.ink, textDecoration: 'none', fontSize: 15, fontWeight: 500, opacity: 0.75 }}
          >
            {t(n.ru, n.en)}
          </a>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LangToggle />
        <a href="#" className="s-a" style={{ color: SUB0.ink, textDecoration: 'none', fontSize: 14, fontWeight: 500, opacity: 0.75 }}>
          {t('Войти', 'Log in')}
        </a>
        <a href="#" className="s-btn" style={{
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
        }}>
          {t('Регистрация', 'Sign up')} →
        </a>
      </div>
    </header>
  )
}
