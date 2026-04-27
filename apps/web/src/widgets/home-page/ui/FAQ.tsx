'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Section } from '@/shared/components/ui/Section';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';

export function FAQ() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(0);

  const qs = [
    {
      q: t('Что такое Sub0 и зачем он нужен?', 'What is Sub0 and why do you need it?'),
      a: t(
        'Сервис помогает держать все подписки в одном месте: видеть, за что и когда спишутся деньги, считать общие траты в месяц и год, не пропускать списания.',
        "A service that keeps all your subscriptions in one place: see what you're paying for and when, calculate your monthly and yearly spending, never miss a charge again.",
      ),
    },
    {
      q: t(
        'Чем вы отличаетесь от заметки в телефоне или таблицы в Excel?',
        'How is it different from a note or Excel spreadsheet?',
      ),
      a: t(
        'Автоматический подсчёт сумм с учётом разных валют и периодичности, календарь списаний, аналитика, уведомления в мессенджерах. AI-парсинг выписок появится в одном из ближайших обновлений.',
        'Automatic sum calculation with multi-currency support, charge calendar, analytics, and messenger notifications. AI-powered receipt parsing comes in a future update.',
      ),
    },
    {
      q: t(
        'Можно ли добавлять не подписки а ежемесячные траты?',
        'Can I add non-subscription monthly expenses?',
      ),
      a: t(
        'Да, архитектура приложения позволяет добавлять кастомные подписки, абонемент в тренажерный зал и ежегодную покупку домена.',
        'Yes, the app lets you add custom subscriptions like gym memberships or annual domain renewals.',
      ),
    },
    {
      q: t(
        'Безопасно ли хранить у вас данные о подписках?',
        'Is it safe to store subscription data with you?',
      ),
      a: t(
        'Мы не подключаемся к вашим банкам и не имеем доступа к деньгам. Вы вносите данные о подписках вручную — мы только считаем и напоминаем. Аккаунт можно удалить в любой момент вместе со всеми данными.',
        "We don't connect to your bank and have no access to your money. You enter your subscription data manually — we just calculate and remind. Delete your account anytime with all data.",
      ),
    },
    {
      q: t(
        'Что будет с моими подписками, если я не продлю Pro?',
        "What happens to my subscriptions if I don't renew Pro?",
      ),
      a: t(
        'Ваши подписки не удаляются, вы их сможете видеть в общем списке подписок. Однако взаимодействие будет происходить только с тем кол-вом подписок, которые доступны в тарифе Free. Вам будет предложено какие подписки оставить активными.',
        "Your subscriptions won't be deleted — they'll stay in your list. However, you'll only interact with the number of subscriptions available on the Free plan. We'll ask which ones to keep active.",
      ),
    },
    {
      q: t('Как оплатить из России?', 'How to pay from Russia?'),
      a: t('Через СБП или картой российского банка.', 'Via SBP or a Russian bank card.'),
    },
    {
      q: t('Как оплатить из Беларуси?', 'How to pay from Belarus?'),
      a: t(
        'Картой белорусского банка через платформу bePaid.',
        'Via Belarusian bank card through the bePaid platform.',
      ),
    },
  ];

  return (
    <Section bg={SUB0.panel} pad={isMobile ? '64px 20px' : '120px 48px'} id="faq">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 360px) 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ position: isMobile ? 'static' : 'sticky', top: 96 }}>
          <SectionEyebrow num="12">FAQ</SectionEyebrow>
          <H2 accent={t('ответы.', 'answered.')}>{t('Честные вопросы,', 'Honest questions,')}</H2>
          <p style={{ fontSize: 15, color: SUB0.muted, marginTop: 20, lineHeight: 1.6 }}>
            {t('Не нашли свой вопрос — напишите на ', "Don't see yours? Email ")}
            <a
              href="mailto:support@sub0.app"
              className="s-a"
              style={{ color: SUB0.blue, textDecoration: 'none', fontWeight: 500 }}
            >
              support@sub0.app
            </a>
            {t(', отвечаем в рабочий день.', ', we reply within a business day.')}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            borderTop: `1px solid ${SUB0.line}`,
          }}
        >
          {qs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: `1px solid ${SUB0.line}` }}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '22px 0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: isMobile ? 15 : 18,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: SUB0.ink,
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 12,
                      color: SUB0.muted,
                      width: 32,
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1 }}>{item.q}</span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: isOpen ? SUB0.blue : SUB0.bg,
                      color: isOpen ? '#fff' : SUB0.ink,
                      border: `1px solid ${SUB0.line}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      transition: 'all .15s',
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? '–' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 0 24px 48px',
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: '#444',
                      maxWidth: 680,
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
