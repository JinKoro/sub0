'use client';

import { useEffect, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { FAQAccordion, FAQItem } from '@/shared/components/ui/FAQAccordion';

interface Section {
  id: string;
  label: string;
  items: FAQItem[];
}

const SUPPORT_EMAIL = 'support@sub0.app';

function ContactCard({ compact }: { compact?: boolean }) {
  const { t } = useLang();
  return (
    <div
      style={{
        padding: compact ? 20 : 24,
        background: SUB0.soft,
        borderRadius: compact ? 12 : 14,
        border: `1px solid ${SUB0.line}`,
      }}
    >
      <div
        style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 600,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {t('Не нашли ответ?', "Didn't find an answer?")}
      </div>
      <p
        style={{
          fontSize: compact ? 13 : 14,
          color: SUB0.muted,
          lineHeight: 1.5,
          margin: '0 0 12px',
        }}
      >
        {t('Напишите нам — ответим в рабочий день.', 'Write to us — we reply within a business day.')}
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="s-a"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: compact ? 13 : 14,
          fontWeight: 500,
          color: SUB0.blue,
          textDecoration: 'none',
          fontFamily: mono,
        }}
      >
        {SUPPORT_EMAIL} →
      </a>
    </div>
  );
}

export function FaqSections() {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const sections: Section[] = [
    {
      id: 'general',
      label: t('Общие вопросы', 'General'),
      items: [
        {
          q: t('Что такое Sub0 и зачем он нужен?', 'What is Sub0 and why do you need it?'),
          a: t(
            'Сервис помогает держать все подписки в одном месте: видеть, за что и когда спишутся деньги, считать общие траты в месяц и год, не пропускать ни одного списания.',
            "A service that keeps all your subscriptions in one place: see what you're paying for and when, calculate your monthly and yearly spending, never miss a charge again.",
          ),
        },
        {
          q: t(
            'Чем вы отличаетесь от таблицы в Excel или заметки в телефоне?',
            'How is it different from a note or Excel spreadsheet?',
          ),
          a: t(
            'Автоматический подсчёт сумм с учётом разных валют и периодичности, календарь списаний, аналитика, уведомления в мессенджерах. AI-парсинг выписок появится в одном из ближайших обновлений.',
            'Automatic sum calculation with multi-currency support, charge calendar, analytics, and messenger notifications. AI-powered receipt parsing comes in a future update.',
          ),
        },
        {
          q: t(
            'Можно ли добавлять не подписки, а ежемесячные траты?',
            'Can I add non-subscription monthly expenses?',
          ),
          a: t(
            'Да, архитектура приложения позволяет добавлять кастомные позиции — абонемент в спортзал, ежегодную покупку домена или аренду сервера.',
            'Yes, the app lets you add custom entries — gym memberships, annual domain renewals, or server rentals.',
          ),
        },
        {
          q: t('Есть ли мобильное приложение?', 'Is there a mobile app?'),
          a: t(
            'Мобильное приложение для iOS и Android находится в активной разработке. Пока сервис доступен через мобильный браузер — интерфейс полностью адаптирован.',
            'A native iOS and Android app is actively in development. For now the service works through a mobile browser — the interface is fully responsive.',
          ),
        },
        {
          q: t(
            'Нужно ли подключать банк или карту для регистрации?',
            'Do I need to connect a bank or card to register?',
          ),
          a: t(
            'Нет. Sub0 не запрашивает доступ к вашим банковским счетам. Вы самостоятельно вносите подписки вручную или через парсинг письма из почты.',
            'No. Sub0 does not request access to your bank accounts. You add subscriptions manually or via email receipt parsing.',
          ),
        },
      ],
    },
    {
      id: 'billing',
      label: t('Тарифы и оплата', 'Billing'),
      items: [
        {
          q: t('Сколько стоит Sub0?', 'How much does Sub0 cost?'),
          a: t(
            'Sub0 работает по модели freemium. Бесплатный план включает до 5 подписок. Pro-план открывает неограниченное количество подписок, аналитику, командный доступ и приоритетную поддержку.',
            'Sub0 is freemium. The free plan supports up to 5 subscriptions. The Pro plan unlocks unlimited subscriptions, analytics, team access, and priority support.',
          ),
        },
        {
          q: t('Как оплатить из России?', 'How to pay from Russia?'),
          a: t(
            'Через СБП или картой российского банка — всё работает в один клик из личного кабинета.',
            'Via SBP or a Russian bank card — one click from your account dashboard.',
          ),
        },
        {
          q: t('Как оплатить из Беларуси?', 'How to pay from Belarus?'),
          a: t(
            'Картой белорусского банка через платёжную платформу bePaid.',
            'Via Belarusian bank card through the bePaid payment platform.',
          ),
        },
        {
          q: t(
            'Что будет с моими данными, если я не продлю Pro?',
            "What happens if I don't renew Pro?",
          ),
          a: t(
            'Ваши подписки не удаляются — они останутся в списке. Вы сможете работать только с тем количеством позиций, которое доступно на Free-плане. Сервис предложит выбрать, какие подписки оставить активными.',
            "Your subscriptions won't be deleted — they stay in your list. You can interact only with the number of entries available on the Free plan. The app will prompt you to choose which ones to keep active.",
          ),
        },
        {
          q: t('Можно ли отменить подписку на Sub0 в любой момент?', 'Can I cancel Sub0 at any time?'),
          a: t(
            'Да, отмена доступна в два клика из настроек аккаунта. Оплаченный период сохраняется до конца срока.',
            'Yes, you can cancel in two clicks from account settings. Your paid period remains active until it expires.',
          ),
        },
      ],
    },
    {
      id: 'security',
      label: t('Безопасность и данные', 'Security & Data'),
      items: [
        {
          q: t(
            'Безопасно ли хранить у вас данные о подписках?',
            'Is it safe to store subscription data with you?',
          ),
          a: t(
            'Мы не подключаемся к вашим банкам и не имеем доступа к деньгам. Вы вносите данные о подписках вручную — мы только считаем и напоминаем. Аккаунт можно удалить в любой момент вместе со всеми данными.',
            "We don't connect to your bank and have no access to your money. You enter your subscription data manually — we just calculate and remind. You can delete your account and all data at any time.",
          ),
        },
        {
          q: t('Как хранятся мои данные?', 'How is my data stored?'),
          a: t(
            'Все данные хранятся на серверах в России, зашифрованы в состоянии покоя (AES-256) и при передаче (TLS 1.3). Доступ к базе имеют только авторизованные системы.',
            'All data is stored on servers in Russia, encrypted at rest (AES-256) and in transit (TLS 1.3). Only authorised systems have database access.',
          ),
        },
        {
          q: t('Можно ли экспортировать свои данные?', 'Can I export my data?'),
          a: t(
            'Да. В настройках аккаунта доступен экспорт всех подписок в CSV. В ближайших обновлениях — экспорт в JSON и PDF-отчёт.',
            'Yes. Account settings offer export of all subscriptions to CSV. JSON export and a PDF report are coming in future updates.',
          ),
        },
        {
          q: t(
            'Вы используете мои данные для рекламы или обучения моделей?',
            'Do you use my data for advertising or model training?',
          ),
          a: t(
            'Нет. Ваши данные используются исключительно для работы сервиса. Мы не продаём данные третьим лицам и не передаём их рекламным системам.',
            'No. Your data is used solely to operate the service. We do not sell it to third parties or share it with advertising systems.',
          ),
        },
        {
          q: t(
            'Что происходит с данными при удалении аккаунта?',
            'What happens to data when I delete my account?',
          ),
          a: t(
            'Все ваши данные — подписки, история, настройки — немедленно помечаются к удалению и полностью стираются в течение 30 дней.',
            'All your data — subscriptions, history, settings — is immediately marked for deletion and fully erased within 30 days.',
          ),
        },
      ],
    },
  ];

  const [activeSection, setActiveSection] = useState<string>('general');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`faq-section-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const handleScroll = () => {
      for (let i = ids.length - 1; i >= 0; i -= 1) {
        const id = ids[i];
        if (!id) continue;
        const el = document.getElementById(`faq-section-${id}`);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
          return;
        }
      }
      const first = ids[0];
      if (first) setActiveSection(first);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      style={{
        background: SUB0.panel,
        borderTop: `1px solid ${SUB0.line}`,
        padding: isMobile ? '40px 20px 80px' : '64px 48px 120px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '220px 1fr',
          gap: isMobile ? 40 : 72,
          alignItems: 'start',
        }}
      >
        {!isMobile && (
          <nav style={{ position: 'sticky', top: 96 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: SUB0.muted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              {t('Разделы', 'Sections')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map((sec) => {
                const active = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      background: active ? SUB0.soft : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? SUB0.ink : SUB0.muted,
                      fontFamily: 'inherit',
                      letterSpacing: '-0.01em',
                      transition: 'all .15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 3,
                        height: 16,
                        borderRadius: 2,
                        background: active ? SUB0.blue : 'transparent',
                        flexShrink: 0,
                        transition: 'background .15s',
                      }}
                    />
                    {sec.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 40 }}>
              <ContactCard compact />
            </div>
          </nav>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {sections.map((sec) => (
            <div key={sec.id} id={`faq-section-${sec.id}`}>
              <h2
                style={{
                  fontSize: isMobile ? 22 : 26,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  margin: '0 0 8px',
                  color: SUB0.ink,
                }}
              >
                {sec.label}
              </h2>
              <FAQAccordion
                items={sec.items}
                questionFontSize={{ mobile: 15, desktop: 17 }}
              />
            </div>
          ))}

          {isMobile && <ContactCard />}
        </div>
      </div>
    </section>
  );
}
