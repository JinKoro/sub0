'use client';

import Link from 'next/link';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { fmtRub } from '@/shared/lib/format';

type Billing = 'month' | 'year';

interface Props {
  billing: Billing;
  setBilling: (b: Billing) => void;
}

interface Feature {
  text: string;
  note?: string;
}

interface Plan {
  id: string;
  name: string;
  tag: string;
  priceMo: number;
  priceYr: number;
  cta: string;
  ctaHref: string;
  ctaStyle: 'primary' | 'ghost';
  featured?: boolean;
  ribbon?: string;
  soon?: boolean;
  feat: Array<string | Feature>;
}

// Anonymous user → /login. Logged-in flow (→ dashboard settings/tariff) lands here later.
const PRIMARY_CTA = '/login';

function BillingToggle({ billing, setBilling }: Props) {
  const { t } = useLang();
  const opts: Array<{ id: Billing; label: string; badge?: string }> = [
    { id: 'month', label: t('Месяц', 'Monthly') },
    { id: 'year', label: t('Год', 'Yearly'), badge: '−30%' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
      <div
        style={{
          display: 'inline-flex',
          padding: 4,
          background: SUB0.panel,
          border: `1px solid ${SUB0.line}`,
          borderRadius: 999,
        }}
      >
        {opts.map((opt) => {
          const active = billing === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setBilling(opt.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: active ? SUB0.ink : 'transparent',
                color: active ? SUB0.bg : SUB0.ink,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .18s ease',
                letterSpacing: '-0.01em',
              }}
            >
              {opt.label}
              {opt.badge && (
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: active ? SUB0.blue : '#e9f0ff',
                    color: active ? '#fff' : SUB0.blue,
                    letterSpacing: '0.04em',
                  }}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PricingPlans({ billing, setBilling }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const yearly = billing === 'year';

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      tag: t('Для личного контроля', 'For personal control'),
      priceMo: 0,
      priceYr: 0,
      cta: t('Начать бесплатно', 'Start free'),
      ctaHref: PRIMARY_CTA,
      ctaStyle: 'ghost',
      feat: [
        t('До 5 подписок', 'Up to 5 subscriptions'),
        t('Календарь списаний', 'Charge calendar'),
        t('Базовые уведомления', 'Basic notifications'),
        t('Базовая аналитика', 'Basic analytics'),
        t('Ручной импорт подписок', 'Manual subscription entry'),
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tag: t('Для активных пользователей', 'For active users'),
      priceMo: 290,
      priceYr: 2490,
      cta: t('Попробовать Pro', 'Try Pro'),
      ctaHref: PRIMARY_CTA,
      ctaStyle: 'primary',
      featured: true,
      ribbon: t('Популярный', 'Most popular'),
      feat: [
        { text: t('Безлимит подписок', 'Unlimited subscriptions') },
        t('Все каналы: Email, Telegram, MAX, push', 'All channels: Email, Telegram, MAX, push'),
        {
          text: t(
            'AI-импорт подписок из писем и банковских выписок',
            'AI import of subscriptions from emails and bank statements',
          ),
        },
        t('Полная аналитика и отчёты', 'Full analytics & reports'),
        t('До 2 проектов', 'Up to 2 projects'),
        t('Экспорт в CSV', 'CSV export'),
      ],
    },
    {
      id: 'team',
      name: 'Team',
      tag: t('Для команд и компаний', 'For teams and companies'),
      priceMo: 1690,
      priceYr: 14990,
      cta: t('Уведомить о запуске', 'Notify me on launch'),
      ctaHref: '#notify',
      ctaStyle: 'ghost',
      soon: true,
      feat: [
        t('Всё из Pro', 'Everything in Pro'),
        t('Совместный доступ для команды', 'Shared team access'),
        t('Неограниченное число проектов', 'Unlimited projects'),
        t('Безлимитный AI-импорт', 'Unlimited AI import'),
        t('Приоритетная поддержка', 'Priority support'),
        t('Закрывающие документы для бухгалтерии', 'Closing documents for accounting'),
      ],
    },
  ];

  function priceDisplay(p: Plan) {
    if (p.soon) return { big: t('Скоро', 'Coming soon'), suffix: '', cad: '' };
    if (p.priceMo === 0)
      return { big: '0', suffix: '₽', cad: t('навсегда', 'forever') };
    if (yearly) {
      return {
        big: fmtRub(p.priceYr, { withUnit: false }),
        suffix: '₽',
        cad: t('/ год', '/ year'),
      };
    }
    return {
      big: fmtRub(p.priceMo, { withUnit: false }),
      suffix: '₽',
      cad: t('/ месяц', '/ month'),
    };
  }

  const isInternal = (href: string) => href.startsWith('/');

  return (
    <section
      style={{
        background: SUB0.bg,
        padding: isMobile ? '0 20px 24px' : '0 48px 32px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <BillingToggle billing={billing} setBilling={setBilling} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
            gap: 16,
          }}
        >
          {plans.map((p) => {
            const pd = priceDisplay(p);
            const dark = !!p.featured;
            const ctaBg =
              p.ctaStyle === 'primary' ? SUB0.blue : dark ? 'transparent' : SUB0.ink;
            const ctaColor = p.ctaStyle === 'primary' ? '#fff' : SUB0.bg;
            const ctaBorder = dark && p.ctaStyle !== 'primary' ? '1px solid #2a2a2a' : 'none';

            return (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  background: dark ? SUB0.ink : SUB0.panel,
                  color: dark ? SUB0.bg : SUB0.ink,
                  border: `1px solid ${dark ? SUB0.ink : SUB0.line}`,
                  borderRadius: 16,
                  padding: isMobile ? '28px 24px' : '32px 30px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                  boxShadow: p.featured ? '0 30px 60px -30px rgba(19,71,255,.35)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {p.ribbon && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: SUB0.blue,
                      color: '#fff',
                      fontFamily: mono,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 999,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.ribbon}
                  </span>
                )}

                <div>
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: dark ? '#9a9a93' : SUB0.muted,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      marginTop: 6,
                      color: dark ? '#cfcfc6' : '#444',
                    }}
                  >
                    {p.tag}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minHeight: 86,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                      style={{
                        fontSize: isMobile ? 44 : 52,
                        fontWeight: 700,
                        letterSpacing: '-0.035em',
                        lineHeight: 1,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {pd.big}
                    </span>
                    {pd.suffix && (
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 600,
                          color: dark ? '#cfcfc6' : '#444',
                        }}
                      >
                        {pd.suffix}
                      </span>
                    )}
                    {pd.cad && (
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 13,
                          color: dark ? '#9a9a93' : SUB0.muted,
                          marginLeft: 4,
                        }}
                      >
                        {pd.cad}
                      </span>
                    )}
                  </div>
                  {p.priceMo > 0 && yearly && !p.soon && (
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 12,
                        color: dark ? '#9a9a93' : SUB0.muted,
                      }}
                    >
                      ~{fmtRub(Math.round(p.priceYr / 12), { short: true })}
                      {t(' в месяц', ' per month')}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: dark ? '#222' : SUB0.line }} />

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {p.feat.map((f, i) => {
                    const isObj = typeof f === 'object';
                    const text = isObj ? f.text : f;
                    const note = isObj ? f.note : null;
                    return (
                      <li
                        key={i}
                        style={{ display: 'flex', gap: 12, fontSize: 14, lineHeight: 1.45 }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            marginTop: 4,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            background: dark ? 'rgba(19,71,255,.2)' : '#e9f0ff',
                            color: SUB0.blue,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div>{text}</div>
                          {note && (
                            <div
                              style={{
                                fontFamily: mono,
                                fontSize: 11,
                                color: dark ? '#8a8a83' : SUB0.muted,
                                marginTop: 2,
                              }}
                            >
                              {note}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {isInternal(p.ctaHref) ? (
                  <Link
                    href={p.ctaHref}
                    className="s-btn"
                    style={{
                      marginTop: 'auto',
                      padding: '14px 18px',
                      borderRadius: 10,
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 600,
                      background: ctaBg,
                      color: ctaColor,
                      border: ctaBorder,
                    }}
                  >
                    {p.cta} →
                  </Link>
                ) : (
                  <a
                    href={p.ctaHref}
                    className="s-btn"
                    style={{
                      marginTop: 'auto',
                      padding: '14px 18px',
                      borderRadius: 10,
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 600,
                      background: ctaBg,
                      color: ctaColor,
                      border: ctaBorder,
                    }}
                  >
                    {p.cta} →
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            justifyContent: 'center',
            fontFamily: mono,
            fontSize: 12,
            color: SUB0.muted,
            letterSpacing: '0.04em',
          }}
        >
          <span>✓ {t('Без привязки карты', 'No card required')}</span>
          <span>✓ {t('Отмена в два клика', 'Cancel in two clicks')}</span>
          <span>✓ {t('Оплата картой или СБП', 'Card or SBP accepted')}</span>
        </div>
      </div>
    </section>
  );
}
