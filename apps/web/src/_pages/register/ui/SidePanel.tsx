'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { mono, serif } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'

const TILES = [
  { char: 'Я', color: '#ffcc00', name: 'Яндекс Плюс', price: '399 ₽', days:  6 },
  { char: 'N', color: '#c94a1c', name: 'Netflix',     price: '799 ₽', days:  2 },
  { char: 'S', color: '#0a7a3f', name: 'Spotify',     price: '299 ₽', days: 15 },
  { char: 'T', color: '#1347ff', name: 'Telegram',    price: '349 ₽', days:  7 },
  { char: 'V', color: '#1347ff', name: 'VK Музыка',   price: '199 ₽', days: 18 },
  { char: 'O', color: '#6b21d9', name: 'Okko',        price: '499 ₽', days: 16 },
]

const UPCOMING = [
  { name: 'Netflix',     date: '28 апр', dateEn: 'Apr 28', price: '799 ₽', urgent: true  },
  { name: 'Яндекс Плюс', date: '02 мая', dateEn: 'May 02', price: '399 ₽', urgent: false },
  { name: 'Telegram',    date: '03 мая', dateEn: 'May 03', price: '349 ₽', urgent: false },
]

export function SidePanel() {
  const { t } = useLang()
  const [qi, setQi] = useState(0)

  const QUOTES = [
    {
      ru: 'Большинство людей не понимают, сколько они тратят на подписки, пока не видят это в одном месте.',
      en: "Most people don't realise how much they spend on subscriptions until they see it in one place.",
      attrRu: 'Sub0, внутреннее исследование',
      attrEn: 'Sub0, internal research',
    },
    {
      ru: 'Контроль над деньгами начинается с осознания: что именно ты оплачиваешь каждый месяц.',
      en: 'Control over money starts with awareness: what exactly you pay for every month.',
      attrRu: 'Принцип разумных финансов',
      attrEn: 'A principle of mindful finance',
    },
    {
      ru: 'Одна строчка в выписке — это не просто 299 рублей. Это 3 588 рублей в год.',
      en: "One line on a statement isn't just 299 ₽. It's 3,588 ₽ per year.",
      attrRu: 'Sub0, математика подписок',
      attrEn: 'Sub0, subscription math',
    },
  ]

  useEffect(() => {
    setQi(Math.floor(Math.random() * QUOTES.length))
  }, [QUOTES.length])

  const q = QUOTES[qi] ?? QUOTES[0]!

  return (
    <div style={{
      position: 'relative', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '32px 40px', minHeight: '100%', overflow: 'hidden',
    }}>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', color: '#fafaf7',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 6, background: '#fafaf7', color: '#0a0a0a',
          fontSize: 13, fontWeight: 800,
        }}>▚</span>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>Sub0</span>
      </Link>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
        <div style={{ width: '100%' }}>
          <div style={{
            background: '#161616', border: '1px solid #2a2a2a',
            borderRadius: 16, overflow: 'hidden', marginBottom: 16,
          }}>
            <div style={{
              padding: '14px 18px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{
                fontFamily: mono, fontSize: 11, color: '#555',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{t('Подписки', 'Subscriptions')}</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: '#333' }}>
                {t('6 активных', '6 active')}
              </span>
            </div>
            {TILES.map((tile, i) => (
              <div key={tile.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 18px',
                borderTop: '1px solid #1a1a1a',
                animation: `auth-fade-slide .35s ease ${i * 0.06}s both`,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: tile.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                }}>{tile.char}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#bbb', fontWeight: 500 }}>{tile.name}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#555', marginRight: 10 }}>{tile.price}</span>
                <span style={{
                  fontFamily: mono, fontSize: 10,
                  color: tile.days <= 3 ? '#c94a1c' : '#3a3a3a',
                  background: tile.days <= 3 ? '#c94a1c18' : '#1e1e1e',
                  padding: '2px 7px', borderRadius: 4,
                  border: `1px solid ${tile.days <= 3 ? '#c94a1c33' : '#2a2a2a'}`,
                }}>
                  {tile.days}{t('д', 'd')}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            background: '#161616', border: '1px solid #2a2a2a',
            borderRadius: 16, padding: '14px 18px',
          }}>
            <div style={{
              fontFamily: mono, fontSize: 11, color: '#555',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
            }}>
              {t('Ближайшие списания', 'Upcoming charges')}
            </div>
            {UPCOMING.map((p, i) => (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: i < UPCOMING.length - 1 ? 8 : 0,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: p.urgent ? '#c94a1c' : '#2a2a2a',
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 13, color: '#888' }}>{p.name}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#444' }}>{t(p.date, p.dateEn)}</span>
                <span style={{
                  fontFamily: mono, fontSize: 11,
                  color: p.urgent ? '#c94a1c' : '#555',
                  minWidth: 52, textAlign: 'right',
                }}>{p.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 24 }}>
        <p style={{
          fontFamily: serif, fontStyle: 'italic',
          fontSize: 15, lineHeight: 1.5, letterSpacing: '-0.005em',
          color: '#666', marginBottom: 8,
        }}>
          &ldquo;{t(q.ru, q.en)}&rdquo;
        </p>
        <p style={{ fontFamily: mono, fontSize: 10, color: '#333', letterSpacing: '0.04em'}}>
          {t(q.attrRu, q.attrEn)}
        </p>
      </div>

      <style>{`
        @keyframes auth-fade-slide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
