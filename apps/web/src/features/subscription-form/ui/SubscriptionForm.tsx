'use client';

import { useEffect, useMemo, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Select, type SelectOption } from '@/shared/components/ui/Select';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { useProjects } from '@/shared/contexts/projects-context';
import { listCategories } from '@/shared/api/category';
import { createSubscription } from '@/entities/subscription/api/create';
import { updateSubscription } from '@/entities/subscription/api/update';
import { ApiError } from '@/shared/api/client';
import {
  BillingPeriod,
  Currency,
  SubscriptionState,
  type CategoryDto,
} from '@subzero/shared';
import { ServicePickerInline } from './ServicePickerInline';
import { DeleteSubscriptionButton } from '@/features/delete-subscription/ui/DeleteSubscriptionButton';
import {
  newPromoUid,
  toCreateDto,
  toUpdateDto,
  type PromoFormItem,
  type SubscriptionFormState,
} from '../types';

interface Props {
  initial: SubscriptionFormState;
  onClose: () => void;
  onSaved?: () => void;
}

const PRICE_RE = /^\d+(\.\d{1,2})?$/;

const CURRENCY_OPTS: { id: Currency; label: string; labelEn: string; sym: string }[] = [
  { id: Currency.RUB, label: 'Рос. рубль', labelEn: 'Russian ruble', sym: '₽' },
  { id: Currency.USD, label: 'Доллар США', labelEn: 'US dollar', sym: '$' },
  { id: Currency.EUR, label: 'Евро', labelEn: 'Euro', sym: '€' },
  { id: Currency.BYN, label: 'Бел. рубль', labelEn: 'Belarusian ruble', sym: 'BYN' },
];

