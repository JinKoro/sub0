'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SubscriptionDto } from '@subzero/shared';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { useCategories } from '@/shared/contexts/categories-context';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import {
  activePromoAmount,
  chargeRub,
  isLive,
  subChar,
} from '@/shared/contexts/subscriptions-context';
import { monthShort } from '@/shared/constants/cabinet';
import { useFormatRub } from '../lib/format';

const PAGE_SIZE = 5;
const WINDOW_DAYS = 30;

interface Props {
  subs: SubscriptionDto[];
}

interface Row {
  sub: SubscriptionDto;
  date: Date;
  amountRub: number;
  hasPromo: boolean;
}

export function UpcomingChargesCard({ subs }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const fmt = useFormatRub();
  const { rates } = useExchangeRates();
  const { bySku } = useCategories();
  const [page, setPage] = useState(0);

  const upcoming = useMemo<Row[]>(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(now.getDate() + WINDOW_DAYS);
    const rows: Row[] = [];
    for (const s of subs) {
      if (!isLive(s)) continue;
      const d = new Date(s.nextBillingDate);
      if (Number.isNaN(d.getTime())) continue;
      if (d > horizon) continue;
      const promo = activePromoAmount(s, now);
      rows.push({
        sub: s,
        date: d,
        amountRub: chargeRub(s, rates, now),
        hasPromo: promo !== null,
      });
    }
    rows.sort((a, b) => a.date.getTime() - b.date.getTime());
    return rows;
  }, [subs, rates]);

  const totalPages = Math.ceil(upcoming.length / PAGE_SIZE);
  const pageItems = upcoming.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const safePage = Math.min(page + 1, Math.max(totalPages, 1));

  return (
    <Card padding={0}>
      <div
        style={{
          padding: '18px 20px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${SUB0.line}`,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {t('Ближайшие списания', 'Upcoming charges')}
        </div>
        <Pill>{t('на 30 дней', 'next 30 days')}</Pill>
      </div>
      {upcoming.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: SUB0.muted, fontSize: 13 }}>
          {t('Нет списаний в ближайшие 30 дней', 'No charges in the next 30 days')}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              padding: '10px 20px',
              fontSize: 11,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: `1px solid ${SUB0.line2}`,
            }}
          >
            <div style={{ flex: 1.6 }}>{t('Сервис', 'Service')}</div>
            {!isMobile && <div style={{ flex: 1 }}>{t('Категория', 'Category')}</div>}
            <div style={{ flex: 0.9 }}>{t('Дата', 'Date')}</div>
            <div style={{ flex: 0.7, textAlign: 'right' }}>{t('Сумма', 'Amount')}</div>
          </div>
          <div>
            {pageItems.map((r) => {
              const meta = bySku(r.sub.categorySku);
              return (
                <Link
                  key={r.sub.sku}
                  href={`/account/subscriptions/${r.sub.sku}`}
                  style={{
                    display: 'flex',
                    padding: '12px 20px',
                    borderBottom: `1px solid ${SUB0.line2}`,
                    alignItems: 'center',
                    fontSize: 14,
                    textDecoration: 'none',
                    color: SUB0.ink,
                    transition: 'background .12s',
                  }}
                >
                  <div
                    style={{
                      flex: 1.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <LogoPill
                      char={subChar(r.sub)}
                      color={r.sub.color ?? SUB0.muted}
                      icon={r.sub.icon}
                      size={28}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {r.sub.name}
                      </div>
                      {r.sub.isTrial && (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: SUB0.danger,
                            background: '#fdecea',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {t('ПРОБНЫЙ', 'TRIAL')}
                        </span>
                      )}
                      {!r.sub.isTrial && r.hasPromo && (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: SUB0.warn,
                            background: '#fff3d6',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {t('ПРОМО', 'PROMO')}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isMobile && (
                    <div style={{ flex: 1, color: SUB0.muted, fontSize: 13 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: meta?.color ?? SUB0.muted,
                          }}
                        />
                        {meta ? (lang === 'en' ? meta.nameEn : meta.nameRu) : t('Другое', 'Other')}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      flex: 0.9,
                      fontFamily: mono,
                      color: SUB0.muted,
                      fontSize: 13,
                    }}
                  >
                    {r.date.getDate()} {monthShort(r.date.getMonth(), lang).toLowerCase()}
                  </div>
                  <div
                    style={{
                      flex: 0.7,
                      textAlign: 'right',
                      fontFeatureSettings: '"tnum"',
                      fontWeight: 700,
                    }}
                  >
                    {fmt(r.amountRub)}
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: `1px solid ${SUB0.line2}`,
                fontSize: 12,
                fontFamily: mono,
                color: SUB0.muted,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                {t(`Стр. ${safePage} из ${totalPages}`, `Page ${safePage} of ${totalPages}`)}
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 1}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${SUB0.line}`,
                    background: SUB0.panel,
                    fontSize: 13,
                    fontFamily: mono,
                    color: safePage === 1 ? SUB0.muted : SUB0.ink,
                    cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                    opacity: safePage === 1 ? 0.5 : 1,
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                  const isActive = n === safePage;
                  if (totalPages > 7 && Math.abs(n - safePage) > 2 && n !== 1 && n !== totalPages) {
                    if (n === safePage - 3 || n === safePage + 3)
                      return (
                        <span
                          key={n}
                          style={{
                            padding: '0 4px',
                            color: SUB0.muted,
                            fontFamily: mono,
                            fontSize: 12,
                          }}
                        >
                          …
                        </span>
                      );
                    return null;
                  }
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n - 1)}
                      style={{
                        padding: '6px 10px',
                        minWidth: 32,
                        borderRadius: 6,
                        border: `1px solid ${isActive ? SUB0.ink : SUB0.line}`,
                        background: isActive ? SUB0.ink : SUB0.panel,
                        color: isActive ? SUB0.bg : SUB0.ink,
                        fontSize: 13,
                        fontFamily: mono,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${SUB0.line}`,
                    background: SUB0.panel,
                    fontSize: 13,
                    fontFamily: mono,
                    color: safePage === totalPages ? SUB0.muted : SUB0.ink,
                    cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: safePage === totalPages ? 0.5 : 1,
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
