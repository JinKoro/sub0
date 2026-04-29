'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Section } from '@/shared/components/ui/Section';
import { SectionEyebrow } from '@/shared/components/ui/SectionEyebrow';
import { H2 } from '@/shared/components/ui/H2';

export function PricingFAQ() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(0);

  const qs = [
    {
      q: t('Какие тарифы есть у Sub0?', 'What plans does Sub0 offer?'),
      a: t(
        'У нас три тарифа: Free, Pro и Team. Free — бесплатный навсегда, подходит для знакомства с сервисом. Pro — для активных пользователей. Team — для команд, агентств и компаний с совместным доступом и документами для бухгалтерии.',
        'We have three plans: Free, Pro and Team. Free is free forever and great for getting started. Pro is for active users. Team is for agencies, studios and companies with shared access and accounting documents.',
      ),
    },
    {
      q: t('Что входит в бесплатный тариф?', "What's included in the free plan?"),
      a: t(
        'До 5 подписок, календарь списаний, email-уведомления и базовая аналитика. Этого достаточно, чтобы оценить, как Sub0 экономит ваши деньги и нервы. Без срока действия — пользуйтесь сколько угодно.',
        "Up to 5 subscriptions, a charge calendar, email notifications and basic analytics. That's enough to see how Sub0 saves you money and stress. No expiry — use it as long as you like.",
      ),
    },
    {
      q: t('Чем Pro отличается от Free?', 'How does Pro differ from Free?'),
      a: t(
        'В Pro снят лимит на количество подписок, доступны все каналы уведомлений, полная аналитика, до 2 проектов, экспорт данных в CSV и AI-импорт подписок из выписок до 5 раз в месяц. Подходит, если у вас больше 7 подписок или вы хотите автоматизировать учёт.',
        'Pro removes the subscription limit, unlocks all notification channels, full analytics, up to 2 projects, CSV export and AI import from statements up to 5 times a month. Great if you have more than 7 subscriptions or want to automate tracking.',
      ),
    },
    {
      q: t('Для кого тариф Team?', 'Who is the Team plan for?'),
      a: t(
        'Для агентств, студий и компаний, где большое кол-во подписок и проектов. В Team — совместный доступ к проектам, неограниченное количество проектов, безлимитный AI-импорт, приоритетная поддержка и документы для бухгалтерии.',
        'For agencies, studios and companies managing many subscriptions and projects. Team includes shared project access, unlimited projects, unlimited AI import, priority support and accounting documents.',
      ),
    },
    {
      q: t('Какие способы оплаты поддерживаются?', 'What payment methods do you support?'),
      a: t(
        'Принимаем оплату российскими и зарубежными банковскими картами, СБП, T-pay и SberPay. На тарифе Team возможна оплата по счёту для юридических лиц и ИП с предоставлением закрывающих документов.',
        'We accept Russian and international bank cards, SBP, T-Pay and SberPay. On the Team plan, invoice payment is available for legal entities and sole traders, with closing documents provided.',
      ),
    },
    {
      q: t('Можно ли изменить тариф в любой момент?', 'Can I change my plan at any time?'),
      a: t(
        'Да. При переходе на более высокий тариф новые возможности станут доступны сразу, разница в стоимости пересчитывается за оставшийся период. При переходе на тариф ниже опции, выходящие за его пределы, будут отключены.',
        "Yes. Upgrading takes effect immediately and we prorate the cost difference. Downgrading disables features that exceed the new plan's limits.",
      ),
    },
    {
      q: t(
        'Что произойдёт с моими подписками, если я не продлю Pro?',
        "What happens to my subscriptions if I don't renew Pro?",
      ),
      a: t(
        'Ничего не потеряется. Если у вас больше 5 подписок, мы предложим выбрать, какие останутся активными, остальные будут заархивированы — данные сохранятся, и вы сможете вернуть их при продлении тарифа. Мы заранее напомним о необходимости продления, чтобы вы не пропустили важные события и списания.',
        "Nothing is lost. If you have more than 5 subscriptions, we'll ask which ones stay active — the rest are archived and can be restored when you renew. We'll remind you before your plan expires so you don't miss any important charges.",
      ),
    },
    {
      q: t('Есть ли пробный период у Pro и Team?', 'Is there a trial for Pro and Team?'),
      a: t(
        'Полноценного триала нет — вместо него у нас есть бесплатный тариф Free, на котором можно спокойно познакомиться с сервисом. Если вам нужно протестировать возможности Pro или Team под конкретную задачу, напишите нам, чтобы обсудить индивидуальные условия.',
        "There's no full trial — instead we have a free forever Free plan to get you started. If you need to test Pro or Team features for a specific use case, reach out and we'll discuss individual terms.",
      ),
    },
    {
      q: t(
        'Безопасны ли мои данные о подписках и платежах?',
        'Is my subscription and payment data safe?',
      ),
      a: t(
        'Да. Мы не храним данные ваших банковских карт — оплата проходит через защищённого платёжного провайдера. Информация о подписках хранится в зашифрованном виде, доступ к ней есть только у вас.',
        "Yes. We don't store your card details — payments go through a certified payment provider. Your subscription data is encrypted and only accessible to you.",
      ),
    },
  ];

  return (
    <Section bg={SUB0.bg} pad={isMobile ? '64px 20px' : '120px 48px'}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 360px) 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ position: isMobile ? 'static' : 'sticky', top: 96 }}>
          <SectionEyebrow num="02">FAQ</SectionEyebrow>
          <H2 accent={t('про оплату.', 'about billing.')}>
            {t('Частые вопросы', 'Common questions')}
          </H2>
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
                      background: isOpen ? SUB0.blue : SUB0.panel,
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
