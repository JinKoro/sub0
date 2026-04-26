'use client'

import { SUB0, mono, serif } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { LogoPill } from '@/shared/components/ui/LogoPill'

const TRUSTED = ['Обустройка', 'Точка', 'Пантеон', 'Флагшток', 'Сивилла', 'Чёрная звезда']

export function SocialProof() {
  const { t } = useLang()

  const testimonials = [
    {
      quote: t(
        'Sub0 показал, что я плачу 6 200 ₽ в месяц за подписки. Отменил треть — даже не заметил разницы.',
        'Sub0 showed me I was spending 6,200 ₽/mo on subs. Killed a third and didn\'t notice a thing.'
      ),
      name: 'Анна К.',
      role: t('маркетолог', 'marketer'),
      init: 'А',
      color: SUB0.blue,
    },
    {
      quote: t(
        'Запустили за 10 минут. Парсер писем нашёл подписки, про которые мы забыли ещё в 2023.',
        'Set up in 10 minutes. The inbox parser found subs we\'d forgotten about since 2023.'
      ),
      name: 'Марк С.',
      role: t('founder, 8 человек', 'founder, team of 8'),
      init: 'М',
      color: SUB0.good,
    },
    {
      quote: t(
        'Финальная таблица с кем-что-сколько — ровно то, что я искал. Больше никаких Google Sheets.',
        'The final who-pays-what sheet is exactly what I was after. No more Google Sheets.'
      ),
      name: 'Jules P.',
      role: t('COO, SaaS', 'COO, SaaS'),
      init: 'J',
      color: SUB0.purple,
    },
  ]

  return (
    <Section bg={SUB0.panel} pad="120px 48px">
      <SectionEyebrow num="10">{t('Отзывы', 'Testimonials')}</SectionEyebrow>
      <h2 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 48px', maxWidth: 820 }}>
        {t('Сначала — скепсис.', 'First skeptical.')}<br />
        <span style={{ color: SUB0.blue }}>{t('Потом — спокойствие.', 'Then relaxed.')}</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {testimonials.map((tm, i) => (
          <div key={i} className="s-card" style={{
            background: SUB0.bg, border: `1px solid ${SUB0.line}`, borderRadius: 12,
            padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <div style={{ fontSize: 28, color: SUB0.blue, fontFamily: serif, lineHeight: 1 }}>&ldquo;</div>
            <div style={{ fontSize: 16, lineHeight: 1.5, flex: 1 }}>{tm.quote}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: `1px dashed ${SUB0.line}` }}>
              <LogoPill char={tm.init} color={tm.color} size={32} square={false} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tm.name}</div>
                <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>{tm.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 40, padding: '28px 32px',
        background: SUB0.bg, border: `1px dashed ${SUB0.line}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 13, fontFamily: mono, color: SUB0.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('Им доверяют', 'Trusted by')}
        </div>
        {TRUSTED.map(n => (
          <span key={n} style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: SUB0.ink, opacity: 0.55 }}>
            {n}
          </span>
        ))}
      </div>
    </Section>
  )
}
