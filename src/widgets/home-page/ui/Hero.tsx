'use client'

import { useState, useEffect } from 'react'
import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { LogoPill } from '@/shared/components/ui/LogoPill'
import { SUBS } from '@/entities/subscription/model/data'
import { fmtRub } from '@/shared/lib/format'

export function Hero() {
  const { t } = useLang()
  const [visibleRows, setVisibleRows] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    let i = 0
    function tick() {
      if (cancelled) return
      if (i <= SUBS.length) {
        setVisibleRows(i)
        setProgress(Math.min(100, Math.round((i / SUBS.length) * 100)))
        i++
        setTimeout(tick, 420)
      } else {
        setTimeout(() => {
          if (cancelled) return
          i = 0
          setVisibleRows(0)
          setProgress(0)
          tick()
        }, 3500)
      }
    }
    tick()
    return () => { cancelled = true }
  }, [])

  const monthlyTotal = SUBS.slice(0, visibleRows).reduce((s, r) => {
    const v = r.cycle === 'yearly' ? r.price / 12 : r.price
    return s + (r.status === 'paused' ? 0 : v)
  }, 0)

  const importChips: [string, string, string][] = [
    ['manual', t('Вручную', 'Manual'),  t('20 сек на запись', '20s per entry')],
    ['file',   t('Файл', 'File'),       'CSV · PDF · JPG'],
    ['email',  t('Почта', 'Inbox'),     t('Парсинг писем', 'Parse emails')],
  ]

  return (
    <section id="top" style={{ padding: '64px 48px 110px', background: SUB0.bg, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${SUB0.line} 1px, transparent 1px), linear-gradient(90deg, ${SUB0.line} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 75%)',
        opacity: 0.4,
      }} />

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(440px, 1fr) minmax(580px, 1.15fr)',
        gap: 72,
        alignItems: 'start',
        maxWidth: 1360,
        margin: '0 auto',
      }}>
        {/* Left */}
        <div style={{ paddingTop: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            border: `1px solid ${SUB0.line}`, background: SUB0.panel,
            fontSize: 12, fontFamily: mono, color: '#333',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: SUB0.blue, animation: 's-pulse 1.6s infinite' }} />
            {t('Бета · Контроль и прозрачность', 'Beta · Control and clarity')}
          </div>

          <h1 style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.01, letterSpacing: '-0.035em', margin: '0 0 24px' }}>
            {t('Контролируй все', 'Keep every')}<br />
            <span style={{ color: SUB0.blue }}>{t('подписки', 'subscription')}</span>
            {t(' в одном', ' in one')}<br />
            {t('месте.', 'place.')}
          </h1>

          <p style={{ fontSize: 19, lineHeight: 1.55, color: '#444', maxWidth: 540, margin: '0 0 36px' }}>
            {t(
              'Сабзиро (Sub0) собирает подписки из писем, файлов или ручного ввода — показывает расходы, напоминает о списаниях и не даёт переплачивать за забытое.',
              'Sub0 pulls subscriptions from your inbox, any file, or manual entry — and shows your spend, reminds you before renewals, and kills the ones you forgot.'
            )}
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <a href="#" className="s-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 24px', background: SUB0.ink, color: SUB0.bg,
              borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: 'none',
            }}>
              {t('Начать бесплатно', 'Start free')} →
            </a>
            <a href="#dashboard" className="s-btn" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '16px 20px', background: 'transparent', color: SUB0.ink,
              border: `1px solid ${SUB0.line}`, borderRadius: 10,
              fontWeight: 500, fontSize: 16, textDecoration: 'none',
            }}>
              {t('Посмотреть демо', 'See live demo')}
            </a>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: SUB0.muted, fontFamily: mono, marginBottom: 36 }}>
            <span>✓ {t('Без привязки карты', 'No card required')}</span>
            <span>✓ {t('Работает с любыми сервисами', 'Works with any service')}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {importChips.map(([k, title, sub]) => (
              <div key={k} style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: SUB0.panel, border: `1px solid ${SUB0.line}`, borderRadius: 10,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: 6, background: SUB0.soft,
                  fontSize: 12, fontWeight: 700, color: SUB0.blue, fontFamily: mono,
                }}>
                  {k === 'manual' ? '01' : k === 'file' ? '02' : '03'}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: live grid */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: SUB0.panel, border: `1px solid ${SUB0.line2}`, borderRadius: 14,
            boxShadow: '0 30px 60px -30px rgba(10,10,10,.18), 0 2px 6px rgba(10,10,10,.04)',
            overflow: 'hidden',
          }}>
            {/* Browser chrome */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderBottom: '1px solid #eee', background: '#f7f5ef',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: 999, background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: 999, background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 11, height: 11, borderRadius: 999, background: '#28c840', display: 'inline-block' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#555', fontFamily: mono }}>sub0.app/dashboard</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: SUB0.blue, fontFamily: mono }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: SUB0.blue, animation: 's-pulse 1.2s infinite', display: 'inline-block' }} />
                {t('Импорт из почты…', 'Parsing inbox…')}
              </div>
            </div>

            {/* Progress */}
            <div style={{ height: 2, background: '#eee' }}>
              <div style={{ height: '100%', background: SUB0.blue, width: `${progress}%`, transition: 'width .35s ease' }} />
            </div>

            {/* Table head */}
            <div style={{
              display: 'flex', gap: 16, padding: '14px 18px', borderBottom: '1px solid #eee',
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: SUB0.muted, fontWeight: 600, fontFamily: mono,
            }}>
              <div style={{ flex: 1.6 }}>{t('Сервис', 'Service')}</div>
              <div style={{ flex: 1.3 }}>{t('Категория', 'Category')}</div>
              <div style={{ flex: 0.9 }}>{t('Цикл', 'Cycle')}</div>
              <div style={{ flex: 1.1 }}>{t('След. списание', 'Next charge')}</div>
              <div style={{ flex: 0.9, textAlign: 'right' }}>{t('Сумма', 'Amount')}</div>
            </div>

            {/* Rows */}
            <div style={{ minHeight: 404 }}>
              {SUBS.map((r, i) => {
                const shown = i < visibleRows
                return (
                  <div key={r.name} style={{
                    display: 'flex', gap: 16, padding: '14px 18px',
                    borderBottom: '1px dashed #eee', alignItems: 'center', fontSize: 14,
                    opacity: shown ? 1 : 0,
                    transform: shown ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity .35s ease, transform .35s ease',
                  }}>
                    <div style={{ flex: 1.6, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                      <LogoPill char={r.char} color={r.color} />
                      {r.name}
                    </div>
                    <div style={{ flex: 1.3, color: '#555' }}>{t(r.cat, r.catEn)}</div>
                    <div style={{ flex: 0.9, color: '#555' }}>{t(r.cycle, r.cycleEn)}</div>
                    <div style={{ flex: 1.1, color: '#555' }}>
                      {r.status === 'paused' ? <s>{t(r.next, r.nextEn)}</s> : t(r.next, r.nextEn)}
                    </div>
                    <div style={{ flex: 0.9, textAlign: 'right', fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                      {fmtRub(r.price)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 32, padding: '16px 20px', borderTop: '1px solid #eee', background: SUB0.bg }}>
              <div>
                <div style={{ fontSize: 11, color: SUB0.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: mono }}>
                  {t('Найдено', 'Found')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{visibleRows}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: SUB0.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: mono }}>
                  {t('Итого в месяц', 'Monthly total')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: SUB0.blue, fontFeatureSettings: '"tnum"' }}>
                  {fmtRub(monthlyTotal)}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: SUB0.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: mono }}>
                  {t('Синхронизировано', 'Synced')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>● live</div>
              </div>
            </div>
          </div>

          {/* Float card */}
          <div style={{
            position: 'absolute', right: -24, bottom: -32,
            background: SUB0.panel, border: `1px solid ${SUB0.line2}`,
            borderRadius: 12, padding: '12px 16px',
            boxShadow: '0 20px 40px -20px rgba(10,10,10,.25)',
            width: 320,
            animation: 's-float 4s ease-in-out infinite',
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: SUB0.blue, marginBottom: 10, fontFamily: mono, fontWeight: 600 }}>
              {t('Найдено в письме', 'Detected in email')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LogoPill char="Я" color="#ffcc00" />
              <div>
                <div style={{ fontWeight: 600 }}>Яндекс Плюс</div>
                <div style={{ color: SUB0.muted, fontSize: 12 }}>
                  noreply@yandex · {t('Списание 2 мая', 'Renews May 2')}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{fmtRub(399)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
