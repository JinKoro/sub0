'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'

export function Resources() {
  const { t } = useLang()

  const cols = [
    {
      title: t('Блог', 'Blog'),
      items: [
        t('Как мы парсим письма без доступа к карте', 'How we parse emails without card access'),
        t('5 сервисов, которые сами продлеваются — осторожно', '5 services that auto-renew — heads up'),
        t('SaaS-стек стартапа из 10 человек', "What a 10-person startup's SaaS stack looks like"),
        t('Дайджест апреля: цены выросли у 23 сервисов', 'April digest: 23 services raised prices'),
      ],
    },
    {
      title: 'FAQ',
      items: [
        t('Это безопасно?', 'Is this safe?'),
        t('Как подключить почту?', 'How do I connect my inbox?'),
        t('Можно ли без импорта?', 'Can I skip the import?'),
        t('Что с офлайн?', 'What about offline?'),
      ],
    },
    {
      title: 'Roadmap',
      items: [
        t('Q2 · Мобильное приложение', 'Q2 · Mobile app'),
        t('Q2 · Telegram-уведомления', 'Q2 · Telegram notifications'),
        t('Q3 · API для бухгалтерии', 'Q3 · Accounting API'),
        t('Q3 · Общие семейные подписки', 'Q3 · Shared family plans'),
      ],
    },
    {
      title: t('Отзывы', 'Reviews'),
      items: [
        t('Все 327 отзывов', 'All 327 reviews'),
        t('По ролям: маркетологи', 'By role: marketers'),
        t('По ролям: фаундеры', 'By role: founders'),
        t('Оставить отзыв', 'Leave a review'),
      ],
    },
  ]

  return (
    <Section bg={SUB0.bg} pad="120px 48px" id="resources">
      <SectionEyebrow num="11">{t('Ресурсы', 'Resources')}</SectionEyebrow>
      <H2>
        {t('Больше контекста ', 'More context ')}
        <span style={{ color: SUB0.blue }}>{t('перед стартом.', 'before you start.')}</span>
      </H2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48 }}>
        {cols.map(c => (
          <div key={c.title} style={{
            background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 12,
            padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: SUB0.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {c.title}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {c.items.map(item => (
                <li key={item}>
                  <a href="#" className="s-a" style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8,
                    textDecoration: 'none', color: SUB0.ink, fontSize: 14, lineHeight: 1.35,
                  }}>
                    <span>{item}</span>
                    <span style={{ color: SUB0.muted }}>→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
