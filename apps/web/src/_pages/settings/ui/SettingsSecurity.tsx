'use client';

import { useState } from 'react';
import { SUB0 } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Card } from '@/shared/components/ui/Card';
import { SectionHead } from './parts/SectionHead';
import { Row } from './parts/Row';
import { Input } from './parts/Input';
import { sBtnPrimary } from './parts/styles';

export function SettingsSecurity() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [pwd, setPwd] = useState({ current: '••••••••', next: '', confirm: '' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHead title={t('Пароль', 'Password')} />
      <Card padding={0}>
        <Row label={t('Текущий пароль', 'Current password')}>
          <Input
            type="password"
            value={pwd.current}
            mono
            onChange={(v) => setPwd({ ...pwd, current: v })}
          />
        </Row>
        <Row
          label={t('Новый пароль', 'New password')}
          hint={t(
            'Минимум 10 символов, буквы и цифры',
            'At least 10 chars with letters and numbers',
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
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: `1px solid ${SUB0.line2}`,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button style={sBtnPrimary}>{t('Обновить пароль', 'Update password')}</button>
        </div>
      </Card>
    </div>
  );
}
