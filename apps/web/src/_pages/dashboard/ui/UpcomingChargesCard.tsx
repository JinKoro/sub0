'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { CATEGORIES } from '@/entities/subscription/model/cabinet-demo';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import { toRub, monthShort } from '@/shared/constants/cabinet';
import { useFormatRub } from '../lib/format';

const PAGE_SIZE = 5;
const CURRENT_MONTH_IDX = 4;

interface Props {
  subs: CabinetSubscription[];
}

export function UpcomingChargesCard({ subs }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const fmt = useFormatRub();
  const [page, setPage] = useState(0);

  const upcoming = subs
    .filter((s) => s.status !== 'paused' && s.status !== 'archive')
    .map((s) => ({ ...s, monthsAhead: ((s.nextMonth - 1 - CURRENT_MONTH_IDX) + 12) % 12 }))
    .sort(
      (a, b) =>
        a.monthsAhead * 32 + a.nextDay - (b.monthsAhead * 32 + b.nextDay),
    );

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
          const meta = CATEGORIES.find((c) => c.id === r.cat);
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                padding: '12px 20px',
                borderBottom: `1px solid ${SUB0.line2}`,
                alignItems: 'center',
                fontSize: 14,
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
                <LogoPill char={r.char} color={r.color ?? SUB0.muted} icon={r.icon} size={28} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.name}
                  </div>
                  {r.trial && (
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
                  {r.promo && !r.trial && (
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
                    {meta ? t(meta.name, meta.nameEn) : ''}
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
                {r.nextDay} {monthShort(r.nextMonth - 1, lang).toLowerCase()}
              </div>
              <div
                style={{
                  flex: 0.7,
                  textAlign: 'right',
                  fontFeatureSettings: '"tnum"',
                  fontWeight: 700,
                }}
              >
                {fmt(toRub(r.price, r.cur))}
              </div>
            </div>
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
    </Card>
  );
}
