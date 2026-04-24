'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'

const STEPS = [
  {
    num: '01',
    ru: 'Добавьте подписки',
    en: 'Add subscriptions',
    subRu: 'Вручную, файлом (CSV/PDF/XLS) или из почты — Sub0 распарсит чеки и списания.',
    subEn: 'Manually, by file (CSV/PDF/XLS), or from your inbox — Sub0 parses receipts and renewals.',
  },
  {
    num: '02',
    ru: 'Подтвердите список',
    en: 'Confirm the list',
    subRu: 'Отметьте, что отслеживать. Укажите цикл и категорию. Триал помечен автоматически.',
    subEn: 'Pick what to track. Set cycle and category. Trials are flagged automatically.',
  },
  {
    num: '03',
    ru: 'Контролируйте расходы',
    en: 'Stay in control',
    subRu: 'Пуши до списания, месячные отчёты, отмены в один клик — когда сервис больше не нужен.',
    subEn: 'Renewal pushes, monthly reports, one-click cancels when a service stops paying off.',
  },
]

export function HowItWorks() {
  const { t } = useLang()

  return (
    <Section bg={SUB0.bg} pad="120px 48px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
        <div>
          <SectionEyebrow num="05">{t('Как это работает', 'How it works')}</SectionEyebrow>
          <H2>
            {t('Начать проще,', 'Easier to start')}<br />
            {t('чем ', 'than cancel a ')}
            <span style={{ color: SUB0.blue }}>{t('отменить подписку.', 'subscription.')}</span>
          </H2>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        marginTop: 56, border: `1px solid ${SUB0.line}`, borderRadius: 14,
        overflow: 'hidden', background: SUB0.panel,
      }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{
            padding: '40px 32px 36px',
            borderRight: i < STEPS.length - 1 ? `1px solid ${SUB0.line}` : 'none',
            position: 'relative',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 10,
              background: i === 2 ? SUB0.blue : SUB0.ink,
              color: '#fff', fontFamily: mono, fontWeight: 700, fontSize: 16,
              marginBottom: 24,
            }}>{s.num}</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 12 }}>
              {t(s.ru, s.en)}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: '#555' }}>
              {t(s.subRu, s.subEn)}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                position: 'absolute', right: -8, top: 60,
                width: 16, height: 16, borderRadius: 999, background: SUB0.bg,
                border: `1px solid ${SUB0.line}`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: SUB0.muted,
              }}>→</div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}
