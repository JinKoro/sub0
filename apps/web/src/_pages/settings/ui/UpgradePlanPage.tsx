'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { SectionHead } from './parts/SectionHead';
import { sBtnGhost, sBtnPrimary } from './parts/styles';

interface Plan {
  id: 'free' | 'pro' | 'team';
  name: string;
  priceMo: number | null;
  priceYr: number | null;
  featured?: boolean;
  soon?: boolean;
  sub: { ru: string; en: string };
  feat: { ru: string[]; en: string[] };
}

const PLAN_DATA: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMo: 0,
    priceYr: 0,
    sub: { ru: 'Для личного контроля', en: 'For personal control' },
    feat: {
      ru: ['До 5 подписок', 'Email-уведомления', '1 проект', 'Базовая аналитика'],
      en: ['Up to 5 subscriptions', 'Email notifications', '1 project', 'Basic analytics'],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMo: 290,
    priceYr: 2490,
    featured: true,
    sub: { ru: 'Без лимитов и с AI-импортом', en: 'No limits, AI import' },
    feat: {
      ru: [
        'Безлимит подписок',
        'Все каналы уведомлений',
        'До 2 проектов',
        'AI-импорт из писем',
        'Полная аналитика',
        'Экспорт в CSV',
      ],
      en: [
        'Unlimited subscriptions',
        'All notification channels',
        'Up to 2 projects',
        'AI import from emails',
        'Full analytics',
        'CSV export',
      ],
    },
  },
  {
    id: 'team',
    name: 'Team',
    priceMo: null,
    priceYr: null,
    soon: true,
    sub: { ru: 'Для команд и агентств', en: 'For teams and agencies' },
    feat: {
      ru: [
        'Всё из Pro',
        'Совместный доступ',
        'Безлимит проектов',
        'Безлимит AI-импорта',
        'Приоритетная поддержка',
      ],
      en: [
        'Everything in Pro',
        'Shared team access',
        'Unlimited projects',
        'Unlimited AI import',
        'Priority support',
      ],
    },
  },
];

type Billing = 'month' | 'year';
type PaymentMethod = 'sbp' | 'card';

interface Props {
  currentPlan: 'free' | 'pro' | 'team';
  onClose: () => void;
}

