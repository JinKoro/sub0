'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { MOCK_INVOICES } from '@/shared/constants/cabinet';
import { usePlanLimit } from '@/entities/customer/model/use-plan-limit';
import { SectionHead } from './parts/SectionHead';
import { sBtnPrimary, sBtnSecondary } from './parts/styles';
import { UpgradePlanPage } from './UpgradePlanPage';

const INVOICES_PAGE_SIZE = 5;

export function SettingsBilling() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [view, setView] = useState<'main' | 'upgrade'>('main');
  const subsLimit = usePlanLimit('subscriptions');
  const projLimit = usePlanLimit('projects');

  if (view === 'upgrade') {
    return <UpgradePlanPage currentPlan="free" onClose={() => setView('main')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
          }}
        >
          <div style={{ padding: isMobile ? '18px 16px' : '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: SUB0.soft,
                  fontSize: 11,
                  fontFamily: mono,
                  fontWeight: 700,
                  color: SUB0.ink,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: 999, background: SUB0.blue }}
                />
                {t('Текущий тариф', 'Current plan')}
              </span>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Free{' '}
              <span style={{ color: SUB0.muted, fontWeight: 500, fontSize: 16 }}>· 0 ₽</span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: SUB0.muted,
                marginTop: 6,
                maxWidth: 420,
                lineHeight: 1.45,
              }}
            >
              {t(
                'Новый тариф — больше возможностей для контроля ваших подписок и расходов.',
                'A new plan — more tools to keep your subscriptions and spending in check.',
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button style={sBtnPrimary} onClick={() => setView('upgrade')}>
                ✦ {t('Обновить тариф', 'Upgrade plan')}
              </button>
              <a
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...sBtnSecondary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  lineHeight: 1,
                }}
              >
                {t('Сравнить тарифы', 'Compare plans')}
              </a>
            </div>
          </div>
          <div
            style={{
              padding: isMobile ? '18px 16px' : '22px 24px',
              background: SUB0.soft,
              borderLeft: isMobile ? 'none' : `1px solid ${SUB0.line2}`,
              borderTop: isMobile ? `1px solid ${SUB0.line2}` : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: mono,
                color: SUB0.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {t('Использование', 'Usage')}
            </div>
            <UsageBar
              label={t('Подписки', 'Subscriptions')}
              cur={subsLimit.used}
              max={subsLimit.isFree ? subsLimit.limit : null}
            />
            <UsageBar
              label={t('Проекты', 'Projects')}
              cur={projLimit.used}
              max={projLimit.isFree ? projLimit.limit : null}
            />
            <UsageBar
              label={t('AI-импорт в этом месяце', 'AI imports this month')}
              cur={0}
              max={0}
              disabled
            />
          </div>
        </div>
      </Card>

      <SectionHead title={t('История платежей', 'Billing history')} />
      <Card padding={0}>
        <InvoiceTable />
      </Card>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  cur: number;
  /** null = безлимит (PRO+). Без бара, только счётчик «N · безлимит». */
  max: number | null;
  disabled?: boolean;
}

function UsageBar({ label, cur, max, disabled }: UsageBarProps) {
  const { t } = useLang();
  const unlimited = max === null;
  const pct = !unlimited && max > 0 ? Math.min(100, (cur / max) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          marginBottom: 5,
        }}
      >
        <span style={{ color: SUB0.ink }}>{label}</span>
        <span
          style={{
            fontFamily: mono,
            color: disabled ? SUB0.muted : SUB0.ink,
            fontWeight: 600,
          }}
        >
          {disabled
            ? t('недоступно', 'unavailable')
            : unlimited
              ? `${cur} · ${t('безлимит', 'unlimited')}`
              : `${cur} / ${max}`}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: '#e0ddd0',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: unlimited ? '100%' : `${pct}%`,
            height: '100%',
            background: unlimited ? SUB0.good : pct > 80 ? SUB0.danger : SUB0.ink,
          }}
        />
      </div>
    </div>
  );
}

function InvoiceTable() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const allRows = MOCK_INVOICES;
  const totalPages = Math.max(1, Math.ceil(allRows.length / INVOICES_PAGE_SIZE));
  const [pageNum, setPageNum] = useState(1);
  const safePage = Math.min(pageNum, totalPages);
  const rows = allRows.slice(
    (safePage - 1) * INVOICES_PAGE_SIZE,
    safePage * INVOICES_PAGE_SIZE,
  );
  const cols = isMobile ? '1fr 1fr' : '120px 140px 1fr 120px 32px 120px';

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          padding: isMobile ? '10px 16px' : '10px 24px',
          fontSize: 10,
          fontFamily: mono,
          color: SUB0.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderBottom: `1px solid ${SUB0.line2}`,
          background: SUB0.bg,
        }}
      >
        {!isMobile && <div>{t('Дата', 'Date')}</div>}
        {!isMobile && <div>{t('Номер', 'Invoice')}</div>}
        <div>{t('Тариф', 'Plan')}</div>
        {!isMobile && <div style={{ textAlign: 'right' }}>{t('Сумма', 'Amount')}</div>}
        {!isMobile && <div />}
        <div>{t('Статус', 'Status')}</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.num}
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            padding: isMobile ? '12px 16px' : '14px 24px',
            fontSize: 13,
            alignItems: 'center',
            borderBottom: `1px solid ${SUB0.line2}`,
          }}
        >
          {!isMobile && (
            <div style={{ fontFamily: mono, color: SUB0.ink }}>{r.date}</div>
          )}
          {!isMobile && (
            <div style={{ fontFamily: mono, color: SUB0.muted, fontSize: 12 }}>{r.num}</div>
          )}
          <div style={{ color: SUB0.ink, fontWeight: 600 }}>
            {r.plan}
            {isMobile && (
              <div
                style={{
                  fontSize: 11,
                  color: SUB0.muted,
                  fontFamily: mono,
                  marginTop: 2,
                }}
              >
                {r.date} · {r.num}
              </div>
            )}
          </div>
          {!isMobile && (
            <div style={{ textAlign: 'right', fontFamily: mono, fontWeight: 700 }}>
              {r.amount} ₽
            </div>
          )}
          {!isMobile && <div />}
          <div>
            {r.status === 'paid' && (
              <Pill color={SUB0.good} bg={`${SUB0.good}12`} dot>
                {t('Оплачен', 'Paid')}
              </Pill>
            )}
            {r.status === 'refund' && (
              <Pill color={SUB0.warn} bg={`${SUB0.warn}12`} dot>
                {t('Возврат', 'Refunded')}
              </Pill>
            )}
          </div>
        </div>
      ))}
      {allRows.length > INVOICES_PAGE_SIZE && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '10px 16px' : '12px 24px',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, fontFamily: mono, color: SUB0.muted }}>
            {t(
              `Показано ${(safePage - 1) * INVOICES_PAGE_SIZE + 1}–${Math.min(safePage * INVOICES_PAGE_SIZE, allRows.length)} из ${allRows.length}`,
              `Showing ${(safePage - 1) * INVOICES_PAGE_SIZE + 1}–${Math.min(safePage * INVOICES_PAGE_SIZE, allRows.length)} of ${allRows.length}`,
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPageNum(Math.max(1, safePage - 1))}
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
              return (
                <button
                  key={n}
                  onClick={() => setPageNum(n)}
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
              onClick={() => setPageNum(Math.min(totalPages, safePage + 1))}
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
    </div>
  );
}
