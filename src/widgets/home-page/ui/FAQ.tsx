'use client'

import { useState } from 'react'
import { SUB0, mono } from '@/shared/constants/tokens'
import { useLang } from '@/shared/contexts/lang-context'
import { Section } from '@/shared/components/ui/Section'
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow'
import { H2 } from '@/shared/components/ui/H2'

export function FAQ() {
  const { t } = useLang()
  const [open, setOpen] = useState(0)

  const qs = [
    {
      q: t('Это безопасно? Вы получаете доступ к карте?', 'Is this safe? Do you get card access?'),
      a: t(
        'Нет. Sub0 читает только заголовки писем и чеки. Доступ к банку и карте не нужен и не запрашивается.',
        'No. Sub0 reads only email subjects and receipts. Bank and card access is not required and never requested.'
      ),
    },
    {
      q: t('Как добавлять подписки?', 'How do I add subscriptions?'),
      a: t(
        'Тремя способами: руками за 20 секунд, файлом (CSV/PDF/XLS/OFX), или подключив почту — парсер найдёт чеки сам.',
        'Three ways: by hand in 20 seconds, by file (CSV/PDF/XLS/OFX), or by connecting your inbox — the parser finds receipts itself.'
      ),
    },
    {
      q: t('Есть ли интеграции с бухгалтерией?', 'Any accounting integrations?'),
      a: t(
        'Да: экспорт в XLS/CSV/OFX, API (в Pro/Team), шаблоны для 1С и QuickBooks.',
        'Yes: XLS/CSV/OFX export, an API on Pro/Team, and ready templates for QuickBooks and 1C.'
      ),
    },
    {
      q: t('Работает ли с семейными и общими подписками?', 'Does it work with family and shared subs?'),
      a: t(
        'Да. Можно указать участников и пропорции. Shared plans — отдельная ветка в roadmap, Q3.',
        'Yes. You can list members and split shares. Full shared plans ship in Q3 — see the roadmap.'
      ),
    },
    {
      q: t('Что если я не хочу подключать почту?', "What if I don't want to connect my inbox?"),
      a: t(
        'Ничего страшного. Импорт из файла и ручной ввод покрывают всё. Почту можно подключить позже или никогда.',
        'Totally fine. File import and manual entry cover everything. You can connect inbox later, or never.'
      ),
    },
    {
      q: t('Можно отменить подписку через Sub0?', 'Can I cancel subscriptions through Sub0?'),
      a: t(
        'Для 400+ сервисов — в один клик через наших партнёров. Для остальных Sub0 даёт прямую ссылку на страницу отмены.',
        'For 400+ services — one-click via our partners. For the rest, Sub0 gives you a direct link to the cancel page.'
      ),
    },
  ]

  return (
    <Section bg={SUB0.panel} pad="120px 48px">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 64, alignItems: 'flex-start' }}>
        <div style={{ position: 'sticky', top: 96 }}>
          <SectionEyebrow num="12">FAQ</SectionEyebrow>
          <H2 accent={t('ответы.', 'answered.')}>
            {t('Честные вопросы,', 'Honest questions,')}
          </H2>
          <p style={{ fontSize: 15, color: SUB0.muted, marginTop: 20, lineHeight: 1.6 }}>
            {t(
              'Не нашли свой — напишите на support@sub0.app, отвечаем в рабочий день.',
              "Don't see yours? Email support@sub0.app, we reply within a business day."
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1px solid ${SUB0.line}` }}>
          {qs.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderBottom: `1px solid ${SUB0.line}` }}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    padding: '22px 0', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 16,
                    fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em',
                    color: SUB0.ink, fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontFamily: mono, fontSize: 12, color: SUB0.muted, width: 32 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1 }}>{item.q}</span>
                  <span style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: isOpen ? SUB0.blue : SUB0.bg,
                    color: isOpen ? '#fff' : SUB0.ink,
                    border: `1px solid ${SUB0.line}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, transition: 'all .15s',
                  }}>{isOpen ? '–' : '+'}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 0 24px 48px', fontSize: 15, lineHeight: 1.6, color: '#444', maxWidth: 680 }}>
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
