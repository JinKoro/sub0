'use client';

import { useRef, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { Card } from '@/shared/components/ui/Card';
import { MOCK_USER } from '@/shared/constants/cabinet';
import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';
import { SectionHead } from './parts/SectionHead';
import { Row } from './parts/Row';
import { Input } from './parts/Input';
import { SegControl } from './parts/SegControl';
import { TimezoneDropdown } from './parts/TimezoneDropdown';
import { sBtnGhost, sBtnPrimary, sBtnDanger } from './parts/styles';

interface Profile {
  firstName: string;
  email: string;
  timezone: string;
}

export function SettingsAccount() {
  const { t, lang, toggle } = useLang();
  const isMobile = useIsMobile();
  const { currency, setCurrency } = useCabinet();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<Profile>({
    firstName: lang === 'en' ? MOCK_USER.firstNameEn : MOCK_USER.firstName,
    email: MOCK_USER.email,
    timezone: MOCK_USER.timezone,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setAvatarUrl(URL.createObjectURL(f));
  };

  const setLang = (v: 'ru' | 'en') => {
    if (lang !== v) toggle();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <button
            onClick={() => fileRef.current?.click()}
            title={t('Загрузить фото', 'Upload photo')}
            style={{
              position: 'relative',
              width: 64,
              height: 64,
              borderRadius: 999,
              padding: 0,
              background: avatarUrl
                ? `center/cover no-repeat url(${avatarUrl})`
                : SUB0.blue,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.02em',
              overflow: 'visible',
            }}
          >
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
              }}
            >
              {!avatarUrl && MOCK_USER.initials}
            </span>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 24,
                height: 24,
                borderRadius: 999,
                background: SUB0.ink,
                color: SUB0.bg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${SUB0.panel}`,
                boxShadow: '0 2px 6px rgba(10,10,10,.12)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M5.5 3.2L4.6 4.5H2.6A1.6 1.6 0 0 0 1 6.1V12a1.6 1.6 0 0 0 1.6 1.6h10.8A1.6 1.6 0 0 0 15 12V6.1a1.6 1.6 0 0 0-1.6-1.6h-2L10.5 3.2A.8.8 0 0 0 9.85 2.9h-3.7a.8.8 0 0 0-.65.3z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onAvatarPick}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{profile.firstName}</div>
            <div style={{ fontSize: 12, color: SUB0.muted, marginTop: 3 }}>
              {t('Нажмите, чтобы загрузить фото', 'Tap to upload a photo')}
            </div>
          </div>
        </div>

        <Row label={t('Имя', 'First name')}>
          <Input
            value={profile.firstName}
            onChange={(v) => setProfile({ ...profile, firstName: v })}
          />
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
          <button style={sBtnGhost}>{t('Отмена', 'Cancel')}</button>
          <button style={sBtnPrimary}>{t('Сохранить', 'Save changes')}</button>
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
          <TimezoneDropdown
            value={profile.timezone}
            onChange={(v) => setProfile({ ...profile, timezone: v })}
          />
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
          <button style={sBtnDanger}>
            {t('Удалить подписки', 'Delete subscriptions')}
          </button>
        </Row>
        <Row
          label={t('Удалить аккаунт', 'Delete account')}
          hint={t(
            'Безвозвратно удалит профиль и все данные о подписках через 14 дней.',
            'Permanently deletes your profile and all subscription data after 14 days.',
          )}
          last
        >
          <button style={sBtnDanger}>{t('Удалить аккаунт', 'Delete account')}</button>
        </Row>
      </Card>
    </div>
  );
}
