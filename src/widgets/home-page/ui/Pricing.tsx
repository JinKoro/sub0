'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'

export function Pricing() {
  const { t } = useLang()

  const plans = [
    {
      name: 'Free',
      price: '0 ₽',
      cadence: t('/ навсегда', '/ forever'),
      sub: t('Для личного контроля', 'For personal control'),
      cta: t('Начать бесплатно', 'Start free'),
      feat: [
        t('До 15 подписок', 'Up to 15 subscriptions'),
        t('Импорт файл + вручную', 'Import: file + manual'),
        t('Базовые напоминания', 'Basic reminders'),
        t('1 почтовый ящик', '1 inbox'),
      ],
      accent: false,
    },
    {
      name: 'Pro',
      price: '299 ₽',
      cadence: t('/ в месяц', '/ month'),
      sub: t('Полный набор для одного', 'All features, just for you'),
      cta: t('Попробовать Pro', 'Try Pro'),
      feat: [
        t('Безлимит подписок', 'Unlimited subscriptions'),
        t('Импорт из всех почт', 'All inbox providers'),
        t('Аналитика и отчёты', 'Analytics & reports'),
        t('Отмена в 1 клик', 'One-click cancels'),
        t('Прогноз на год', 'Yearly forecast'),
      ],
      accent: true,
    },
    {
      name: 'Team',
      price: '599 ₽',
      cadence: t('/ за пользователя', '/ per seat'),
      sub: t('Для команд и бизнеса', 'For teams and business'),
      cta: t('Связаться', 'Talk to us'),
      feat: [
        t('Всё из Pro', 'Everything in Pro'),
        t('Несколько проектов', 'Multiple projects'),
        t('Приглашение сотрудников', 'Invite teammates'),
        t('Экспорт в бухгалтерию', 'Finance-ready export'),
        t('Приоритетная поддержка', 'Priority support'),
      ],
      accent: false,
    },
  ]

  return (
    <Section bg={SUB0.bg} pad="120px 48px" id="pricing">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 48, flexWrap: 'wrap' }}>
        <div>
          <SectionEyebrow num="09">{t('Тарифы', 'Pricing')}</SectionEyebrow>
          <H2 accent={t('без подвоха.', 'no gimmicks.')}>
            {t('Честные цены —', 'Fair pricing —')}
          </H2>
        </div>
        <a href="#" className="s-btn" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px',
          background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10,
          fontSize: 14, fontWeight: 600, color: SUB0.ink, textDecoration: 'none',
        }}>
          {t('Смотреть все тарифы', 'See all plans')} →
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
        {plans.map(p => (
          <div key={p.name} style={{
            background: p.accent ? SUB0.ink : SUB0.panel,
            color: p.accent ? SUB0.bg : SUB0.ink,
            border: `1px solid ${p.accent ? SUB0.ink : SUB0.line}`,
            borderRadius: 14, padding: '28px 28px 30px',
            display: 'flex', flexDirection: 'column', gap: 20,
            position: 'relative', overflow: 'hidden',
          }}>
            {p.accent && (
              <span style={{
                position: 'absolute', top: 20, right: 20,
                background: SUB0.blue, color: '#fff', fontFamily: mono,
                fontSize: 10, padding: '4px 10px', borderRadius: 999,
                letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
              }}>{t('Популярный', 'Popular')}</span>
            )}
            <div>
              <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.accent ? '#999' : SUB0.muted }}>
                {p.name}
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em' }}>{p.price}</span>
                <span style={{ fontSize: 13, color: p.accent ? '#999' : SUB0.muted, fontFamily: mono }}>{p.cadence}</span>
              </div>
              <div style={{ fontSize: 14, color: p.accent ? '#cfcfc6' : '#555', marginTop: 6 }}>{p.sub}</div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.feat.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                  <span style={{ color: SUB0.blue, fontWeight: 700, fontFamily: mono }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a href="#" className="s-btn" style={{
              marginTop: 'auto', padding: '14px 18px', borderRadius: 10,
              background: p.accent ? SUB0.blue : SUB0.ink,
              color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'center',
              textDecoration: 'none', display: 'block',
            }}>
              {p.cta} →
            </a>
          </div>
        ))}
      </div>
    </Section>
  )
}
