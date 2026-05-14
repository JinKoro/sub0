'use client';

import { useMemo, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Select, type SelectOption } from '@/shared/components/ui/Select';
import { CabinetCtaButton } from '@/shared/components/ui/CabinetCtaButton';
import { CATEGORIES, CAB_SUBS } from '@/entities/subscription/model/cabinet-mock';
import type { CabinetSubscription } from '@/entities/subscription/model/cabinet-types';
import {
  toRub,
  fmtPrice,
  monthShort,
  STATUS_MAP,
  type StatusKey,
} from '@/shared/constants/cabinet';

const PAGE_SIZE = 10;

interface Props {
  onEdit: (sub: CabinetSubscription) => void;
}

type StatusFilter = 'all' | StatusKey;

export function SubsListView({ onEdit }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const { project } = useCabinet();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'next' | 'name' | 'price'>('next');
  const [pageNum, setPageNum] = useState(1);

  const rows = useMemo(() => {
    let list = project === 'all' ? CAB_SUBS : CAB_SUBS.filter((s) => s.project === project);
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== 'all') list = list.filter((s) => s.cat === filterCat);
    if (filterStatus !== 'all') list = list.filter((s) => s.status === filterStatus);
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return toRub(b.price, b.cur) - toRub(a.price, a.cur);
      return a.nextMonth * 32 + a.nextDay - (b.nextMonth * 32 + b.nextDay);
    });
  }, [project, search, filterCat, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(pageNum, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const catOptions: SelectOption[] = [
    { v: 'all', l: t('Все категории', 'All categories') },
    ...CATEGORIES.map((c) => ({ v: c.id, l: t(c.name, c.nameEn) })),
  ];
  const statusOptions: SelectOption[] = [
    { v: 'all', l: t('Все статусы', 'All statuses') },
    { v: 'active', l: t('Активные', 'Active') },
    { v: 'paused', l: t('На паузе', 'Paused') },
    { v: 'cancel', l: t('Отменены', 'Cancelled') },
    { v: 'archive', l: t('В архиве', 'Archived') },
  ];
  const sortOptions: SelectOption[] = [
    { v: 'next', l: t('По дате списания', 'By next charge') },
    { v: 'name', l: t('По названию', 'By name') },
    { v: 'price', l: t('По цене', 'By price') },
  ];

  return (
    <div
      style={{
        padding: isMobile ? '20px 16px' : '32px 28px',
        maxWidth: 1320,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: mono,
              color: SUB0.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            {t('Все подписки', 'All subscriptions')}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t('Подписки', 'Subscriptions')}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CabinetCtaButton href="/subscriptions?new=1">
            + {t('Новая подписка', 'New subscription')}
          </CabinetCtaButton>
        </div>
      </div>

      <Card padding={0} style={{ marginBottom: 14 }}>
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${SUB0.line2}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: '1 1 280px',
              background: SUB0.bg,
              border: `1px solid ${SUB0.line}`,
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke={SUB0.muted} strokeWidth="1.5" />
              <path
                d="M9.5 9.5L12 12"
                stroke={SUB0.muted}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNum(1);
              }}
              placeholder={t('Поиск по названию…', 'Search by name…')}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </div>
          <Select
            value={filterCat}
            onChange={(v) => {
              setFilterCat(v);
              setPageNum(1);
            }}
            options={catOptions}
          />
          <Select
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v as StatusFilter);
              setPageNum(1);
            }}
            options={statusOptions}
          />
          <Select
            value={sortBy}
            onChange={(v) => {
              setSortBy(v as 'next' | 'name' | 'price');
              setPageNum(1);
            }}
            options={sortOptions}
          />
        </div>
      </Card>

      {isMobile ? (
        <SubsGrid rows={pageRows} onEdit={onEdit} />
      ) : (
        <SubsList rows={pageRows} onEdit={onEdit} />
      )}

      {rows.length > PAGE_SIZE && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, fontFamily: mono, color: SUB0.muted }}>
            {t(
              `Показано ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                safePage * PAGE_SIZE,
                rows.length,
              )} из ${rows.length}`,
              `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                safePage * PAGE_SIZE,
                rows.length,
              )} of ${rows.length}`,
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

interface RowsProps {
  rows: CabinetSubscription[];
  onEdit: (sub: CabinetSubscription) => void;
}

function SubsList({ rows, onEdit }: RowsProps) {
  const { t, lang } = useLang();
  return (
    <Card padding={0}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 20px',
          fontSize: 11,
          fontFamily: mono,
          color: SUB0.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderBottom: `1px solid ${SUB0.line}`,
        }}
      >
        <div style={{ flex: 1.6, minWidth: 0 }}>{t('Подписка', 'Subscription')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>{t('Категория', 'Category')}</div>
        <div style={{ flex: 0.9, minWidth: 0 }}>{t('Списание', 'Renews')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>{t('Комментарий', 'Comment')}</div>
        <div style={{ flex: 0.7, minWidth: 0, textAlign: 'right' }}>{t('Цена', 'Price')}</div>
        <div style={{ flex: 0.5, minWidth: 0, paddingLeft: 16 }}>{t('Цикл', 'Cycle')}</div>
        <div style={{ flex: 0.9, minWidth: 0 }}>{t('Статус', 'Status')}</div>
        <div style={{ width: 16, flexShrink: 0 }} />
      </div>
      {rows.map((r) => {
        const meta = CATEGORIES.find((c) => c.id === r.cat);
        const statusMeta = STATUS_MAP[r.status];
        return (
          <div
            key={r.id}
            onClick={() => onEdit(r)}
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 20px',
              borderBottom: `1px solid ${SUB0.line2}`,
              alignItems: 'center',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background .12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SUB0.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                flex: 1.6,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <LogoPill char={r.char} color={r.color ?? SUB0.muted} size={32} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {r.name}
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
            </div>
            <div style={{ flex: 1, minWidth: 0, color: SUB0.ink, fontSize: 13 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                  maxWidth: '100%',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: meta?.color ?? SUB0.muted,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {meta ? t(meta.name, meta.nameEn) : ''}
                </span>
              </span>
            </div>
            <div
              style={{
                flex: 0.9,
                minWidth: 0,
                color: SUB0.muted,
                fontSize: 13,
                fontFamily: mono,
              }}
            >
              {r.nextDay} {monthShort(r.nextMonth - 1, lang).toLowerCase()}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                color: r.note ? SUB0.ink : SUB0.muted,
                fontSize: 12,
                opacity: r.note ? 0.85 : 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.note || '—'}
            </div>
            <div
              style={{
                flex: 0.7,
                minWidth: 0,
                textAlign: 'right',
                fontWeight: 700,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {fmtPrice(r.price, r.cur)}
            </div>
            <div
              style={{
                flex: 0.5,
                minWidth: 0,
                paddingLeft: 16,
                color: SUB0.muted,
                fontSize: 13,
                fontFamily: mono,
              }}
            >
              {r.cycle === 'monthly' ? t('мес', 'mo') : t('год', 'yr')}
            </div>
            <div style={{ flex: 0.9, minWidth: 0 }}>
              <Pill color={statusMeta.color} bg={`${statusMeta.color}12`} dot>
                {t(statusMeta.ru, statusMeta.en)}
              </Pill>
            </div>
            <div
              style={{
                width: 16,
                flexShrink: 0,
                textAlign: 'right',
                color: SUB0.muted,
                fontSize: 16,
              }}
            >
              ›
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: SUB0.muted,
            fontSize: 14,
          }}
        >
          {t('Ничего не найдено', 'Nothing found')}
        </div>
      )}
    </Card>
  );
}

function SubsGrid({ rows, onEdit }: RowsProps) {
  const { t, lang } = useLang();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 14,
      }}
    >
      {rows.map((r) => {
        const meta = CATEGORIES.find((c) => c.id === r.cat);
        const statusMeta = STATUS_MAP[r.status];
        return (
          <Card key={r.id} padding={18} className="s-card" style={{ cursor: 'pointer' }}>
            <div onClick={() => onEdit(r)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 14,
                }}
              >
                <LogoPill char={r.char} color={r.color ?? SUB0.muted} size={40} />
                <Pill color={statusMeta.color} bg={`${statusMeta.color}12`} dot>
                  {t(statusMeta.ru, statusMeta.en)}
                </Pill>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: SUB0.muted,
                  fontFamily: mono,
                  marginBottom: 14,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 2,
                      background: meta?.color ?? SUB0.muted,
                    }}
                  />
                  {meta ? t(meta.name, meta.nameEn) : ''}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: 12,
                  borderTop: `1px dashed ${SUB0.line}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {fmtPrice(r.price, r.cur)}
                  </div>
                  <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono }}>
                    {r.cycle === 'monthly' ? t('в месяц', 'per month') : t('в год', 'per year')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: SUB0.muted,
                      fontFamily: mono,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {t('Списание', 'Renews')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono }}>
                    {r.nextDay} {monthShort(r.nextMonth - 1, lang).toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
