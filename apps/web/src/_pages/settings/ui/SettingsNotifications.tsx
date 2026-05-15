'use client';

import { ReactNode, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { Pill } from '@/shared/components/ui/Pill';
import { MOCK_USER } from '@/shared/constants/cabinet';
import { SectionHead } from './parts/SectionHead';
import { Toggle } from './parts/Toggle';

type ChannelKey = 'email' | 'telegram' | 'max';

interface Channel {
  on: boolean;
  addr: string;
  verified: boolean;
}

interface EventState {
  on: boolean;
  channels: ChannelKey[];
  days?: number[];
}

interface QuietHours {
  on: boolean;
  from: string;
  to: string;
}

const DEFAULT_EVENTS: Record<string, EventState> = {
  upcoming: { on: false, channels: ['email'], days: [3] },
  trialEnd: { on: false, channels: ['email'], days: [3] },
  planRenewal: { on: false, channels: ['email'], days: [3] },
  monthly: { on: false, channels: [] },
  releases: { on: false, channels: ['email'] },
};
const DEFAULT_QUIET: QuietHours = { on: false, from: '22:00', to: '08:00' };

export function SettingsNotifications() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Record<ChannelKey, Channel>>({
    email: { on: true, addr: MOCK_USER.email, verified: true },
    telegram: { on: true, addr: MOCK_USER.telegramHandle, verified: true },
    max: { on: false, addr: '', verified: false },
  });
  const [events, setEvents] = useState<Record<string, EventState>>(() =>
    JSON.parse(JSON.stringify(DEFAULT_EVENTS)),
  );
  const [quiet, setQuiet] = useState<QuietHours>({ ...DEFAULT_QUIET });

  const resetEvents = () => {
    setEvents(JSON.parse(JSON.stringify(DEFAULT_EVENTS)));
    setQuiet({ ...DEFAULT_QUIET });
  };

  const updateEvent = (key: string, ev: EventState) =>
    setEvents((prev) => ({ ...prev, [key]: ev }));

  const channelDefs: { k: ChannelKey; label: string; ic: string; sub: string }[] = [
    { k: 'email', label: 'Email', ic: '✉', sub: t('На электронную почту', 'By email') },
    { k: 'telegram', label: 'Telegram', ic: 'T', sub: t('В чат-бот @sub0_bot', 'Via @sub0_bot') },
    { k: 'max', label: 'MAX', ic: 'M', sub: '' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHead title={t('Каналы доставки', 'Delivery channels')} />
      <Card padding={0}>
        {channelDefs.map((cd) => {
          const c = channels[cd.k];
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
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: c.on ? SUB0.ink : SUB0.soft,
                  color: c.on ? SUB0.bg : SUB0.muted,
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{cd.label}</span>
                  {c.verified && c.on && (
                    <Pill color={SUB0.good} bg={`${SUB0.good}12`} dot>
                      {t('Подключен', 'Connected')}
                    </Pill>
                  )}
                  {!c.verified && (
                    <Pill color={SUB0.muted} bg={SUB0.soft}>
                      {t('Не подключён', 'Not connected')}
                    </Pill>
                  )}
                </div>
                <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>
                  {c.addr || cd.sub}
                </div>
              </div>
              {!c.verified ? (
                <button
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${SUB0.line}`,
                    background: SUB0.panel,
                    color: SUB0.ink,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('Подключить', 'Connect')}
                </button>
              ) : (
                <Toggle
                  value={c.on}
                  onChange={(v) => setChannels({ ...channels, [cd.k]: { ...c, on: v } })}
                />
              )}
            </div>
          );
        })}
      </Card>

      <SectionHead
        title={t('События', 'Events')}
        right={
          <button
            onClick={resetEvents}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${SUB0.line}`,
              background: 'transparent',
              color: SUB0.muted,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ↺ {t('Сбросить', 'Reset')}
          </button>
        }
      />
      <Card padding={0}>
        <NotifEvent
          ev={events.upcoming!}
          setEv={(e) => updateEvent('upcoming', e)}
          label={t('Напоминание о списании', 'Charge reminder')}
          icon="⏱"
          iconColor={SUB0.blue}
          showDays
        />
        <NotifEvent
          ev={events.trialEnd!}
          setEv={(e) => updateEvent('trialEnd', e)}
          label={t('Окончание пробного периода', 'Trial ending')}
          icon="✦"
          iconColor={SUB0.blue}
          showDays
        />
        <NotifEvent
          ev={events.planRenewal!}
          setEv={(e) => updateEvent('planRenewal', e)}
          label={t('Оплата тарифа', 'Plan renewal')}
          icon="₽"
          iconColor={SUB0.blue}
          showDays
        />
        <NotifEvent
          ev={events.monthly!}
          setEv={(e) => updateEvent('monthly', e)}
          label={t('Месячный отчёт', 'Monthly report')}
          sub={t(
            'Сводка расходов в первый день месяца',
            'Spending summary on the 1st',
          )}
          icon="M"
          iconColor={SUB0.muted}
        />
        <NotifEvent
          ev={events.releases!}
          setEv={(e) => updateEvent('releases', e)}
          label={t('Релизы и апдейты', 'Releases & updates')}
          sub={t(
            'Новые функции и важные изменения сервиса',
            'New features and important changes',
          )}
          icon="★"
          iconColor={SUB0.muted}
          last
        />
      </Card>

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
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
              ☾ {t('Тихие часы', 'Quiet hours')}
            </div>
            <div style={{ fontSize: 12, color: SUB0.muted }}>
              {t(
                'Не присылать уведомления в указанный период',
                'No notifications during this time window',
              )}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <input
              type="time"
              value={quiet.from}
              onChange={(e) => setQuiet({ ...quiet, from: e.target.value, on: true })}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${SUB0.line}`,
                background: SUB0.panel,
                fontSize: 13,
                fontFamily: mono,
              }}
            />
            <span style={{ color: SUB0.muted }}>—</span>
            <input
              type="time"
              value={quiet.to}
              onChange={(e) => setQuiet({ ...quiet, to: e.target.value, on: true })}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${SUB0.line}`,
                background: SUB0.panel,
                fontSize: 13,
                fontFamily: mono,
              }}
            />
            <Toggle value={quiet.on} onChange={(v) => setQuiet({ ...quiet, on: v })} />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface NotifEventProps {
  ev: EventState;
  setEv: (ev: EventState) => void;
  label: string;
  sub?: string;
  icon: string;
  iconColor: string;
  showDays?: boolean;
  last?: boolean;
}

function NotifEvent({
  ev,
  setEv,
  label,
  sub,
  icon,
  iconColor,
  showDays,
  last,
}: NotifEventProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const channelLabels: { k: ChannelKey; l: string }[] = [
    { k: 'email', l: 'Email' },
    { k: 'telegram', l: 'TG' },
    { k: 'max', l: 'MAX' },
  ];

  const toggleChan = (c: ChannelKey) => {
    const has = ev.channels.includes(c);
    setEv({
      ...ev,
      channels: has ? ev.channels.filter((x) => x !== c) : [...ev.channels, c],
    });
  };

  const channelButtons = (
    <div style={{ display: 'flex', gap: 4 }}>
      {channelLabels.map(({ k, l }) => {
        const on = ev.channels.includes(k);
        return (
          <button
            key={k}
            onClick={() => toggleChan(k)}
            disabled={!ev.on}
            style={{
              padding: '4px 8px',
              borderRadius: 5,
              border: `1px solid ${on ? SUB0.ink : SUB0.line}`,
              background: on ? SUB0.ink : 'transparent',
              color: on ? SUB0.bg : SUB0.muted,
              fontSize: 10,
              fontFamily: mono,
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: ev.on ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );

  const daysPills: ReactNode = showDays && (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
      {[3, 1, 0].map((d) => {
        const days = ev.days ?? [];
        const on = days.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => {
              const next = on
                ? days.filter((x) => x !== d)
                : [...days, d].sort((a, b) => b - a);
              setEv({ ...ev, days: next, on: next.length > 0 });
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
              cursor: 'pointer',
            }}
          >
            {d === 0 ? t('в день', 'day of') : t(`за ${d} дн.`, `${d}d`)}
          </button>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          padding: '14px 16px',
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
            {sub && (
              <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>{sub}</div>
            )}
          </div>
          <Toggle value={ev.on} onChange={(v) => setEv({ ...ev, on: v })} />
        </div>
        {(showDays || ev.on) && (
          <div
            style={{
              marginLeft: 44,
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {daysPills}
            {channelButtons}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 24px',
        borderBottom: last ? 'none' : `1px solid ${SUB0.line2}`,
      }}
    >
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
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 2 }}>{sub}</div>}
        {daysPills}
      </div>
      {channelButtons}
      <Toggle value={ev.on} onChange={(v) => setEv({ ...ev, on: v })} />
    </div>
  );
}
