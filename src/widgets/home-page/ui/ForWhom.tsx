'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'

export function ForWhom() {
  const { t } = useLang()

  const personalFeatures = [
    t('Импорт из личной почты', 'Import from personal inbox'),
    t('Напоминания о пробниках', 'Trial-ending reminders'),
    t('Отмена в один клик через партнёров', 'One-click cancel via partners'),
  ]

  const businessFeatures = [
    t('Рабочие области с ролями', 'Workspaces with roles'),
    t('Owner, плательщик, пользователи', 'Owner, payer, seats'),
    t('Отчёты и экспорт в бухгалтерию', 'Finance-ready reports'),
  ]

  return (
    <Section bg={SUB0.bg} pad="120px 48px">
      <SectionEyebrow num="07">{t('Для кого', "Who it's for")}</SectionEyebrow>
      <H2 accent={t('для бизнеса.', 'one for teams.')}>
        {t('Один Sub0 для себя —', 'One Sub0 for you —')}
      </H2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 56 }}>
        {/* Personal */}
        <div style={{
          background: SUB0.panel, border: `1px solid ${SUB0.line}`,
          borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 380,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: SUB0.ink, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>◐</div>
            <div>
              <div style={{ fontSize: 13, color: SUB0.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Personal
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {t('Пользователь', 'You, at home')}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: '#444', margin: 0 }}>
            {t(
              'Контролируйте личные подписки — от стримингов до фитнеса. Видите, куда утекают $41 в месяц.',
              'Track your personal subscriptions — streaming, music, fitness. Find out where that $41/mo goes.'
            )}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {personalFeatures.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: SUB0.blue, fontWeight: 700, fontFamily: mono }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>$0</span>
            <span style={{ color: SUB0.muted, fontFamily: mono, fontSize: 13 }}>
              {t('бесплатно навсегда', 'free forever')}
            </span>
          </div>
        </div>

        {/* Business */}
        <div style={{
          background: SUB0.ink, color: SUB0.bg,
          borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', gap: 20,
          minHeight: 380, position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(19,71,255,.35), transparent 50%)',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: SUB0.blue, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>◈</div>
            <div>
              <div style={{ fontSize: 13, color: '#aaa', fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Business
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {t('Команда и компания', 'Teams & businesses')}
              </div>
            </div>
          </div>
          <p style={{ position: 'relative', fontSize: 15, lineHeight: 1.55, color: '#cfcfc6', margin: 0 }}>
            {t(
              'Sub0 показывает весь SaaS-стек: кто платит, у кого доступ, когда продление. Без таблиц в Google Sheets.',
              'Sub0 surfaces your full SaaS stack: who pays, who has access, when to renew. No more Google Sheets.'
            )}
          </p>
          <ul style={{ position: 'relative', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {businessFeatures.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#e6e6df' }}>
                <span style={{ color: SUB0.blue, fontWeight: 700, fontFamily: mono }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div style={{ position: 'relative', marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>$8</span>
            <span style={{ color: '#999', fontFamily: mono, fontSize: 13 }}>
              {t('за пользователя / месяц', 'per seat / month')}
            </span>
          </div>
        </div>
      </div>
    </Section>
  )
}
