'use client';

import { ReactNode, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useProfile } from '@/shared/contexts/profile-context';
import { saveNotifications } from '@/shared/api/customer';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { SectionHead } from './parts/SectionHead';
import { Toggle } from './parts/Toggle';

type ChannelKey = 'email' | 'telegram' | 'max';

const ALLOWED_LEAD_DAYS = [3, 1, 0] as const;

interface NoopEventState {
  on: boolean;
  channels: ChannelKey[];
  days?: number[];
}

const NOOP_EVENTS: Record<string, NoopEventState> = {
  trialEnd: { on: false, channels: [], days: [3] },
  planRenewal: { on: false, channels: [], days: [3] },
  monthly: { on: false, channels: [] },
  releases: { on: false, channels: [] },
};

export function SettingsNotifications() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const { profile, setProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = profile?.notificationsEnabled ?? false;
  const leadDays = profile?.notificationLeadDays ?? [];

  async function commit(next: { enabled: boolean; leadDays: number[] }) {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const fresh = await saveNotifications({ ...next, version: profile.version });
      setProfile(fresh);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const channelDefs: { k: ChannelKey; label: string; ic: string; sub: string; mvp: boolean }[] = [
    {
      k: 'email',
      label: 'Email',
      ic: '✉',
      sub: t('На электронную почту', 'By email'),
      mvp: true,
    },
    {
      k: 'telegram',
      label: 'Telegram',
      ic: 'T',
      sub: t('В чат-бот @sub0_bot', 'Via @sub0_bot'),
      mvp: false,
    },
    { k: 'max', label: 'MAX', ic: 'M', sub: '', mvp: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: saving ? 0.75 : 1 }}>
      <SectionHead title={t('Каналы доставки', 'Delivery channels')} />
      <Card padding={0}>
        {channelDefs.map((cd) => {
          const isEmail = cd.k === 'email';
          const channelOn = isEmail ? enabled : false;
          return (
            <div
              key={cd.k}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 12 : 16,
                padding: isMobile ? '14px 16px' : '16px 24px',
                borderBottom: `1px solid ${SUB0.line2}`,
                flexWrap: 'wrap',
                opacity: cd.mvp ? 1 : 0.55,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: channelOn ? SUB0.ink : SUB0.soft,
                  color: channelOn ? SUB0.bg : SUB0.muted,
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
                  {!cd.mvp && (
                    <Pill color={SUB0.muted} bg={SUB0.soft}>
                      v1.1
                    </Pill>
                  )}
                  {isEmail && channelOn && profile && (
                    <Pill color={SUB0.good} bg={`${SUB0.good}12`} dot>
                      {t('Подключен', 'Connected')}
                    </Pill>
                  )}
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>
                  {isEmail && profile ? profile.email : cd.sub}
                </div>
              </div>
              {isEmail ? (
                <Toggle
                  value={enabled}
                  onChange={(v) => commit({ enabled: v, leadDays })}
                />
              ) : (
                <button
                  disabled
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${SUB0.line}`,
                    background: SUB0.panel,
                    color: SUB0.muted,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'not-allowed',
                  }}
                >
                  {t('Подключить', 'Connect')}
                </button>
              )}
            </div>
          );
        })}
      </Card>

      {error && (
        <div style={{ fontSize: 13, color: SUB0.danger, fontFamily: mono }}>
          {t('Не удалось сохранить', 'Failed to save')}: {error}
        </div>
      )}

      <SectionHead title={t('События', 'Events')} />
      <Card padding={0}>
        <NotifEvent
          label={t('Напоминание о списании', 'Charge reminder')}
          icon="⏱"
          iconColor={SUB0.blue}
          enabled={enabled}
          days={leadDays}
          onDaysChange={(next) => commit({ enabled: next.length > 0 ? true : enabled, leadDays: next })}
        />
        {(['trialEnd', 'planRenewal', 'monthly', 'releases'] as const).map((k, i, arr) => {
          const meta = {
            trialEnd: {
              label: t('Окончание пробного периода', 'Trial ending'),
              icon: '✦',
              iconColor: SUB0.blue,
            },
            planRenewal: {
              label: t('Оплата тарифа', 'Plan renewal'),
              icon: '₽',
              iconColor: SUB0.blue,
            },
            monthly: {
              label: t('Месячный отчёт', 'Monthly report'),
              icon: 'M',
              iconColor: SUB0.muted,
              sub: t('Сводка расходов в первый день месяца', 'Spending summary on the 1st'),
            },
            releases: {
              label: t('Релизы и апдейты', 'Releases & updates'),
              icon: '★',
              iconColor: SUB0.muted,
              sub: t('Новые функции и важные изменения сервиса', 'New features and important changes'),
            },
          }[k];
          return (
            <DisabledEvent
              key={k}
              label={meta.label}
              sub={'sub' in meta ? meta.sub : undefined}
              icon={meta.icon}
              iconColor={meta.iconColor}
              last={i === arr.length - 1}
            />
          );
        })}
      </Card>

      <Card padding={isMobile ? 16 : 20} style={{ opacity: 0.55 }}>
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
              <Pill color={SUB0.muted} bg={SUB0.soft}>
                v1.1
              </Pill>
            </div>
            <div style={{ fontSize: 12, color: SUB0.muted }}>
              {t(
                'Не присылать уведомления в указанный период',
                'No notifications during this time window',
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface NotifEventProps {
  label: string;
  icon: string;
  iconColor: string;
  enabled: boolean;
  days: number[];
  onDaysChange: (next: number[]) => void;
}

function NotifEvent({ label, icon, iconColor, enabled, days, onDaysChange }: NotifEventProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();

  const dayPills: ReactNode = (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
      {ALLOWED_LEAD_DAYS.map((d) => {
        const on = days.includes(d);
        return (
          <button
            key={d}
            type="button"
            disabled={!enabled}
            onClick={() => {
              const next = on
                ? days.filter((x) => x !== d)
                : [...days, d].sort((a, b) => b - a);
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
  );

  return (
    <div
      style={{
        padding: isMobile ? '14px 16px' : '16px 24px',
        borderBottom: `1px solid ${SUB0.line2}`,
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
          {dayPills}
        </div>
      </div>
    </div>
  );
}

interface DisabledEventProps {
  label: string;
  sub?: string;
  icon: string;
  iconColor: string;
  last?: boolean;
}

function DisabledEvent({ label, sub, icon, iconColor, last }: DisabledEventProps) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        padding: isMobile ? '14px 16px' : '16px 24px',
        borderBottom: last ? 'none' : `1px solid ${SUB0.line2}`,
        opacity: 0.55,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
            <Pill color={SUB0.muted} bg={SUB0.soft}>
              v1.1
            </Pill>
          </div>
          {sub && <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// Suppress unused warning until v1.1 reuses NOOP_EVENTS.
void NOOP_EVENTS;
