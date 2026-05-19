'use client';

import { useState } from 'react';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { ApiError } from '@/shared/api/client';
import { changePassword } from '@/shared/api/customer';
import { SectionHead } from './parts/SectionHead';
import { Row } from './parts/Row';
import { Input } from './parts/Input';
import { sBtnPrimary } from './parts/styles';

export function SettingsSecurity() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = async () => {
    setMsg(null);
    if (pwd.next !== pwd.confirm) {
      setMsg({ ok: false, text: t('Пароли не совпадают', 'Passwords do not match') });
      return;
    }
    setBusy(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      setMsg({
        ok: true,
        text: t(
          'Пароль обновлён. На других устройствах нужно войти заново.',
          'Password updated. Other devices were signed out.',
        ),
      });
    } catch (e) {
      const wrong = e instanceof ApiError && e.status === 401;
      setMsg({
        ok: false,
        text: wrong
          ? t('Текущий пароль неверный', 'Current password is incorrect')
          : t('Пароль не соответствует требованиям', 'Password does not meet the requirements'),
      });
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    pwd.current.length > 0 && pwd.next.length > 0 && pwd.confirm.length > 0 && !busy;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHead title={t('Пароль', 'Password')} />
      <Card padding={0}>
        <Row label={t('Текущий пароль', 'Current password')}>
          <Input
            type="password"
            value={pwd.current}
            mono
            placeholder="••••••••"
            onChange={(v) => setPwd({ ...pwd, current: v })}
          />
        </Row>
        <Row
          label={t('Новый пароль', 'New password')}
          hint={t(
            'Минимум 8 символов, буквы и цифры',
            'At least 8 chars with letters and numbers',
          )}
        >
          <Input
            type="password"
            value={pwd.next}
            mono
            placeholder="••••••••••"
            onChange={(v) => setPwd({ ...pwd, next: v })}
          />
        </Row>
        <Row label={t('Повторите пароль', 'Confirm password')} last>
          <Input
            type="password"
            value={pwd.confirm}
            mono
            placeholder="••••••••••"
            onChange={(v) => setPwd({ ...pwd, confirm: v })}
          />
        </Row>
        <div
          style={{
            padding: isMobile ? '12px 16px' : '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            borderTop: `1px solid ${SUB0.line2}`,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: msg ? (msg.ok ? SUB0.blue : '#9a3b12') : 'transparent',
              minHeight: 18,
            }}
          >
            {msg?.text ?? '·'}
          </span>
          <button style={sBtnPrimary} onClick={onSubmit} disabled={!canSubmit}>
            {busy ? t('Сохранение…', 'Saving…') : t('Обновить пароль', 'Update password')}
          </button>
        </div>
      </Card>
    </div>
  );
}