export function UpgradePlanPage({ currentPlan, onClose }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState<Billing>('year');
  const yearly = billing === 'year';

  const selectablePlans = PLAN_DATA.filter((p) => p.id !== currentPlan);
  const defaultSelected =
    selectablePlans.find((p) => p.featured && !p.soon)?.id ??
    selectablePlans.find((p) => !p.soon)?.id ??
    'pro';
  const [selectedPlan, setSelectedPlan] = useState<Plan['id']>(defaultSelected);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('sbp');
  const [autopay, setAutopay] = useState(true);

  const plan = PLAN_DATA.find((p) => p.id === selectedPlan);
  const price = plan
    ? yearly
      ? (plan.priceYr ?? 0)
      : (plan.priceMo ?? 0)
    : 0;
  const monthly = plan
    ? yearly
      ? Math.round((plan.priceYr ?? 0) / 12)
      : (plan.priceMo ?? 0)
    : 0;
  const periodLabel = yearly ? t('год', 'year') : t('месяц', 'month');
  const totalLabel = `${price} ₽`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={onClose}
          style={{
            ...sBtnGhost,
            padding: '6px 10px',
            fontFamily: mono,
            fontSize: 12,
          }}
        >
          ← {t('Назад к тарифам', 'Back to plans')}
        </button>
      </div>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? 24 : 30,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {t('Обновить тариф', 'Upgrade plan')}
        </h2>
      </div>

      <SectionHead
        title={t('1. Тариф', '1. Plan')}
        right={
          <div
            style={{
              display: 'inline-flex',
              padding: 3,
              borderRadius: 999,
              background: SUB0.soft,
              border: `1px solid ${SUB0.line}`,
              fontFamily: mono,
            }}
          >
            {(
              [
                { id: 'month', label: t('Помесячно', 'Monthly') },
                { id: 'year', label: t('В год', 'Yearly') },
              ] as { id: Billing; label: string }[]
            ).map((o) => {
              const on = billing === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setBilling(o.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: on ? SUB0.ink : 'transparent',
                    color: on ? SUB0.bg : SUB0.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.04em',
                  }}
                >
                  {o.label}
                  {o.id === 'year' && (
                    <span style={{ marginLeft: 6, opacity: 0.7 }}>−28%</span>
                  )}
                </button>
              );
            })}
          </div>
        }
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `repeat(${selectablePlans.length}, 1fr)`,
          gap: 12,
        }}
      >
        {selectablePlans.map((p) => {
          const sel = selectedPlan === p.id;
          const isSoon = !!p.soon;
          const priceText = isSoon
            ? t('Скоро', 'Soon')
            : p.priceMo === 0
              ? '0 ₽'
              : yearly
                ? `${Math.round((p.priceYr ?? 0) / 12)} ₽`
                : `${p.priceMo} ₽`;
          const priceSub = isSoon
            ? t('в разработке', 'in development')
            : p.priceMo === 0
              ? t('навсегда', 'forever')
              : yearly
                ? t(`в месяц · ${p.priceYr} ₽ в год`, `per month · ${p.priceYr} ₽ / year`)
                : t('в месяц', 'per month');
          return (
            <button
              key={p.id}
              onClick={() => {
                if (!isSoon) setSelectedPlan(p.id);
              }}
              disabled={isSoon}
              style={{
                textAlign: 'left',
                cursor: isSoon ? 'not-allowed' : 'pointer',
                padding: isMobile ? 16 : 18,
                borderRadius: 12,
                border: `2px solid ${sel && !isSoon ? SUB0.ink : SUB0.line}`,
                background: SUB0.panel,
                color: SUB0.ink,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontFamily: 'inherit',
                position: 'relative',
                opacity: isSoon ? 0.7 : 1,
              }}
            >
              {sel && !isSoon && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: SUB0.ink,
                    color: SUB0.bg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
              )}
              {isSoon && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: SUB0.soft,
                    color: SUB0.muted,
                    fontSize: 10,
                    fontFamily: mono,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: `1px solid ${SUB0.line}`,
                  }}
                >
                  {t('Скоро', 'Soon')}
                </span>
              )}
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>
                  {t(p.sub.ru, p.sub.en)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {priceText}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: SUB0.muted,
                    fontFamily: mono,
                    marginTop: 4,
                  }}
                >
                  {priceSub}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {(lang === 'en' ? p.feat.en : p.feat.ru).slice(0, 4).map((f, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
                  >
                    <span
                      style={{
                        color: SUB0.blue,
                        fontFamily: mono,
                        fontWeight: 700,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <SectionHead title={t('2. Способ оплаты', '2. Payment method')} />
      <Card padding={0}>
        {(
          [
            {
              id: 'sbp',
              ru: 'СБП',
              en: 'SBP',
              descRu: 'Оплата через банковское приложение по QR-коду',
              descEn: 'Pay via your bank app by QR',
              badge: '₽',
            },
            {
              id: 'card',
              ru: 'Банковская карта',
              en: 'Bank card',
              descRu: 'MIR, VISA, Mastercard',
              descEn: 'MIR, VISA, Mastercard',
              badge: '▢',
            },
          ] as const
        ).map((m, i, arr) => {
          const sel = payMethod === m.id;
          return (
            <label
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 12 : 14,
                cursor: 'pointer',
                padding: isMobile ? '14px 16px' : '16px 24px',
                flexWrap: 'wrap',
                borderBottom: i < arr.length - 1 ? `1px solid ${SUB0.line2}` : 'none',
                background: sel ? SUB0.soft : 'transparent',
              }}
            >
              <input
                type="radio"
                name="paymethod"
                checked={sel}
                onChange={() => setPayMethod(m.id)}
                style={{ width: 16, height: 16, accentColor: SUB0.ink, margin: 0 }}
              />
              <span
                style={{
                  width: 44,
                  height: 30,
                  borderRadius: 5,
                  background: SUB0.ink,
                  color: SUB0.bg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.04em',
                }}
              >
                {m.badge}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t(m.ru, m.en)}</div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>
                  {t(m.descRu, m.descEn)}
                </div>
              </div>
            </label>
          );
        })}
      </Card>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: 'pointer',
          padding: '14px 16px',
          borderRadius: 10,
          background: SUB0.soft,
          border: `1px solid ${SUB0.line}`,
        }}
      >
        <input
          type="checkbox"
          checked={autopay}
          onChange={(e) => setAutopay(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: SUB0.ink, margin: '2px 0 0 0' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: SUB0.ink }}>
            {t('Сохранить счёт для автоплатежей', 'Save bill for autopay')}
          </div>
          <div
            style={{
              fontSize: 12,
              color: SUB0.muted,
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {t(
              'При продлении будем списывать средства автоматически. Отключить можно в любой момент в настройках.',
              "On renewal we'll charge automatically. You can turn it off any time in settings.",
            )}
          </div>
        </div>
      </label>

      <SectionHead title={t('3. Итог', '3. Summary')} />
      <Card padding={0}>
        <div
          style={{
            padding: isMobile ? '16px 16px' : '20px 24px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: SUB0.muted,
              }}
            >
              <span>{t('Тариф', 'Plan')}</span>
              <span style={{ color: SUB0.ink, fontWeight: 600 }}>
                {plan?.name} · {periodLabel}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: SUB0.muted,
              }}
            >
              <span>{t('В месяц', 'Per month')}</span>
              <span style={{ color: SUB0.ink, fontFamily: mono }}>{monthly} ₽</span>
            </div>
            {yearly && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: SUB0.muted,
                }}
              >
                <span>{t('Скидка за год', 'Yearly discount')}</span>
                <span style={{ color: SUB0.good, fontFamily: mono }}>−28%</span>
              </div>
            )}
            <div style={{ height: 1, background: SUB0.line2, margin: '4px 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
              }}
            >
              <span style={{ fontWeight: 700 }}>{t('К оплате сейчас', 'Pay today')}</span>
              <span style={{ fontFamily: mono, fontWeight: 700 }}>
                {totalLabel}{' '}
                <span style={{ color: SUB0.muted, fontWeight: 500 }}>
                  · {t('за', 'per')} {periodLabel}
                </span>
              </span>
            </div>
          </div>
          <button
            style={{
              ...sBtnPrimary,
              padding: '14px 18px',
              fontSize: 15,
              fontWeight: 700,
              justifySelf: isMobile ? 'stretch' : 'end',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {t('Оплатить', 'Pay')} {totalLabel}
          </button>
        </div>
      </Card>
    </div>
  );
}
