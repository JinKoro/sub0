'use client'

import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'
import { LogoPill } from '@/shared/components/ui/LogoPill'
import { SUBS } from '@/entities/subscription/model/data'
import { fmtRub } from '@/shared/lib/format'

const MONTHS = ['ноя', 'дек', 'янв', 'фев', 'мар', 'апр']
const SPEND = [4100, 4800, 4500, 5400, 5100, 6200]
const MAX_SPEND = Math.max(...SPEND)

const CALENDAR = [
  { day: 28, label: 'СберПрайм',       amt:  299, color: SUB0.good },
  { day:  2, label: 'Яндекс Плюс',     amt:  399, color: '#ffcc00' },
  { day:  3, label: 'Telegram Premium', amt:  349, color: SUB0.blue },
  { day:  7, label: 'Selectel',         amt: 1290, color: SUB0.danger },
  { day: 11, label: 'Spotify',          amt:  299, color: SUB0.good },
  { day: 14, label: 'VK Музыка',        amt:  199, color: SUB0.blue },
]

export function DashboardPreview() {
  const { t } = useLang()

  const cats = [
    [t('Видео', 'Video'),          39, SUB0.blue]   as [string, number, string],
    [t('Продуктивность', 'Productivity'), 58, SUB0.ink]    as [string, number, string],
    [t('Хранилище', 'Storage'),    12, SUB0.good]   as [string, number, string],
    [t('Спорт', 'Fitness'),        39, SUB0.danger] as [string, number, string],
    [t('Образование', 'Education'),32, SUB0.purple] as [string, number, string],
    [t('Другое', 'Other'),         34, SUB0.warn]   as [string, number, string],
  ]
  const catTotal = cats.reduce((s, c) => s + c[1], 0)

  const kpi = [
    [t('Подписок', 'Subscriptions'), '9',       '+2 ' + t('за месяц', 'this month'), false],
    [t('В месяц',  'Per month'),     '6 200 ₽', t('+1 100 ₽ к прошлому', '+1,100 ₽ vs last'), false],
    [t('В год',    'Per year'),      '74 400 ₽', t('прогноз', 'forecast'), false],
    [t('На отмену','Suggest cancel'),'2',        t('триалов заканчивается', 'trials ending'), true],
  ]

  const dashTabs = [
    t('Обзор', 'Overview'),
    t('Подписки', 'Subscriptions'),
    t('Календарь', 'Calendar'),
    t('Команда', 'Team'),
    t('Настройки', 'Settings'),
  ]

  return (
    <Section bg={SUB0.panel} pad="120px 48px" id="dashboard">
      <SectionEyebrow num="08">{t('Превью дашборда', 'Dashboard preview')}</SectionEyebrow>
      <H2 accent={t('на одном экране.', 'on one screen.')}>
        {t('Всё под контролем —', 'Everything under control —')}
      </H2>

      <div style={{
        marginTop: 48, background: SUB0.bg, border: `1px solid ${SUB0.line}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 40px 80px -50px rgba(10,10,10,.25)',
      }}>
        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 20px', borderBottom: `1px solid ${SUB0.line}`, background: SUB0.panel,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 5, background: SUB0.ink, color: SUB0.bg,
            fontSize: 12, fontWeight: 800,
          }}>▚</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Sub0</span>
          <span style={{ color: SUB0.line, fontFamily: mono }}>/</span>
          <span style={{ fontSize: 13, color: SUB0.muted, fontFamily: mono }}>{t('Мои подписки', 'My subscriptions')}</span>
          <div style={{ flex: 1 }} />
          {dashTabs.map((l, i) => (
            <span key={l} style={{
              fontSize: 13, padding: '6px 10px', borderRadius: 6,
              background: i === 0 ? SUB0.soft : 'transparent',
              color: i === 0 ? SUB0.ink : SUB0.muted,
              fontWeight: i === 0 ? 600 : 500,
            }}>{l}</span>
          ))}
          <div style={{
            marginLeft: 12, width: 28, height: 28, borderRadius: 999,
            background: SUB0.blue, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12,
          }}>A</div>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 1, background: SUB0.line }}>
          {/* Left */}
          <div style={{ background: SUB0.bg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {kpi.map(([l, v, s, danger]) => (
                <div key={String(l)} style={{
                  background: SUB0.panel, border: `1px solid ${SUB0.line}`,
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em', color: danger ? SUB0.danger : SUB0.ink }}>{v}</div>
                  <div style={{ fontSize: 11, color: SUB0.muted, marginTop: 4, fontFamily: mono }}>{s}</div>
                </div>
              ))}
            </div>

            {/* Spend chart */}
            <div style={{ background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10, padding: '20px 20px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t('Расходы по месяцам', 'Monthly spend')}</div>
                <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>last 6 mo</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
                {SPEND.map((v, i) => {
                  const h = Math.round((v / MAX_SPEND) * 100)
                  const current = i === SPEND.length - 1
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 11, fontFamily: mono, color: current ? SUB0.blue : SUB0.muted }}>
                        {fmtRub(v, { short: true })}
                      </div>
                      <div style={{
                        width: '100%', height: `${h}%`,
                        background: current ? SUB0.blue : SUB0.ink,
                        opacity: current ? 1 : 0.12,
                        borderRadius: '4px 4px 0 0',
                      }} />
                      <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono }}>{MONTHS[i]}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mini table */}
            <div style={{ background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                display: 'flex', padding: '12px 16px', borderBottom: `1px solid ${SUB0.line}`,
                fontSize: 11, fontFamily: mono, color: SUB0.muted,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                <div style={{ flex: 1.6 }}>{t('Сервис', 'Service')}</div>
                <div style={{ flex: 0.9 }}>{t('Цикл', 'Cycle')}</div>
                <div style={{ flex: 1.1 }}>{t('Списание', 'Renews')}</div>
                <div style={{ flex: 0.7, textAlign: 'right' }}>₽</div>
              </div>
              {SUBS.slice(0, 5).map(r => (
                <div key={r.name} style={{
                  display: 'flex', padding: '10px 16px',
                  borderBottom: `1px solid ${SUB0.line2}`, alignItems: 'center', fontSize: 13,
                }}>
                  <div style={{ flex: 1.6, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                    <LogoPill char={r.char} color={r.color} size={20} />
                    {r.name}
                  </div>
                  <div style={{ flex: 0.9, color: SUB0.muted }}>{t(r.cycle, r.cycleEn)}</div>
                  <div style={{ flex: 1.1, color: SUB0.muted }}>{t(r.next, r.nextEn)}</div>
                  <div style={{ flex: 0.7, textAlign: 'right', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                    {fmtRub(r.price, { short: true })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ background: SUB0.bg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Categories */}
            <div style={{ background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{t('По категориям', 'By category')}</div>
              <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                {cats.map(([name, v, c]) => (
                  <div key={name} style={{ flex: v, background: c }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {cats.map(([name, v, c]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                    <span style={{ flex: 1 }}>{name}</span>
                    <span style={{ fontFamily: mono, color: SUB0.muted }}>{Math.round((v / catTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div style={{ background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10, padding: 20, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t('Календарь списаний', 'Renewal calendar')}</div>
                <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>{t('Май 2026', 'May 2026')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontFamily: mono, fontSize: 11, color: SUB0.muted, marginBottom: 4 }}>
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                  <div key={d} style={{ textAlign: 'center', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - 2
                  const e = CALENDAR.find(c => c.day === day)
                  const valid = day > 0 && day <= 31
                  return (
                    <div key={i} style={{
                      aspectRatio: '1 / 1',
                      background: e ? e.color : (valid ? SUB0.bg : 'transparent'),
                      color: e ? '#fff' : SUB0.ink,
                      borderRadius: 6,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', justifyContent: 'space-between',
                      padding: '4px 6px', fontSize: 11, fontWeight: 600,
                      fontFamily: mono, opacity: valid ? 1 : 0.25,
                    }}>
                      <span>{valid ? day : ''}</span>
                      {e && <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fmtRub(e.amt, { short: true })}
                      </span>}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${SUB0.line}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CALENDAR.slice(0, 3).map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4, background: c.color, color: '#fff',
                      fontFamily: mono, fontSize: 10, fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{c.day}</span>
                    <span style={{ fontWeight: 600, flex: 1 }}>{c.label}</span>
                    <span style={{ color: SUB0.muted, fontFamily: mono }}>{fmtRub(c.amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
