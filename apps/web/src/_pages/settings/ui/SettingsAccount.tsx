'use client';

import { useEffect, useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useProfile } from '@/shared/contexts/profile-context';
import { Card } from '@/shared/components/ui/Card';
import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';
import { ApiError } from '@/shared/api/client';
import { deleteAccount, savePreferences, saveProfile } from '@/shared/api/customer';
import { SectionHead } from './parts/SectionHead';
import { Row } from './parts/Row';
import { Input } from './parts/Input';
import { SegControl } from './parts/SegControl';
import { TimezoneDropdown } from './parts/TimezoneDropdown';
import { sBtnGhost, sBtnPrimary, sBtnDanger } from './parts/styles';

// shared enums (Locale RU=1/EN=2, Currency RUB=1/USD=2/EUR=3/BYN=4).
const LOCALE_ID: Record<'ru' | 'en', number> = { ru: 1, en: 2 };
const CUR_TO_ID: Record<CabinetCurrency, number> = { RUB: 1, USD: 2, EUR: 3, BYN: 4 };

type SaveState = 'idle' | 'saving' | 'saved';

export function SettingsAccount() {
  const { t, lang, toggle } = useLang();
  const isMobile = useIsMobile();
  const { currency, setCurrency } = useCabinet();
  const { profile, loading, initials, setProfile } = useProfile();

  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [version, setVersion] = useState(1);
  const [profileState, setProfileState] = useState<SaveState>('idle');
  const [prefState, setPrefState] = useState<SaveState>('idle');
  const [err, setErr] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Seed editable state from the shared profile (and re-seed after a save
  // replaces it via setProfile).
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setSavedName(profile.name ?? '');
    setTimezone(profile.timezone);
    setVersion(profile.version);
  }, [profile]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const flashSaved = (set: (s: SaveState) => void) => {
    set('saved');
    timers.current.push(setTimeout(() => set('idle'), 2500));
  };

  const setLang = (v: 'ru' | 'en') => {
    if (lang !== v) toggle();
  };

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 409) {
      setErr(
        t(
          'Профиль изменён в другой вкладке — обновите страницу',
          'Profile changed elsewhere — reload the page',
        ),
      );
    } else {
      setErr(t('Не удалось сохранить', 'Save failed'));
    }
  };

  const onSaveProfile = async () => {
    setProfileState('saving');
    setErr(null);
    try {
      const p = await saveProfile(name, version);
      setProfile(p);
      flashSaved(setProfileState);
    } catch (e) {
      setProfileState('idle');
      fail(e);
    }
  };

  const onCancelProfile = () => {
    setName(savedName);
    setErr(null);
  };

  const onSavePreferences = async () => {
    setPrefState('saving');
    setErr(null);
    try {
      const p = await savePreferences({
        localeId: LOCALE_ID[lang],
        timezone,
        currencyId: CUR_TO_ID[currency],
        version,
      });
      setProfile(p);
      flashSaved(setPrefState);
    } catch (e) {
      setPrefState('idle');
      fail(e);
    }
  };

  const onDeleteAccount = async () => {
    if (
      !window.confirm(
        t(
          'Удалить аккаунт? Профиль и все данные будут удалены через 30 дней.',
          'Delete account? Your profile and all data will be erased after 30 days.',
        ),
      )
    ) {
      return;
    }
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch {
      setErr(t('Не удалось удалить аккаунт', 'Failed to delete account'));
    }
  };

  const profileDirty = name.trim() !== savedName.trim();

  const saveLabel = (s: SaveState) =>
    s === 'saving'
      ? t('Сохранение…', 'Saving…')
      : s === 'saved'
        ? t('Сохранено', 'Saved')
        : t('Сохранить', 'Save changes');

  if (loading || !profile) {
    return (
      <div style={{ padding: 24, color: SUB0.muted, fontSize: 14 }}>
        {t('Загрузка…', 'Loading…')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {err && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: '#fdece5',
            border: '1px solid #f3d6c2',
            color: '#9a3b12',
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}

      <SectionHead title={t('Профиль', 'Profile')} />
      <Card padding={0}>
        <div
          style={{
            padding: isMobile ? '16px 16px' : '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 14 : 18,
            borderBottom: `1px solid ${SUB0.line2}`,
            flexWrap: 'wrap',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: SUB0.blue,
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            {initials}
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{name || profile.email}</div>
            <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>
              {t('Аватар по инициалам имени', 'Avatar from your name initials')}
            </div>
          </div>
        </div>

        <Row label={t('Имя', 'First name')}>
          <Input value={name} onChange={setName} />
        </Row>

        <Row
          label={t('Email', 'Email')}
          hint={t(
            'Email является вашим логином и его нельзя изменить',
            'Email is your login and cannot be changed',
          )}
          last
        >
          <input
            type="email"
            value={profile.email}
            disabled
            readOnly
            style={{
              flex: 1,
              minWidth: 200,
              padding: '9px 12px',
              borderRadius: 8,
              border: `1px solid ${SUB0.line}`,
              background: SUB0.soft,
              fontSize: 14,
              fontFamily: mono,
              color: SUB0.muted,
              outline: 'none',
              cursor: 'not-allowed',
            }}
          />
        </Row>

        <div
          style={{
            padding: isMobile ? '12px 16px' : '14px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: `1px solid ${SUB0.line2}`,
            flexWrap: 'wrap',
          }}
        >
          <button
            style={sBtnGhost}
            onClick={onCancelProfile}
            disabled={!profileDirty || profileState === 'saving'}
          >
            {t('Отмена', 'Cancel')}
          </button>
          <button
            style={sBtnPrimary}
            onClick={onSaveProfile}
            disabled={
              !profileDirty || profileState !== 'idle' || name.trim().length === 0
            }
          >
            {saveLabel(profileState)}
          </button>
        </div>
      </Card>

      <SectionHead title={t('Регион и формат', 'Region & format')} />
      <Card padding={0}>
        <Row label={t('Язык интерфейса', 'Interface language')}>
          <SegControl
            value={lang}
            onChange={setLang}
            options={[
              { id: 'ru', label: 'Русский' },
              { id: 'en', label: 'English' },
            ]}
          />
        </Row>
        <Row label={t('Часовой пояс', 'Timezone')}>
          <TimezoneDropdown value={timezone} onChange={setTimezone} />
        </Row>
        <Row
          label={t('Валюта', 'Currency')}
          hint={t(
            'Используется для сводных сумм. Цены подписок — в оригинальной валюте.',
            'For totals only. Subscription prices remain in their original currency.',
          )}
          last
        >
          <SegControl<CabinetCurrency>
            value={currency}
            onChange={setCurrency}
            options={[
              { id: 'RUB', label: '₽ RUB' },
              { id: 'USD', label: '$ USD' },
              { id: 'BYN', label: 'BYN' },
            ]}
          />
        </Row>
        <div
          style={{
            padding: isMobile ? '12px 16px' : '14px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: `1px solid ${SUB0.line2}`,
            flexWrap: 'wrap',
          }}
        >
          <button
            style={sBtnPrimary}
            onClick={onSavePreferences}
            disabled={prefState === 'saving'}
          >
            {saveLabel(prefState)}
          </button>
        </div>
      </Card>

      <SectionHead title={t('Опасная зона', 'Danger zone')} danger />
      <Card padding={0} style={{ borderColor: '#f3d6c2' }}>
        <Row
          label={t('Удалить все подписки', 'Delete all subscriptions')}
          hint={t(
            'Удалит подписки, историю списаний и календарь. Аккаунт останется активным.',
            'Removes subscriptions, charge history, and calendar. Account stays active.',
          )}
        >
          <button style={sBtnDanger}>{t('Удалить подписки', 'Delete subscriptions')}</button>
        </Row>
        <Row
          label={t('Удалить аккаунт', 'Delete account')}
          hint={t(
            'Безвозвратно удалит профиль и все данные о подписках через 30 дней.',
            'Permanently deletes your profile and all subscription data after 30 days.',
          )}
          last
        >
          <button style={sBtnDanger} onClick={onDeleteAccount}>
            {t('Удалить аккаунт', 'Delete account')}
          </button>
        </Row>
      </Card>
    </div>
  );
}
