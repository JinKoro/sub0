'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'

const SOCIAL = ['tg', 'x', 'gh', 'yt']

export function Footer() {
  const { t } = useLang()

  const cols = [
    {
      title: t('Продукт', 'Product'),
      items: [
        [t('Возможности', 'Features'), '#'],
        [t('Тарифы', 'Pricing'), '#pricing'],
        [t('Дашборд', 'Dashboard'), '#dashboard'],
        [t('Мобильное (скоро)', 'Mobile (soon)'), '#'],
      ],
    },
    {
      title: t('Инструменты', 'Tools'),
      items: [
        [t('Калькулятор подписок', 'Calculator'), '#'],
        [t('База подписок', 'Library'), '#'],
        [t('Сравнение тарифов', 'Tier compare'), '#'],
        [t('Шаблоны импорта', 'Import templates'), '#'],
      ],
    },
    {
      title: t('Ресурсы', 'Resources'),
      items: [
        [t('Блог', 'Blog'), '#'],
        ['FAQ', '#'],
        ['Roadmap', '#'],
        [t('Отзывы', 'Reviews'), '#'],
      ],
    },
    {
      title: t('Компания', 'Company'),
      items: [
        [t('О проекте', 'About'), '#'],
        [t('Контакты', 'Contact'), '#'],
        [t('Политика конфиденциальности', 'Privacy'), '#'],
        [t('Условия', 'Terms'), '#'],
      ],
    },
  ]

  return (
    <footer style={{ background: SUB0.bg, color: SUB0.ink, padding: '80px 48px 40px', borderTop: `1px solid ${SUB0.line}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 32, marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6, background: SUB0.ink, color: SUB0.bg,
                fontSize: 14, fontWeight: 800,
              }}>▚</span>
              <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>Sub0</span>
            </div>
            <p style={{ fontSize: 14, color: SUB0.muted, lineHeight: 1.5, maxWidth: 260 }}>
              {t(
                'Контроль над подписками — личными и рабочими. Один список, ноль сюрпризов.',
                'Control over your subscriptions — personal and at work. One list, no surprises.'
              )}
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              {SOCIAL.map(s => (
                <a key={s} href="#" style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: SUB0.panel, border: `1px solid ${SUB0.line}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', color: SUB0.ink, fontSize: 11, fontFamily: mono, fontWeight: 700,
                }}>{s}</a>
              ))}
            </div>
          </div>

          {cols.map(c => (
            <div key={c.title}>
              <div style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                {c.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.items.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="s-a" style={{ color: SUB0.ink, textDecoration: 'none', fontSize: 14 }}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 24, borderTop: `1px solid ${SUB0.line}`,
          fontSize: 13, color: SUB0.muted, fontFamily: mono, flexWrap: 'wrap', gap: 16,
        }}>
          <div>© 2026 Sub0 · {t('все подписки под ноль', 'all subs, zero surprises')}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" className="s-a" style={{ color: SUB0.muted, textDecoration: 'none' }}>Status: OK</a>
            <a href="#" className="s-a" style={{ color: SUB0.muted, textDecoration: 'none' }}>Changelog</a>
            <a href="#" className="s-a" style={{ color: SUB0.muted, textDecoration: 'none' }}>support@sub0.app</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
