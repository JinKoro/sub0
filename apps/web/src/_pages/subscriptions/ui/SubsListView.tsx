'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Select, type SelectOption } from '@/shared/components/ui/Select';
import { CabinetCtaButton } from '@/shared/components/ui/CabinetCtaButton';
import { listSubscriptions } from '@/entities/subscription/api/list';
import { listCategories, type CategoryDto } from '@/shared/api/category';
import {
  toCabinetSubscription,
  type CabinetSubscription,
} from '@/entities/subscription/model/types';
import {
  fmtPrice,
  monthShort,
  STATUS_MAP,
  type StatusKey,
} from '@/shared/constants/cabinet';
import { ApiError } from '@/shared/api/client';
import type {
  SubscriptionListSort,
  SubscriptionListStatus,
} from '@subzero/shared';
import {
  BillingPeriod,
  Currency,
  SubscriptionState,
} from '@subzero/shared';

const PAGE_SIZE = 20;

interface Props {
  onEdit: (sub: CabinetSubscription) => void;
}

type StatusFilter = SubscriptionListStatus;
type SortKey = SubscriptionListSort;

// ARCHIVED не показываем в обычном UI — он используется только при удалении аккаунта.
const STATUS_VALUES: StatusFilter[] = ['all', 'active', 'paused', 'cancelled'];
const SORT_VALUES: SortKey[] = ['next', 'name', 'price'];

function parseStatus(raw: string | null): StatusFilter {
  return (STATUS_VALUES as string[]).includes(raw ?? '') ? (raw as StatusFilter) : 'all';
}

function parseSort(raw: string | null): SortKey {
  return (SORT_VALUES as string[]).includes(raw ?? '') ? (raw as SortKey) : 'next';
}

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function statusToKey(state: number): StatusKey {
  if (state === SubscriptionState.PAUSED) return 'paused';
  if (state === SubscriptionState.CANCELLED) return 'cancel';
  if (state === SubscriptionState.ARCHIVED) return 'archive';
  return 'active';
}

function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isBilledToday(nextBillingDate: string, todayIso: string): boolean {
  // nextBillingDate приходит как ISO; берём первые 10 символов (YYYY-MM-DD).
  return nextBillingDate.slice(0, 10) === todayIso;
}

function hasActivePromo(promos: { endsAt: string }[], nowMs: number): boolean {
  return promos.some((p) => new Date(p.endsAt).getTime() > nowMs);
}

function currencySymbol(currencyId: number): string {
  if (currencyId === Currency.USD) return 'USD';
  if (currencyId === Currency.EUR) return 'EUR';
  if (currencyId === Currency.BYN) return 'BYN';
  return 'RUB';
}

function fmtAmount(amount: string, currencyId: number): string {
  const n = Number(amount);
  const cur = currencySymbol(currencyId);
  if (cur === 'RUB') return fmtPrice(n, 'RUB');
  if (cur === 'USD') return fmtPrice(n, 'USD');
  if (cur === 'EUR') return fmtPrice(n, 'EUR');
  return fmtPrice(n, 'BYN');
}

function parseNextDate(iso: string): { day: number; month: number } {
  // iso = 'YYYY-MM-DD'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return { day: 1, month: 1 };
  return { day: Number(m[3]), month: Number(m[2]) };
}

