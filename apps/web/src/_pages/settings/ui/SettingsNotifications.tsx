'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  NotificationChannelType,
  NotificationEvent,
  type NotificationPreferenceDto,
  type NotificationSettingsDto,
  type QuietHoursDto,
} from '@subzero/shared';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useProfile } from '@/shared/contexts/profile-context';
import {
  connectChannel,
  disconnectChannel,
  getNotificationSettings,
  updatePreferences,
  updateQuietHours,
} from '@/shared/api/notifications';
import { getMe } from '@/shared/api/customer';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { SectionHead } from './parts/SectionHead';
import { Toggle } from './parts/Toggle';

const ALLOWED_LEAD_DAYS = [3, 1, 0] as const;

/** Какие события поддерживают day-pills. RELEASES/MONTHLY — без дней. */
const DAYS_AWARE = new Set<number>([
  NotificationEvent.UPCOMING_CHARGE,
  NotificationEvent.TRIAL_END,
  NotificationEvent.PLAN_RENEWAL,
]);

interface EventMeta {
  label: { ru: string; en: string };
  sub?: { ru: string; en: string };
  icon: string;
  iconColor: string;
}

const EVENT_META: Record<number, EventMeta> = {
  [NotificationEvent.UPCOMING_CHARGE]: {
    label: { ru: 'Напоминание о списании', en: 'Charge reminder' },
    icon: '⏱',
    iconColor: SUB0.blue,
  },
  [NotificationEvent.TRIAL_END]: {
    label: { ru: 'Окончание пробного периода', en: 'Trial ending' },
    icon: '✦',
    iconColor: SUB0.blue,
  },
  [NotificationEvent.PLAN_RENEWAL]: {
    label: { ru: 'Оплата тарифа', en: 'Plan renewal' },
    icon: '₽',
    iconColor: SUB0.blue,
  },
  [NotificationEvent.MONTHLY_REPORT]: {
    label: { ru: 'Месячный отчёт', en: 'Monthly report' },
    sub: {
      ru: 'Сводка расходов в первый день месяца',
      en: 'Spending summary on the 1st',
    },
    icon: 'M',
    iconColor: SUB0.muted,
  },
  [NotificationEvent.RELEASES]: {
    label: { ru: 'Релизы и апдейты', en: 'Releases & updates' },
    sub: {
      ru: 'Новые функции и важные изменения сервиса',
      en: 'New features and important changes',
    },
    icon: '★',
    iconColor: SUB0.muted,
  },
};

const EVENT_ORDER = [
  NotificationEvent.UPCOMING_CHARGE,
  NotificationEvent.TRIAL_END,
  NotificationEvent.PLAN_RENEWAL,
  NotificationEvent.MONTHLY_REPORT,
  NotificationEvent.RELEASES,
];

