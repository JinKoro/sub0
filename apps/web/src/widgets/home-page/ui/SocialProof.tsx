'use client'

import { SUB0, mono, serif } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { useIsMobile } from '@/shared/hooks/use-is-mobile'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'
import { LogoPill } from '@/shared/components/ui/LogoPill'

export function SocialProof() {
  const { t } = useLang()
  const isMobile = useIsMobile()

  const testimonials = [
    {
      quote: t(
        'Sub0 показал, что я плачу 6 200 ₽ в месяц за подписки и даже не замечала. Отменила треть — забытых подписок.',
        "Sub0 showed me I was spending 6,200 ₽/mo on subs. Killed a third and didn't notice a thing."
      ),
      name: 'Анна К.',
      role: t('маркетолог', 'marketer'),
      init: 'А',
      color: SUB0.blue,
    },
    {
      quote: t(
        'Запустили за 10 минут. Обработчик писем нашёл подписки, про которые мы забыли ещё в 2023.',
        "Set up in 10 minutes. The inbox parser found subs we'd forgotten about since 2023."
      ),
      name: 'Марк С.',
      role: t('Предприниматель', 'founder, team of 8'),
      init: 'М',
      color: SUB0.good,
    },
    {
      quote: t(
        'Дашборд с подписками — ровно то, что я искал. Больше никаких Google Sheets.',
        'The final who-pays-what sheet is exactly what I was after. No more Google Sheets.'
      ),
      name: 'Jules P.',
      role: t('COO', 'COO'),
      init: 'J',
      color: SUB0.purple,
    },
  ]

  return (
    <Section bg={SUB0.panel} pad={isMobile ? '64px 20px' : '120px 48px'}>
      <SectionEyebrow num="10">{t('Отзывы', 'Testimonials')}</SectionEyebrow>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <H2>
          <span style={{ color: SUB0.blue }}>{t('Нам доверяют.', 'They trust us.')}</span>
        </H2>
        <a href="#" className="s-a" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          borderRadius: 8, background: SUB0.ink, color: SUB0.bg, textDecoration: 'none',
          fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {t('Оставить отзыв', 'Leave a review')} →
        </a>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 16, marginTop: 48,
      }}>
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
    </Section>
  )
}