export function SubsListView({ onEdit }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const { project } = useCabinet();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = parseStatus(searchParams.get('status'));
  const urlCat = searchParams.get('cat') ?? 'all';
  const urlSort = parseSort(searchParams.get('sort'));
  const urlPage = parsePage(searchParams.get('page'));

  // Local input mirror for debounce.
  const [searchInput, setSearchInput] = useState(urlQ);

  // When url q changes externally (back/forward), sync local input.
  useEffect(() => {
    setSearchInput(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  // Categories — fetched once.
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  useEffect(() => {
    let alive = true;
    listCategories()
      .then((list) => alive && setCategories(list))
      .catch(() => {
        /* non-fatal: filter just shows fewer options */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Subscriptions list state.
  const [rows, setRows] = useState<CabinetSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);

  useEffect(() => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    listSubscriptions({
      projectSku: project === 'all' ? 'all' : project,
      status: urlStatus,
      categorySku: urlCat === 'all' ? undefined : urlCat,
      q: urlQ || undefined,
      sort: urlSort,
      page: urlPage,
      pageSize: PAGE_SIZE,
    })
      .then((resp) => {
        if (my !== reqId.current) return;
        setRows(resp.items.map(toCabinetSubscription));
        setTotal(resp.total);
      })
      .catch((e: unknown) => {
        if (my !== reqId.current) return;
        const msg =
          e instanceof ApiError
            ? t('Не удалось загрузить', 'Failed to load')
            : t('Не удалось загрузить', 'Failed to load');
        setError(msg);
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [project, urlStatus, urlCat, urlQ, urlSort, urlPage, t]);

  // URL writer.
  const updateUrl = useCallback(
    (patch: { q?: string; status?: StatusFilter; cat?: string; sort?: SortKey; page?: number }) => {
      const sp = new URLSearchParams(searchParams.toString());
      const set = (k: string, v: string | undefined, def: string) => {
        if (v === undefined) return;
        if (v === def || v === '') sp.delete(k);
        else sp.set(k, v);
      };
      if (patch.q !== undefined) set('q', patch.q, '');
      if (patch.status !== undefined) set('status', patch.status, 'all');
      if (patch.cat !== undefined) set('cat', patch.cat, 'all');
      if (patch.sort !== undefined) set('sort', patch.sort, 'next');
      if (patch.page !== undefined) set('page', patch.page === 1 ? '' : String(patch.page), '');
      // Drop ?new=1 transient flag if present.
      sp.delete('new');
      const qs = sp.toString();
      router.replace(`/account/subscriptions${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams],
  );

  // Debounce search input → URL.
  useEffect(() => {
    if (searchInput === urlQ) return;
    const h = setTimeout(() => {
      updateUrl({ q: searchInput, page: 1 });
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(urlPage, totalPages);

  const catOptions: SelectOption[] = useMemo(
    () => [
      { v: 'all', l: t('Все категории', 'All categories') },
      ...categories.map((c) => ({ v: c.sku, l: lang === 'ru' ? c.nameRu : c.nameEn })),
    ],
    [categories, lang, t],
  );

  const statusOptions: SelectOption[] = [
    { v: 'all', l: t('Все статусы', 'All statuses') },
    { v: 'active', l: t('Активные', 'Active') },
    { v: 'paused', l: t('На паузе', 'Paused') },
    { v: 'cancelled', l: t('Отменены', 'Cancelled') },
  ];
  const sortOptions: SelectOption[] = [
    { v: 'next', l: t('По дате списания', 'By next charge') },
    { v: 'name', l: t('По названию', 'By name') },
    { v: 'price', l: t('По цене', 'By price') },
  ];

  const categoryBySku = useMemo(() => {
    const map = new Map<string, CategoryDto>();
    for (const c of categories) map.set(c.sku, c);
    return map;
  }, [categories]);

  const noFilters =
    urlQ === '' && urlStatus === 'all' && urlCat === 'all' && project === 'all';

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
          <CabinetCtaButton href="/account/subscriptions/new">
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            value={urlCat}
            onChange={(v) => updateUrl({ cat: v, page: 1 })}
            options={catOptions}
          />
          <Select
            value={urlStatus}
            onChange={(v) => updateUrl({ status: v as StatusFilter, page: 1 })}
            options={statusOptions}
          />
          <Select
            value={urlSort}
            onChange={(v) => updateUrl({ sort: v as SortKey, page: 1 })}
            options={sortOptions}
          />
        </div>
      </Card>

      {error && (
        <Card
          padding={14}
          style={{
            marginBottom: 14,
            background: '#fdecea',
            borderColor: SUB0.danger,
          }}
        >
          <div style={{ fontSize: 13, color: SUB0.danger }}>{error}</div>
        </Card>
      )}

      {loading ? (
        <Card padding={60}>
          <div
            style={{
              textAlign: 'center',
              color: SUB0.muted,
              fontSize: 14,
              fontFamily: mono,
            }}
          >
            {t('Загрузка…', 'Loading…')}
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <Card padding={60}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: SUB0.muted, marginBottom: 14 }}>
              {noFilters
                ? t('Подписок пока нет — добавьте первую', 'No subscriptions yet — add your first')
                : t('Ничего не найдено', 'Nothing found')}
            </div>
            {noFilters && (
              <CabinetCtaButton href="/account/subscriptions/new">
                + {t('Новая подписка', 'New subscription')}
              </CabinetCtaButton>
            )}
          </div>
        </Card>
      ) : isMobile ? (
        <SubsGrid rows={rows} onEdit={onEdit} categoryBySku={categoryBySku} />
      ) : (
        <SubsList rows={rows} onEdit={onEdit} categoryBySku={categoryBySku} />
      )}

      {!loading && total > PAGE_SIZE && (
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
                total,
              )} из ${total}`,
              `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                safePage * PAGE_SIZE,
                total,
              )} of ${total}`,
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => updateUrl({ page: Math.max(1, safePage - 1) })}
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
                  onClick={() => updateUrl({ page: n })}
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
              onClick={() => updateUrl({ page: Math.min(totalPages, safePage + 1) })}
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
  categoryBySku: Map<string, CategoryDto>;
}

function SubsList({ rows, onEdit, categoryBySku }: RowsProps) {
  const { t, lang } = useLang();
  const todayIso = todayLocalIso();
  const nowMs = Date.now();
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
        const cat = r.categorySku ? categoryBySku.get(r.categorySku) : undefined;
        const statusMeta = STATUS_MAP[statusToKey(r.stateId)];
        const next = parseNextDate(r.nextBillingDate);
        const char = r.name.charAt(0).toUpperCase() || '?';
        const isPromoActive = hasActivePromo(r.promos, nowMs);
        const isTrialActive =
          r.isTrial && (!r.trialEndsAt || new Date(r.trialEndsAt).getTime() > nowMs);
        const billedToday = isBilledToday(r.nextBillingDate, todayIso);
        return (
          <div
            key={r.sku}
            onClick={() => onEdit(r)}
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 20px',
              borderBottom: `1px solid ${SUB0.line2}`,
              borderLeft: billedToday ? `3px solid ${SUB0.blue}` : '3px solid transparent',
              background: billedToday ? `${SUB0.blue}08` : 'transparent',
              alignItems: 'center',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background .12s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = billedToday ? `${SUB0.blue}14` : SUB0.bg)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = billedToday ? `${SUB0.blue}08` : 'transparent')
            }
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
              <LogoPill
                char={char}
                color={r.color ?? cat?.color ?? SUB0.muted}
                icon={r.icon}
                size={32}
              />
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
                  {isTrialActive && (
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
                  {isPromoActive && !isTrialActive && (
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
                    background: cat?.color ?? SUB0.muted,
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
                  {cat ? (lang === 'ru' ? cat.nameRu : cat.nameEn) : ''}
                </span>
              </span>
            </div>
            <div
              style={{
                flex: 0.9,
                minWidth: 0,
                color: billedToday ? SUB0.blue : SUB0.muted,
                fontSize: 13,
                fontFamily: mono,
                fontWeight: billedToday ? 700 : 500,
              }}
            >
              {billedToday
                ? t('Сегодня', 'Today')
                : `${next.day} ${monthShort(next.month - 1, lang).toLowerCase()}`}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                color: r.comment ? SUB0.ink : SUB0.muted,
                fontSize: 12,
                opacity: r.comment ? 0.85 : 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.comment || '—'}
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
              {fmtAmount(r.amount, r.currencyId)}
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
              {r.billingPeriodId === BillingPeriod.YEAR ? t('год', 'yr') : t('мес', 'mo')}
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
    </Card>
  );
}

function SubsGrid({ rows, onEdit, categoryBySku }: RowsProps) {
  const { t, lang } = useLang();
  const todayIso = todayLocalIso();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 14,
      }}
    >
      {rows.map((r) => {
        const cat = r.categorySku ? categoryBySku.get(r.categorySku) : undefined;
        const statusMeta = STATUS_MAP[statusToKey(r.stateId)];
        const next = parseNextDate(r.nextBillingDate);
        const char = r.name.charAt(0).toUpperCase() || '?';
        const billedToday = isBilledToday(r.nextBillingDate, todayIso);
        return (
          <Card
            key={r.sku}
            padding={18}
            className="s-card"
            style={{
              cursor: 'pointer',
              borderColor: billedToday ? SUB0.blue : undefined,
              boxShadow: billedToday ? `inset 3px 0 0 ${SUB0.blue}` : undefined,
              background: billedToday ? `${SUB0.blue}08` : undefined,
            }}
          >
            <div onClick={() => onEdit(r)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 14,
                }}
              >
                <LogoPill
                  char={char}
                  color={r.color ?? cat?.color ?? SUB0.muted}
                  icon={r.icon}
                  size={40}
                />
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
                      background: cat?.color ?? SUB0.muted,
                    }}
                  />
                  {cat ? (lang === 'ru' ? cat.nameRu : cat.nameEn) : ''}
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
                    {fmtAmount(r.amount, r.currencyId)}
                  </div>
                  <div style={{ fontSize: 11, color: SUB0.muted, fontFamily: mono }}>
                    {r.billingPeriodId === BillingPeriod.YEAR
                      ? t('в год', 'per year')
                      : t('в месяц', 'per month')}
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
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: billedToday ? 700 : 600,
                      fontFamily: mono,
                      color: billedToday ? SUB0.blue : SUB0.ink,
                    }}
                  >
                    {billedToday
                      ? t('Сегодня', 'Today')
                      : `${next.day} ${monthShort(next.month - 1, lang).toLowerCase()}`}
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
