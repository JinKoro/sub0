'use client';

import { useEffect, useMemo, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Select, type SelectOption } from '@/shared/components/ui/Select';
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
  toCreateDto,
  toUpdateDto,
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
        // Default category to first one if empty.
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
  const headerColor = catMeta?.color ?? SUB0.blue;

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
    if (!state.firstBillingDate) {
      return t('Укажите дату ближайшего списания', 'Pick the next charge date');
    }
    if (state.isTrial && !state.promoEndsAt) {
      return t('Укажите окончание пробного периода', 'Pick the trial end date');
    }
    if (!state.isTrial && state.promoAmount) {
      if (!PRICE_RE.test(state.promoAmount)) {
        return t('Промо-цена некорректна', 'Promo price is invalid');
      }
      if (!state.promoEndsAt) {
        return t('Укажите окончание промо', 'Pick the promo end date');
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
        if (e.status === 409) {
          setError(
            t(
              'Подписка изменена в другой вкладке — обновите страницу',
              'Subscription was changed elsewhere — please refresh',
            ),
          );
        } else if (e.status === 422) {
          setError(t('Проверьте поля цены и промо', 'Check the price and promo fields'));
        } else if (e.status === 404) {
          setError(t('Подписка не найдена', 'Subscription not found'));
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

  // No projects → cannot create.
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
        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Название', 'Name')}</label>
          <input
            value={state.nameCustom}
            onChange={(e) => set('nameCustom', e.target.value)}
            disabled={!!state.serviceSku}
            style={{ ...inp, opacity: state.serviceSku ? 0.6 : 1 }}
            placeholder={t('Например: Spotify', 'e.g. Spotify')}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Цена', 'Price')}</label>
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

        <div style={fld}>
          <label style={lbl}>{t('Категория', 'Category')}</label>
          <Select
            value={state.categorySku}
            onChange={(v) => set('categorySku', v)}
            width="100%"
            options={catOpts}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Проект', 'Project')}</label>
          <Select
            value={state.projectSku}
            onChange={(v) => set('projectSku', v)}
            width="100%"
            options={projectOpts}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Дата следующего списания', 'Next charge date')}</label>
          <input
            type="date"
            value={state.firstBillingDate}
            onChange={(e) => set('firstBillingDate', e.target.value)}
            style={inp}
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
                  // При включении триала очищаем промо-сумму (она форсируется в '0' при отправке).
                  promoAmount: e.target.checked ? '' : s.promoAmount,
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
                  'Бесплатный доступ до окончания пробного, потом начнётся обычное списание.',
                  'Free access until the trial ends, then the regular charge starts.',
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
                <label style={lbl}>{t('Окончание пробного', 'Trial ends on')}</label>
                <input
                  type="date"
                  value={state.promoEndsAt}
                  onChange={(e) => set('promoEndsAt', e.target.value)}
                  style={inp}
                />
              </div>
            </div>
          )}
        </div>

        {!state.isTrial && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 14,
              background: state.promoAmount ? SUB0.bg : 'transparent',
              border: `1px ${state.promoAmount ? 'solid' : 'dashed'} ${SUB0.line}`,
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: SUB0.ink }}>
                  {t('Промо-период', 'Promotional period')}
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>
                  {t(
                    'Сниженная цена на время акции. После окончания вернётся обычная цена.',
                    'Reduced price during the promo. The regular price resumes after.',
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: mono,
                  fontWeight: 700,
                  padding: '2px 6px',
                  background: state.promoAmount ? SUB0.blue : SUB0.soft,
                  color: state.promoAmount ? '#fff' : SUB0.muted,
                  borderRadius: 3,
                  letterSpacing: '0.08em',
                }}
              >
                {t('ПРОМО', 'PROMO')}
              </span>
            </div>

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
                <label style={lbl}>{t('Цена в промо', 'Promo price')}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={state.promoAmount}
                    onChange={(e) => set('promoAmount', e.target.value)}
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
                  </div>
                </div>
              </div>
              <div style={fld}>
                <label style={lbl}>{t('Окончание промо', 'Promo ends on')}</label>
                <input
                  type="date"
                  value={state.promoEndsAt}
                  onChange={(e) => set('promoEndsAt', e.target.value)}
                  style={inp}
                />
              </div>
            </div>
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
