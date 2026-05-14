'use client';

import { useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { Select, type SelectOption } from '@/shared/components/ui/Select';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { CATEGORIES } from '@/entities/subscription/model/cabinet-mock';
import { PROJECTS } from '@/entities/project/model/data';
import { CURRENCY_OPTIONS } from '@/shared/constants/cabinet';
import type {
  CabinetCurrency,
  CabinetSubCycle,
  CabinetSubStatus,
} from '@/entities/subscription/model/cabinet-types';
import { ServicePickerInline } from './ServicePickerInline';
import type { PromoInput, SubscriptionFormInitial } from '../types';

interface Props {
  initial?: SubscriptionFormInitial;
  onClose: () => void;
  onBack?: () => void;
}

export function SubscriptionForm({ initial, onClose, onBack }: Props) {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const [name, setName] = useState(initial?.name ?? '');
  const [char, setChar] = useState(initial?.char ?? '?');
  const [color, setColor] = useState(initial?.color ?? SUB0.blue);
  const [cat, setCat] = useState(initial?.cat ?? 'other');
  const [project, setProject] = useState(initial?.project ?? 'personal');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [cur, setCur] = useState<CabinetCurrency>(initial?.cur ?? 'RUB');
  const [cycle, setCycle] = useState<CabinetSubCycle>(initial?.cycle ?? 'monthly');
  const [nextDate, setNextDate] = useState(initial?.nextDate ?? '');
  const [status, setStatus] = useState<CabinetSubStatus>(initial?.status ?? 'active');
  const [note, setNote] = useState(initial?.note ?? '');
  const [trial, setTrial] = useState(!!initial?.trial);
  const [trialEnds, setTrialEnds] = useState(initial?.trialEnds ?? '');
  const [promos, setPromos] = useState<PromoInput[]>(() => {
    if (initial?.promos && initial.promos.length) return initial.promos;
    if (initial?.promo) {
      return [
        {
          price: initial.promoPrice?.toString() ?? '',
          ends: initial.promoEnds ?? '',
        },
      ];
    }
    return [];
  });

  const addPromo = () => setPromos((p) => [...p, { price: '', ends: '' }]);
  const updatePromo = (i: number, patch: Partial<PromoInput>) =>
    setPromos((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removePromo = (i: number) => setPromos((p) => p.filter((_, j) => j !== i));

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

  const curOpts: SelectOption[] = CURRENCY_OPTIONS.map((o) => ({
    v: o.id,
    l: t(o.label, o.labelEn),
    sub: o.id,
    sym: o.sym,
  }));
  const curSelected = CURRENCY_OPTIONS.find((o) => o.id === cur) ?? CURRENCY_OPTIONS[0]!;

  const statusOpts: SelectOption[] = [
    { v: 'active', l: t('Активна', 'Active') },
    { v: 'paused', l: t('На паузе', 'Paused') },
    { v: 'cancel', l: t('Отменена', 'Cancelled') },
    { v: 'archive', l: t('В архиве', 'Archived') },
  ].map((s) => {
    const color =
      s.v === 'active'
        ? SUB0.good
        : s.v === 'paused'
          ? SUB0.warn
          : s.v === 'cancel'
            ? SUB0.danger
            : SUB0.muted;
    return {
      ...s,
      leading: (
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
      ),
    };
  });

  const catOpts: SelectOption[] = [
    ...CATEGORIES.map((c) => ({
      v: c.id,
      l: t(c.name, c.nameEn),
      leading: (
        <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
      ),
    })),
    {
      v: '__new',
      l: t('+ Создать категорию…', '+ Create category…'),
      leading: (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            border: `1px dashed ${SUB0.muted}`,
            flexShrink: 0,
          }}
        />
      ),
    },
  ];

  const projectOpts: SelectOption[] = PROJECTS.filter((p) => p.id !== 'all').map((p) => ({
    v: p.id,
    l: t(p.name, p.nameEn),
    leading: (
      <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, flexShrink: 0 }} />
    ),
  }));

  const onPickService = (s: { name: string; char: string; color: string; cat: string }) => {
    setName(s.name);
    setChar(s.char);
    setColor(s.color);
    setCat(s.cat);
  };

  const catMeta = CATEGORIES.find((c) => c.id === cat);
  const projMeta = PROJECTS.find((p) => p.id === project);
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
        <LogoPill char={char} color={color} size={44} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {name || t('Без названия', 'Untitled')}
          </div>
          <div style={{ fontSize: 12, color: SUB0.muted, fontFamily: mono }}>
            {catMeta ? t(catMeta.name, catMeta.nameEn) : ''}
            {projMeta ? ` · ${t(projMeta.name, projMeta.nameEn)}` : ''}
          </div>
        </div>
      </div>

      {!initial?.id && <ServicePickerInline onPick={onPickService} />}

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
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inp}
            placeholder={t('Например: Spotify', 'e.g. Spotify')}
          />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Цена', 'Price')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ ...inp, flex: 1, fontFeatureSettings: '"tnum"' }}
              placeholder="0"
            />
            <Select
              value={cur}
              onChange={(v) => setCur(v as CabinetCurrency)}
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
            {([
              ['monthly', t('Месяц', 'Monthly')],
              ['yearly', t('Год', 'Yearly')],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setCycle(k)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: cycle === k ? SUB0.panel : 'transparent',
                  fontSize: 13,
                  fontWeight: 600,
                  color: cycle === k ? SUB0.ink : SUB0.muted,
                  boxShadow: cycle === k ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Категория', 'Category')}</label>
          <Select value={cat} onChange={setCat} width="100%" options={catOpts} />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Проект', 'Project')}</label>
          <Select value={project} onChange={setProject} width="100%" options={projectOpts} />
        </div>

        <div style={fld}>
          <label style={lbl}>{t('Дата следующего списания', 'Next charge date')}</label>
          <DatePicker value={nextDate} onChange={setNextDate} />
        </div>

        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Статус', 'Status')}</label>
          <Select
            value={status}
            onChange={(v) => setStatus(v as CabinetSubStatus)}
            width="100%"
            options={statusOpts}
          />
        </div>

        <div
          style={{
            gridColumn: '1 / -1',
            padding: 14,
            background: trial ? SUB0.bg : 'transparent',
            border: `1px ${trial ? 'solid' : 'dashed'} ${SUB0.line}`,
            borderRadius: 10,
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={trial}
              onChange={(e) => setTrial(e.target.checked)}
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
                background: trial ? SUB0.danger : SUB0.soft,
                color: trial ? '#fff' : SUB0.muted,
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              {t('ПРОБНЫЙ', 'TRIAL')}
            </span>
          </label>

          {trial && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)',
                gap: 12,
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px dashed ${SUB0.line}`,
              }}
            >
              <div style={fld}>
                <label style={lbl}>{t('Окончание пробного', 'Trial ends on')}</label>
                <DatePicker
                  value={trialEnds}
                  onChange={setTrialEnds}
                  placeholder={t('Дата окончания пробного', 'Pick the end date')}
                />
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            gridColumn: '1 / -1',
            padding: 14,
            background: promos.length ? SUB0.bg : 'transparent',
            border: `1px ${promos.length ? 'solid' : 'dashed'} ${SUB0.line}`,
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
                  'Сниженная цена на время акции. Можно добавить несколько — например, новые скидки по ходу подписки.',
                  'Reduced price during a promo. Add multiple — new discounts can appear later.',
                )}
              </div>
            </div>
            <span
              style={{
                fontSize: 9,
                fontFamily: mono,
                fontWeight: 700,
                padding: '2px 6px',
                background: promos.length ? SUB0.blue : SUB0.soft,
                color: promos.length ? '#fff' : SUB0.muted,
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              {t('ПРОМО', 'PROMO')}
            </span>
          </div>

          {promos.length > 0 && (
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
              {promos.map((pr, i) => {
                const promoNum = Number(pr.price);
                const regularNum = Number(price);
                const showSaving = price && pr.price && promoNum < regularNum && regularNum > 0;
                return (
                  <div
                    key={i}
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
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="number"
                          value={pr.price}
                          onChange={(e) => updatePromo(i, { price: e.target.value })}
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
                            {curSelected.sym}
                          </span>
                          <span style={{ fontFamily: mono, fontSize: 12 }}>{curSelected.id}</span>
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
                            `Экономия ${Math.round((1 - promoNum / regularNum) * 100)}% от обычной цены`,
                            `Saving ${Math.round((1 - promoNum / regularNum) * 100)}% vs regular`,
                          )}
                        </div>
                      )}
                    </div>
                    <div style={fld}>
                      <label style={lbl}>{t('Окончание промо', 'Promo ends on')}</label>
                      <DatePicker
                        value={pr.ends}
                        onChange={(v) => updatePromo(i, { ends: v })}
                        placeholder={t('Дата окончания акции', 'Pick the end date')}
                      />
                    </div>
                    <div
                      style={{
                        ...fld,
                        justifySelf: isMobile ? 'end' : 'stretch',
                      }}
                    >
                      {!isMobile && (
                        <label style={{ ...lbl, visibility: 'hidden' }} aria-hidden="true">
                          ×
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => removePromo(i)}
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
              marginTop: promos.length ? 12 : 14,
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
            {promos.length === 0
              ? t('Добавить промо', 'Add promo')
              : t('Ещё промо', 'Another promo')}
          </button>
        </div>

        <div style={{ ...fld, gridColumn: '1 / -1' }}>
          <label style={lbl}>{t('Комментарий', 'Note')}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={inp}
            placeholder={t('Например: семейный аккаунт', 'e.g. family account')}
          />
        </div>
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
        {initial?.id ? (
          <button
            style={{
              ...btnSecondary,
              color: SUB0.danger,
              borderColor: '#f3d6c2',
            }}
            onClick={onClose}
          >
            {t('Удалить', 'Delete')}
          </button>
        ) : onBack ? (
          <button onClick={onBack} style={btnSecondary}>
            ← {t('Выбрать другой сервис', 'Pick another service')}
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={btnSecondary}>
            {t('Отмена', 'Cancel')}
          </button>
          <button onClick={onClose} style={btnPrimary}>
            {initial?.id ? t('Сохранить', 'Save') : t('Создать', 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
