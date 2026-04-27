'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { useIsMobile } from '@/shared/hooks/use-is-mobile'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'

const ITEMS = [
  {
    num: '01',
    ru: 'Забытые подписки',
    en: 'Forgotten subscriptions',
    subRu: 'Пробный период превращается в платный. Карта молча списывает каждый месяц.',
    subEn: 'Free trials turn paid. Your card quietly gets charged every month.',
    metric: '42%',
    metricRu: 'сервисов забыты',
    metricEn: 'of services forgotten',
  },
  {
    num: '02',
    ru: 'Нет единого списка',
    en: 'No single list',
    subRu: 'Подписки — на почте, в блокноте, оплачены через зарубежные или отечественные карты.',
    subEn: 'Subscriptions hide in your inbox, your bank, a sticky note. Never in one place.',
    metric: '6+',
    metricRu: 'мест хранения',
    metricEn: 'places to check',
  },
  {
    num: '03',
    ru: 'Списания — неожиданность',
    en: 'Charges surprise you',
    subRu: 'Списали деньги в неподходящий момент?',
    subEn: 'Charged on payday? Or before it? No one warned you.',
    metric: '45 000 ₽',
    metricRu: 'теряется в год',
    metricEn: 'lost per month',
  },
  {
    num: '04',
    ru: 'Бизнес-расходы в хаосе',
    en: 'SaaS chaos at work',
    subRu: 'Кто платит? Чья карта? Кому принадлежит аккаунт? Вопросы без ответов.',
    subEn: 'Who pays? Whose card? Who owns the seat? Questions without answers.',
    metric: '29',
    metricRu: 'подписок у команды',
    metricEn: 'SaaS tools per team',
  },
]

export function Problem() {
  const { t } = useLang()
  const isMobile = useIsMobile()

  return (
    <Section bg={SUB0.bg} pad={isMobile ? '64px 20px' : '120px 48px 100px'}>
      <SectionEyebrow num="03">{t('Проблема', 'The problem')}</SectionEyebrow>
      <h2 style={{
        fontSize: isMobile ? 32 : 48, fontWeight: 700, lineHeight: 1.05,
        letterSpacing: '-0.03em', margin: '0 0 56px', maxWidth: 820,
      }}>
        {t('Подписки разбросаны —', 'Subscriptions are scattered —')}{' '}
        <span style={{ color: SUB0.blue }}>{t('деньги молча утекают.', 'money leaks out.')}</span>
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 16,
      }}>
        {ITEMS.map(it => (
          <div key={it.num} className="s-card" style={{
            background: SUB0.panel, border: `1px solid ${SUB0.line}`,
            borderRadius: 12, padding: '22px 22px 24px',
            display: 'flex', flexDirection: 'column', gap: 14, minHeight: 240,
          }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: SUB0.muted, letterSpacing: '0.1em' }}>{it.num}</div>
            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {t(it.ru, it.en)}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#555', flex: 1 }}>
              {t(it.subRu, it.subEn)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: 12, borderTop: `1px dashed ${SUB0.line}` }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: SUB0.danger, fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}>
                {it.metric}
              </span>
              <span style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
                {t(it.metricRu, it.metricEn)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