export function SettingsNotifications() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const { profile, setProfile } = useProfile();
  const [settings, setSettings] = useState<NotificationSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNotificationSettings()
      .then((data) => {
        if (alive) setSettings(data);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const prefsByEvent = useMemo(() => {
    const m = new Map<number, NotificationPreferenceDto>();
    for (const p of settings?.preferences ?? []) m.set(p.eventId, p);
    return m;
  }, [settings]);

  async function patchPreference(
    eventId: number,
    patch: Partial<Pick<NotificationPreferenceDto, 'enabled' | 'daysBefore' | 'channelTypeIds'>>,
  ): Promise<void> {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const fresh = await updatePreferences({
        items: [{ eventId, ...patch }],
      });
      setSettings(fresh);
    } catch (e) {
      setError(t('Не удалось сохранить', 'Failed to save') + ': ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function patchQuietHours(next: {
    enabled: boolean;
    from?: string | null;
    to?: string | null;
  }): Promise<void> {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const fresh = await updateQuietHours({
        enabled: next.enabled,
        from: next.from ?? null,
        to: next.to ?? null,
        version: profile.version,
      });
      setSettings((s) => (s ? { ...s, quietHours: fresh } : s));
      // customer.version изменился — синхронизируем профиль, иначе
      // следующий PATCH quiet-hours упадёт с 409.
      setProfile(await getMe());
    } catch (e) {
      setError(t('Не удалось сохранить', 'Failed to save') + ': ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function connectCh(typeId: number): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const res = await connectChannel(typeId);
      // TG/MAX: открываем deep-link с одноразовым nonce. Верификация
      // (bot-webhook) — отдельная задача; до неё канал остаётся pending.
      if (res.deepLink) window.open(res.deepLink, '_blank', 'noopener,noreferrer');
      setSettings(await getNotificationSettings());
    } catch (e) {
      setError(t('Не удалось подключить', 'Failed to connect') + ': ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function disconnectCh(typeId: number): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await disconnectChannel(typeId);
      setSettings(await getNotificationSettings());
    } catch (e) {
      setError(t('Не удалось отключить', 'Failed to disconnect') + ': ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: SUB0.muted, fontSize: 14, fontFamily: mono }}>
        {t('Загрузка…', 'Loading…')}
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ padding: 24, color: SUB0.danger, fontSize: 14 }}>
        {error ?? t('Не удалось загрузить', 'Failed to load')}
      </div>
    );
  }

  const channelByType = new Map(settings.channels.map((c) => [c.typeId, c]));
  const channelDefs: Array<{
    type: number;
    label: string;
    ic: string;
    sub: string;
    // base — базовый EMAIL (нельзя отключить); linkable — connect через
    // deep-link (Telegram); soon — бот/ссылки пока нет (MAX).
    mode: 'base' | 'linkable' | 'soon';
  }> = [
    {
      type: NotificationChannelType.EMAIL,
      label: 'Email',
      ic: '✉',
      sub: t('На электронную почту', 'By email'),
      mode: 'base',
    },
    {
      type: NotificationChannelType.TELEGRAM,
      label: 'Telegram',
      ic: 'T',
      sub: t('В чат-бот @sub0_bot', 'Via @sub0_bot'),
      mode: 'linkable',
    },
    {
      type: NotificationChannelType.MAX,
      label: 'MAX',
      ic: 'M',
      sub: '',
      mode: 'soon',
    },
  ];

  const btnStyle = (variant: 'primary' | 'ghost' | 'disabled') => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${variant === 'primary' ? SUB0.ink : SUB0.line}`,
    background: variant === 'primary' ? SUB0.ink : SUB0.panel,
    color: variant === 'primary' ? SUB0.bg : variant === 'disabled' ? SUB0.muted : SUB0.ink,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: variant === 'disabled' || saving ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: saving ? 0.75 : 1 }}>
      <SectionHead title={t('Каналы доставки', 'Delivery channels')} />
      <Card padding={0}>
        {channelDefs.map((cd) => {
          const ch = channelByType.get(cd.type);
          const verified = ch?.verified ?? false;
          const pending = !!ch && ch.enabled && !ch.verified;
          // EMAIL виден как подключённый (verified seeded-каналом).
          const active = verified;
          const addressText =
            cd.type === NotificationChannelType.EMAIL
              ? (ch?.address ?? profile?.email ?? cd.sub)
              : verified
                ? (ch?.address ?? cd.sub)
                : pending
                  ? t('Ожидает подтверждения в боте', 'Awaiting confirmation in bot')
                  : cd.sub;
          return (
            <div
              key={cd.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 12 : 16,
                padding: isMobile ? '14px 16px' : '16px 24px',
                borderBottom: `1px solid ${SUB0.line2}`,
                flexWrap: 'wrap',
                opacity: cd.mode === 'soon' ? 0.55 : 1,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: active ? SUB0.ink : SUB0.soft,
                  color: active ? SUB0.bg : SUB0.muted,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  fontFamily: mono,
                }}
              >
                {cd.ic}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{cd.label}</span>
                  {cd.mode === 'soon' && (
                    <Pill color={SUB0.muted} bg={SUB0.soft}>
                      {t('скоро', 'soon')}
                    </Pill>
                  )}
                  {verified && (
                    <Pill color={SUB0.good} bg={`${SUB0.good}12`} dot>
                      {t('Подключен', 'Connected')}
                    </Pill>
                  )}
                  {pending && (
                    <Pill color={SUB0.muted} bg={SUB0.soft} dot>
                      {t('Ожидает', 'Pending')}
                    </Pill>
                  )}
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>{addressText}</div>
              </div>
              {cd.mode === 'soon' && (
                <button disabled style={btnStyle('disabled')}>
                  {t('Подключить', 'Connect')}
                </button>
              )}
              {cd.mode === 'linkable' &&
                (verified || pending ? (
                  <button
                    disabled={saving}
                    onClick={() => disconnectCh(cd.type)}
                    style={btnStyle('ghost')}
                  >
                    {t('Отключить', 'Disconnect')}
                  </button>
                ) : (
                  <button
                    disabled={saving}
                    onClick={() => connectCh(cd.type)}
                    style={btnStyle('primary')}
                  >
                    {t('Подключить', 'Connect')}
                  </button>
                ))}
            </div>
          );
        })}
      </Card>

      {error && (
        <div style={{ fontSize: 13, color: SUB0.danger, fontFamily: mono }}>{error}</div>
      )}

      <SectionHead title={t('События', 'Events')} />
      <Card padding={0}>
        {EVENT_ORDER.map((eventId, idx) => {
          const meta = EVENT_META[eventId];
          if (!meta) return null;
          const pref = prefsByEvent.get(eventId);
          // На случай, если бэк вдруг не отдал событие — рисуем как disabled-дефолт.
          const enabled = pref?.enabled ?? false;
          const daysBefore = pref?.daysBefore ?? [];
          return (
            <EventRow
              key={eventId}
              label={lang === 'en' ? meta.label.en : meta.label.ru}
              sub={meta.sub ? (lang === 'en' ? meta.sub.en : meta.sub.ru) : undefined}
              icon={meta.icon}
              iconColor={meta.iconColor}
              enabled={enabled}
              daysBefore={daysBefore}
              showDays={DAYS_AWARE.has(eventId)}
              last={idx === EVENT_ORDER.length - 1}
              onToggle={(on) =>
                patchPreference(eventId, {
                  enabled: on,
                  // При включении впервые подставляем дефолтные каналы [EMAIL] и
                  // days [3] для UPCOMING_CHARGE / иначе пусто.
                  channelTypeIds:
                    on && !pref?.channelTypeIds?.length
                      ? [NotificationChannelType.EMAIL]
                      : pref?.channelTypeIds,
                  daysBefore:
                    on && DAYS_AWARE.has(eventId) && !pref?.daysBefore?.length
                      ? [3]
                      : pref?.daysBefore,
                })
              }
              onDaysChange={(next) =>
                patchPreference(eventId, {
                  daysBefore: next,
                  // Если все дни сняты — выключаем; первый день включает обратно.
                  enabled: next.length > 0,
                  channelTypeIds:
                    next.length > 0 && !pref?.channelTypeIds?.length
                      ? [NotificationChannelType.EMAIL]
                      : pref?.channelTypeIds,
                })
              }
            />
          );
        })}
      </Card>

      <QuietHoursCard
        value={settings.quietHours}
        onCommit={patchQuietHours}
        disabled={saving}
      />
    </div>
  );
}

interface EventRowProps {
  label: string;
  sub?: string;
  icon: string;
  iconColor: string;
  enabled: boolean;
  daysBefore: number[];
  showDays: boolean;
  last?: boolean;
  onToggle: (on: boolean) => void;
  onDaysChange: (next: number[]) => void;
}

function EventRow({
  label,
  sub,
  icon,
  iconColor,
  enabled,
  daysBefore,
  showDays,
  last,
  onToggle,
  onDaysChange,
}: EventRowProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const dayPills: ReactNode = showDays ? (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
      {ALLOWED_LEAD_DAYS.map((d) => {
        const on = daysBefore.includes(d);
        return (
          <button
            key={d}
            type="button"
            disabled={!enabled}
            onClick={() => {
              const next = on
                ? daysBefore.filter((x) => x !== d)
                : [...daysBefore, d].sort((a, b) => b - a);
              onDaysChange(next);
            }}
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: `1px solid ${on ? SUB0.ink : SUB0.line}`,
              background: on ? SUB0.ink : 'transparent',
              color: on ? SUB0.bg : SUB0.muted,
              fontSize: 11,
              fontFamily: mono,
              fontWeight: 700,
              cursor: enabled ? 'pointer' : 'not-allowed',
              opacity: enabled ? 1 : 0.6,
            }}
          >
            {d === 0 ? t('в день', 'day of') : t(`за ${d} дн.`, `${d}d`)}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div
      style={{
        padding: isMobile ? '14px 16px' : '16px 24px',
        borderBottom: last ? 'none' : `1px solid ${SUB0.line2}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${iconColor}18`,
            color: iconColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>{sub}</div>}
          {dayPills}
        </div>
        <Toggle value={enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

interface QuietHoursCardProps {
  value: QuietHoursDto;
  onCommit: (next: { enabled: boolean; from?: string | null; to?: string | null }) => void;
  disabled: boolean;
}

function QuietHoursCard({ value, onCommit, disabled }: QuietHoursCardProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [from, setFrom] = useState(value.from ?? '22:00');
  const [to, setTo] = useState(value.to ?? '09:00');

  useEffect(() => {
    setFrom(value.from ?? '22:00');
    setTo(value.to ?? '09:00');
  }, [value.from, value.to]);

  const inp: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${SUB0.line}`,
    background: SUB0.panel,
    color: SUB0.ink,
    fontSize: 13,
    fontFamily: mono,
    width: 100,
  };

  return (
    <Card padding={isMobile ? 16 : 20}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            ☾ {t('Тихие часы', 'Quiet hours')}
          </div>
          <div style={{ fontSize: 12, color: SUB0.muted }}>
            {t(
              'Не присылать уведомления в указанный период (по вашему часовому поясу)',
              'No notifications during this window (your local time)',
            )}
          </div>
        </div>
        <Toggle
          value={value.enabled}
          onChange={(on) => onCommit({ enabled: on, from, to })}
        />
      </div>
      {value.enabled && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontFamily: mono, color: SUB0.muted }}>
              {t('С', 'From')}
            </span>
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onBlur={() => {
                if (from !== value.from) onCommit({ enabled: true, from, to });
              }}
              disabled={disabled}
              style={inp}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontFamily: mono, color: SUB0.muted }}>
              {t('До', 'To')}
            </span>
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onBlur={() => {
                if (to !== value.to) onCommit({ enabled: true, from, to });
              }}
              disabled={disabled}
              style={inp}
            />
          </label>
        </div>
      )}
    </Card>
  );
}