export function SubscriptionForm({ initial, onClose, onSaved }: Props) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const { projects } = useProjects();
  const isEdit = Boolean(initial.sku);

  const [state, setState] = useState<SubscriptionFormState>(initial);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listCategories()
      .then((list) => {
        if (!alive) return;
        setCategories(list);
        setState((s) => (s.categorySku ? s : { ...s, categorySku: list[0]?.sku ?? '' }));
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      alive = false;
    };
  }, []);

  const set = <K extends keyof SubscriptionFormState>(k: K, v: SubscriptionFormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const addPromo = () =>
    setState((s) => ({
      ...s,
      promos: [...s.promos, { uid: newPromoUid(), amount: '', endsAt: '' }],
    }));
  const patchPromo = (uid: string, patch: Partial<PromoFormItem>) =>
    setState((s) => ({
      ...s,
      promos: s.promos.map((p) => (p.uid === uid ? { ...p, ...patch } : p)),
    }));
  const removePromo = (uid: string) =>
    setState((s) => ({ ...s, promos: s.promos.filter((p) => p.uid !== uid) }));

  const curMeta = CURRENCY_OPTS.find((o) => o.id === state.currencyId) ?? CURRENCY_OPTS[0]!;

  // ───────── styles ─────────
  const fld = { display: 'flex', flexDirection: 'column' as const, gap: 6 };
  const lbl = {
    fontSize: 11,
    fontFamily: mono,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: SUB0.muted,
  };
  const inp = {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    color: SUB0.ink,
  };
  const btnPrimary = {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: SUB0.ink,
    color: SUB0.bg,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
  const btnSecondary = {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    color: SUB0.ink,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
  const sectionHeader = {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'baseline' as const,
    gap: 12,
    flexWrap: 'wrap' as const,
    marginTop: 14,
    paddingTop: 18,
    borderTop: `1px dashed ${SUB0.line}`,
  };
  const sectionHeaderFirst = { ...sectionHeader, marginTop: 0, paddingTop: 0, borderTop: 'none' };
  const sectionNum = {
    fontSize: 11,
    fontFamily: mono,
    color: SUB0.muted,
    fontWeight: 700 as const,
    letterSpacing: '0.06em',
  };
  const sectionTitle = {
    fontSize: 14,
    fontWeight: 700 as const,
    color: SUB0.ink,
    letterSpacing: '-0.01em',
  };

  // ───────── options ─────────
  const curOpts: SelectOption[] = CURRENCY_OPTS.map((o) => ({
    v: String(o.id),
    l: lang === 'ru' ? o.label : o.labelEn,
    sub: Currency[o.id],
    sym: o.sym,
  }));

  const catOpts: SelectOption[] = useMemo(
    () =>
      categories.map((c) => ({
        v: c.sku,
        l: lang === 'ru' ? c.nameRu : c.nameEn,
        leading: (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: c.color ?? SUB0.muted,
              flexShrink: 0,
            }}
          />
        ),
      })),
    [categories, lang],
  );

  const projectOpts: SelectOption[] = projects.map((p) => ({
    v: p.sku,
    l: p.name,
    leading: (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: p.color,
          flexShrink: 0,
        }}
      />
    ),
  }));

  const statusOpts: SelectOption[] = [
    { v: String(SubscriptionState.ACTIVE), l: t('Активна', 'Active'), leading: dot(SUB0.good) },
    { v: String(SubscriptionState.PAUSED), l: t('На паузе', 'Paused'), leading: dot(SUB0.warn) },
    { v: String(SubscriptionState.CANCELLED), l: t('Отменена', 'Cancelled'), leading: dot(SUB0.danger) },
  ];

  // ───────── header preview ─────────
  const headerName = state.nameCustom || t('Без названия', 'Untitled');
  const headerChar = (headerName.charAt(0) || '?').toUpperCase();
  const catMeta = categories.find((c) => c.sku === state.categorySku);
  const projMeta = projects.find((p) => p.sku === state.projectSku);
  // Приоритет: цвет подписки (стабилен на бэке) > цвет категории как preview на новой форме.
  const headerColor = state.color ?? catMeta?.color ?? SUB0.blue;

  // ───────── validation ─────────
  function validate(): string | null {
    if (!state.serviceSku && !state.nameCustom.trim()) {
      return t('Укажите название подписки', 'Enter a subscription name');
    }
    if (!state.categorySku) {
      return t('Выберите категорию', 'Pick a category');
    }
    if (!state.projectSku) {
      return t('Выберите проект', 'Pick a project');
    }
    if (!PRICE_RE.test(state.amount) || Number(state.amount) <= 0) {
      return t('Введите корректную цену', 'Enter a valid price');
    }
    if (!state.nextBillingDate) {
      return t('Укажите дату следующего списания', 'Pick the next charge date');
    }
    if (isEdit || state.mode === 'existing') {
      if (!state.firstBillingDate) {
        return t('Укажите дату первого списания', 'Pick the first charge date');
      }
      if (state.nextBillingDate < state.firstBillingDate) {
        return t(
          'Следующее списание не может быть раньше первого',
          'Next charge cannot be before the first one',
        );
      }
    }
    if (state.isTrial && !state.trialEndsAt) {
      return t('Укажите окончание пробного периода', 'Pick the trial end date');
    }
    for (let i = 0; i < state.promos.length; i += 1) {
      const p = state.promos[i]!;
      const hasAmount = p.amount.trim().length > 0;
      const hasDate = p.endsAt.length > 0;
      if (!hasAmount && !hasDate) continue; // пустая строка — игнор
      if (!hasAmount || !hasDate) {
        return t(
          `Заполните цену и дату для промо #${i + 1}`,
          `Fill price and date for promo #${i + 1}`,
        );
      }
      if (!PRICE_RE.test(p.amount)) {
        return t('Неверное значение цены', 'Invalid price');
      }
      const amt = Number(p.amount);
      const sub = Number(state.amount);
      if (!(amt > 0 && amt < sub)) {
        return t('Неверное значение цены', 'Invalid price');
      }
    }
    if (state.comment.length > 255) {
      return t('Комментарий слишком длинный (макс. 255)', 'Comment too long (max 255)');
    }
    return null;
  }

  async function onSubmit() {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateSubscription(state.sku!, toUpdateDto(state));
      } else {
        await createSubscription(toCreateDto(state));
      }
      onSaved?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError(t('Сессия истекла, войдите снова', 'Session expired, please log in again'));
        } else if (e.status === 409) {
          setError(
            t(
              'Данные обновились в другом окне — обновите страницу',
              'Data changed elsewhere — please refresh the page',
            ),
          );
        } else if (e.status === 422) {
          setError(t('Проверьте поля формы', 'Check the form fields'));
        } else {
          setError(t('Не удалось сохранить', 'Failed to save'));
        }
      } else {
        setError(t('Не удалось сохранить', 'Failed to save'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (projects.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: SUB0.muted }}>
          {t('Сначала создайте проект', 'Create a project first')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: isMobile ? '16px 16px 8px' : '20px 24px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <LogoPill char={headerChar} color={headerColor} icon={state.iconCustom} size={44} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{headerName}</div>
          <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
            {catMeta ? (lang === 'ru' ? catMeta.nameRu : catMeta.nameEn) : ''}
            {projMeta ? ` · ${projMeta.name}` : ''}
          </div>
        </div>
      </div>

      {!isEdit && (
        <ServicePickerInline
          value={{ sku: state.serviceSku, name: state.nameCustom }}
          onChange={(sku, name, icon) => {
            setState((s) => ({
              ...s,
              serviceSku: sku,
              nameCustom: name,
              iconCustom: icon,
            }));
          }}
          categorySku={state.categorySku || undefined}
        />
      )}

      <div
        style={{
          padding: isMobile ? '14px 16px 20px' : '16px 24px 24px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)',
          gap: 14,
        }}
      >
        {/* ─── 01 · Описание ─── */}
        <div style={sectionHeaderFirst}>
          <span style={sectionNum}>01</span>
          <span style={sectionTitle}>{t('Описание', 'Description')}</span>
        </div>

        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>
            {t('Название', 'Name')}
            {!state.serviceSku && <ReqStar />}
          </label>
          <input
            value={state.nameCustom}
            onChange={(e) => set('nameCustom', e.target.value)}
            disabled={!!state.serviceSku}
            style={{ ...inp, opacity: state.serviceSku ? 0.6 : 1 }}
            placeholder={t('Например: Spotify', 'e.g. Spotify')}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>
            {t('Категория', 'Category')}
            <ReqStar />
          </label>
          <Select
            value={state.categorySku}
            onChange={(v) => set('categorySku', v)}
            width="100%"
            options={catOpts}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>
            {t('Проект', 'Project')}
            <ReqStar />
          </label>
          <Select
            value={state.projectSku}
            onChange={(v) => set('projectSku', v)}
            width="100%"
            options={projectOpts}
          />
        </div>

        {isEdit && (
          <div style={{ ...fld, gridColumn: '1 / -1' }}>
            <label style={lbl}>{t('Статус', 'Status')}</label>
            <Select
              value={String(state.stateId ?? SubscriptionState.ACTIVE)}
              onChange={(v) => set('stateId', Number(v))}
              width="100%"
              options={statusOpts}
            />
          </div>
        )}

        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Комментарий', 'Note')}</label>
          <textarea
            value={state.comment}
            onChange={(e) => set('comment', e.target.value)}
            maxLength={255}
            rows={2}
            style={inp}
            placeholder={t('Например: семейный аккаунт', 'e.g. family account')}
          />
        </div>

        {/* ─── 02 · Старт подписки ─── */}
        <div style={sectionHeader}>
          <span style={sectionNum}>02</span>
          <span style={sectionTitle}>{t('Старт подписки', 'Subscription start')}</span>
        </div>

        {/* Mode toggle — только при создании. На edit оба поля показываются автоматом. */}
        {!isEdit && (
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              gap: 6,
              padding: 4,
              background: SUB0.soft,
              borderRadius: 10,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            {(
              [
                {
                  k: 'new' as const,
                  l: t('Новая подписка', 'New subscription'),
                  sub: t('Только оформляю', 'Just signing up now'),
                },
                {
                  k: 'existing' as const,
                  l: t('Уже пользуюсь', 'Already using'),
                  sub: t('Хочу добавить историю', 'Want to log past charges'),
                },
              ] as const
            ).map((opt) => {
              const active = state.mode === opt.k;
              return (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      mode: opt.k,
                      // При переключении в "new" чистим историю.
                      firstBillingDate: opt.k === 'new' ? '' : s.firstBillingDate,
                    }))
                  }
                  style={{
                    flex: 1,
                    minWidth: isMobile ? '100%' : 0,
                    padding: '10px 14px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    background: active ? SUB0.panel : 'transparent',
                    boxShadow: active ? '0 1px 3px rgba(10,10,10,.06)' : 'none',
                    transition: 'background .12s, box-shadow .12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        border: `1.5px solid ${active ? SUB0.ink : SUB0.muted}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'border-color .12s',
                      }}
                    >
                      {active && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: SUB0.ink,
                          }}
                        />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: active ? SUB0.ink : SUB0.muted,
                      }}
                    >
                      {opt.l}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: SUB0.muted,
                      fontFamily: mono,
                      marginTop: 4,
                      marginLeft: 22,
                    }}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={fld}>
          <label style={lbl}>
            {t('Цена', 'Price')}
            <ReqStar />
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              inputMode="decimal"
              value={state.amount}
              onChange={(e) => set('amount', e.target.value)}
              style={{ ...inp, flex: 1, fontFeatureSettings: '"tnum"' }}
              placeholder="0"
            />
            <Select
              value={String(state.currencyId)}
              onChange={(v) => set('currencyId', Number(v))}
              options={curOpts}
              width={130}
              align="right"
            />
          </div>
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Цикл', 'Cycle')}</label>
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 3,
              background: SUB0.soft,
              borderRadius: 8,
            }}
          >
            {(
              [
                [BillingPeriod.MONTH, t('Месяц', 'Monthly')],
                [BillingPeriod.YEAR, t('Год', 'Yearly')],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => set('billingPeriodId', k)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: state.billingPeriodId === k ? SUB0.panel : 'transparent',
                  fontSize: 13,
                  fontWeight: 600,
                  color: state.billingPeriodId === k ? SUB0.ink : SUB0.muted,
                  boxShadow:
                    state.billingPeriodId === k ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* «Дата первого списания» — при edit read-only (иммутабельно до редактора истории),
            при create только в mode='existing'. */}
        {isEdit ? (
          <div style={fld}>
            <label style={lbl}>{t('Дата первого списания', 'First charge date')}</label>
            <div
              style={{
                ...inp,
                background: SUB0.soft,
                color: SUB0.muted,
                cursor: 'not-allowed',
                userSelect: 'none',
                fontFamily: mono,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {state.firstBillingDate || '—'}
            </div>
          </div>
        ) : state.mode === 'existing' ? (
          <div style={fld}>
            <label style={lbl}>
              {t('Дата первого списания', 'First charge date')}
              <ReqStar />
            </label>
            <DatePicker
              value={state.firstBillingDate}
              onChange={(v) => set('firstBillingDate', v)}
              placeholder={t('Когда было первое', 'When the first charge was')}
            />
          </div>
        ) : null}

        <div
          style={{
            ...fld,
            gridColumn: isEdit || state.mode === 'existing' ? 'auto' : '1 / -1',
          }}
        >
          <label style={lbl}>
            {t('Дата следующего списания', 'Next charge date')}
            <ReqStar />
          </label>
          <DatePicker
            value={state.nextBillingDate}
            onChange={(v) => set('nextBillingDate', v)}
            placeholder={t('Когда следующее', 'When the next charge is')}
          />
          {(() => {
            const suggested = suggestedNextIso(
              state.firstBillingDate,
              state.billingPeriodId,
            );
            if (!suggested || suggested === state.nextBillingDate) return null;
            return (
              <button
                type="button"
                onClick={() => set('nextBillingDate', suggested)}
                style={{
                  alignSelf: 'start',
                  marginTop: 2,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  fontSize: 12,
                  fontFamily: mono,
                  color: SUB0.blue,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ↪ {t(`Подставить ${suggested}`, `Use ${suggested}`)}
              </button>
            );
          })()}
        </div>

        {/* ─── 03 · Особые периоды ─── */}
        <div style={sectionHeader}>
          <span style={sectionNum}>03</span>
          <span style={sectionTitle}>{t('Особые периоды', 'Special periods')}</span>
        </div>

        {/* Trial — независим от промо */}
        <div
          style={{
            gridColumn: '1 / -1',
            padding: 14,
            background: state.isTrial ? SUB0.bg : 'transparent',
            border: `1px ${state.isTrial ? 'solid' : 'dashed'} ${SUB0.line}`,
            borderRadius: 10,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.isTrial}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  isTrial: e.target.checked,
                  // При выключении триала очищаем дату.
                  trialEndsAt: e.target.checked ? s.trialEndsAt : '',
                }))
              }
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: SUB0.ink }}>
                {t('Пробный период', 'Trial period')}
              </div>
              <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>
                {t(
                  'Бесплатный доступ до окончания пробного периода',
                  'Free access until the trial ends',
                )}
              </div>
            </div>
            <span
              style={{
                fontSize: 9,
                fontFamily: mono,
                fontWeight: 700,
                padding: '2px 6px',
                background: state.isTrial ? SUB0.danger : SUB0.soft,
                color: state.isTrial ? '#fff' : SUB0.muted,
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              {t('ПРОБНЫЙ', 'TRIAL')}
            </span>
          </label>

          {state.isTrial && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px dashed ${SUB0.line}`,
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)',
                gap: 12,
              }}
            >
              <div style={fld}>
                <label style={lbl}>
                  {t('Окончание пробного', 'Trial ends on')}
                  <ReqStar />
                </label>
                <DatePicker
                  value={state.trialEndsAt}
                  onChange={(v) => set('trialEndsAt', v)}
                  placeholder={t('Дата окончания пробного', 'Pick the end date')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Promo — независим от триала, список */}
        <div
          style={{
            gridColumn: '1 / -1',
            padding: 14,
            background: state.promos.length ? SUB0.bg : 'transparent',
            border: `1px ${state.promos.length ? 'solid' : 'dashed'} ${SUB0.line}`,
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: SUB0.ink }}>
                {t('Промо-периоды', 'Promotional periods')}
              </div>
              <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>
                {t(
                  'Сниженная цена на время акции. Можно добавить несколько.',
                  'Reduced price during a promo. Add multiple.',
                )}
              </div>
            </div>
            <span
              style={{
                fontSize: 9,
                fontFamily: mono,
                fontWeight: 700,
                padding: '2px 6px',
                background: state.promos.length ? SUB0.blue : SUB0.soft,
                color: state.promos.length ? '#fff' : SUB0.muted,
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              {t('ПРОМО', 'PROMO')}
            </span>
          </div>

          {state.promos.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px dashed ${SUB0.line}`,
              }}
            >
              {state.promos.map((pr, i) => {
                const subAmt = Number(state.amount);
                const prAmt = Number(pr.amount);
                const showSaving =
                  state.amount && pr.amount && Number.isFinite(prAmt) && prAmt > 0 && prAmt < subAmt;
                const savingPct = showSaving ? Math.round((1 - prAmt / subAmt) * 100) : 0;
                return (
                  <div
                    key={pr.uid}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr) 32px',
                      gap: 12,
                      alignItems: 'start',
                    }}
                  >
                    <div style={fld}>
                      <label style={lbl}>
                        {t(`Цена в промо #${i + 1}`, `Promo price #${i + 1}`)}
                        <ReqStar />
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={pr.amount}
                          onChange={(e) => patchPromo(pr.uid, { amount: e.target.value })}
                          placeholder="0"
                          style={{ ...inp, flex: 1, fontFeatureSettings: '"tnum"' }}
                        />
                        <div
                          style={{
                            ...inp,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: SUB0.muted,
                            padding: '10px 12px',
                            minWidth: 80,
                          }}
                        >
                          <span style={{ fontFamily: mono, fontWeight: 700, color: SUB0.ink }}>
                            {curMeta.sym}
                          </span>
                          <span style={{ fontFamily: mono, fontSize: 12 }}>
                            {Currency[curMeta.id]}
                          </span>
                        </div>
                      </div>
                      {showSaving && (
                        <div
                          style={{
                            fontSize: 11,
                            fontFamily: mono,
                            color: SUB0.good,
                            marginTop: 2,
                          }}
                        >
                          {t(
                            `Экономия ${savingPct}% от обычной цены`,
                            `Saving ${savingPct}% vs regular`,
                          )}
                        </div>
                      )}
                    </div>
                    <div style={fld}>
                      <label style={lbl}>
                        {t('Окончание промо', 'Promo ends on')}
                        <ReqStar />
                      </label>
                      <DatePicker
                        value={pr.endsAt}
                        onChange={(v) => patchPromo(pr.uid, { endsAt: v })}
                        placeholder={t('Дата окончания акции', 'Pick the end date')}
                      />
                    </div>
                    <div style={{ ...fld, justifySelf: isMobile ? 'end' : 'stretch' }}>
                      {!isMobile && (
                        <label style={{ ...lbl, visibility: 'hidden' }} aria-hidden="true">
                          ×
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => removePromo(pr.uid)}
                        title={t('Удалить', 'Remove')}
                        style={{
                          height: 38,
                          width: isMobile ? 'auto' : 32,
                          padding: isMobile ? '0 14px' : 0,
                          border: `1px solid ${SUB0.line}`,
                          background: SUB0.panel,
                          color: SUB0.muted,
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontFamily: mono,
                          fontSize: 13,
                        }}
                      >
                        {isMobile ? t('× Удалить промо', '× Remove promo') : '×'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={addPromo}
            style={{
              marginTop: state.promos.length ? 12 : 14,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px dashed ${SUB0.line}`,
              background: 'transparent',
              color: SUB0.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            +{' '}
            {state.promos.length === 0
              ? t('Добавить промо', 'Add promo')
              : t('Ещё промо', 'Another promo')}
          </button>
        </div>

        {error && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 12,
              background: '#fdecea',
              border: `1px solid ${SUB0.danger}`,
              borderRadius: 8,
              color: SUB0.danger,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          padding: isMobile ? '12px 16px' : '14px 24px',
          borderTop: `1px solid ${SUB0.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          background: SUB0.panel,
          flexWrap: 'wrap',
        }}
      >
        {isEdit && state.sku ? (
          <DeleteSubscriptionButton
            sku={state.sku}
            name={state.nameCustom || 'Subscription'}
            onDeleted={onClose}
          />
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={btnSecondary} disabled={submitting}>
            {t('Отмена', 'Cancel')}
          </button>
          <button onClick={onSubmit} style={btnPrimary} disabled={submitting}>
            {submitting
              ? t('Сохранение…', 'Saving…')
              : isEdit
                ? t('Сохранить', 'Save')
                : t('Создать', 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

function dot(color: string) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function ReqStar() {
  return (
    <span
      aria-hidden
      style={{ color: SUB0.danger, marginLeft: 4, fontWeight: 700 }}
    >
      *
    </span>
  );
}

/** На основе firstBillingDate + cycle считает ближайшее списание ≥ today (UTC). Возвращает YYYY-MM-DD. */
function suggestedNextIso(firstIso: string, cycle: number): string | null {
  if (!firstIso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(firstIso);
  if (!m) return null;
  const [y, mo, dy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(dy)) return null;
  const start = new Date(Date.UTC(y, mo - 1, dy));
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const d = new Date(start.getTime());
  while (d.getTime() < todayMs) {
    if (cycle === BillingPeriod.MONTH) d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCFullYear(d.getUTCFullYear() + 1);
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}
