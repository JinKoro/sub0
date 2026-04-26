'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'
import { LogoPill } from '@/shared/components/ui/LogoPill'

const LIBRARY_ITEMS: [string, string, string][] = [
  ['S', 'Streamflix',  '#1347ff'],
  ['T', 'Tonewave',    '#0a7a3f'],
  ['N', 'Notebase',    '#0a0a0a'],
  ['D', 'Designkit',   '#b0851a'],
  ['L', 'Lingoleaf',   '#6b21d9'],
  ['V', 'Vaultpass',   '#0a0a0a'],
  ['C', 'Cloudstore',  '#1347ff'],
]

export function Tools() {
  const { t } = useLang()

  const items = [
    {
      title: t('Калькулятор подписок', 'Subscription calculator'),
      sub: t(
        'Вбейте все свои сервисы — получите месяц, год и расходы по категориям.',
        'Enter all your services — get monthly, yearly, and by-category spend.'
      ),
      tag: '/calculator',
    },
    {
      title: t('Сравнение тарифов', 'Tier comparison'),
      sub: t(
        'Выберите сервис — сравните его планы по цене за фичу и ограничениям.',
        'Pick a service — compare plans by price-per-feature and limits.'
      ),
      tag: '/compare',
    },
    {
      title: t('База подписок', 'Subscription library'),
      sub: t(
        'Более 1 200 сервисов с актуальными ценами, пробниками и способами отмены.',
        '1,200+ services with up-to-date prices, trials, and cancel guides.'
      ),
      tag: '/library',
    },
  ]

  return (
    <Section bg={SUB0.panel} pad="120px 48px" id="tools">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
        <div>
          <SectionEyebrow num="06">{t('Инструменты', 'Tools')}</SectionEyebrow>
          <H2>
            {t('Полезное — ', 'Helpful stuff — ')}
            <span style={{ color: SUB0.blue }}>{t('без регистрации.', 'no sign-up.')}</span>
          </H2>
        </div>
        <p style={{ fontSize: 15, color: SUB0.muted, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          {t(
            'Откройте любой инструмент в один клик. Экспорт в ваш аккаунт — по желанию.',
            'Open any tool with one click. Export to your account — if you want.'
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
        {items.map((it, i) => (
          <a key={i} href="#" className="s-card" style={{
            display: 'block', textDecoration: 'none', color: SUB0.ink,
            background: SUB0.bg, border: `1px solid ${SUB0.line}`,
            borderRadius: 12, padding: '24px 24px 22px',
            minHeight: 220, position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted, letterSpacing: '0.06em' }}>{it.tag}</span>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: SUB0.panel, border: `1px solid ${SUB0.line}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: SUB0.ink,
              }}>↗</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 10 }}>{it.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: '#555' }}>{it.sub}</div>
          </a>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '18px 20px',
        background: SUB0.bg, border: `1px dashed ${SUB0.line}`,
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: mono, fontSize: 12, color: SUB0.muted, letterSpacing: '0.06em' }}>
          {t('В базе:', 'In library:')}
        </span>
        {LIBRARY_ITEMS.map(([ch, name, c]) => (
          <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
            <LogoPill char={ch} color={c} size={18} />
            {name}
          </span>
        ))}
        <span style={{ color: SUB0.muted, fontSize: 13, marginLeft: 'auto', fontFamily: mono }}>+1 193 →</span>
      </div>
    </Section>
  )
}
