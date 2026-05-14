'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';

export interface PageTab {
  id: string;
  label: string;
  badge?: string;
  soon?: boolean;
}

interface Props {
  tabs: PageTab[];
  active: string;
  onChange: (id: string) => void;
}

export function PageTabs({ tabs, active, onChange }: Props) {
  const { t } = useLang();
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `1px solid ${SUB0.line}`,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tb) => {
        const isActive = active === tb.id;
        const disabled = tb.soon;
        return (
          <button
            key={tb.id}
            onClick={() => !disabled && onChange(tb.id)}
            disabled={disabled}
            style={{
              padding: '12px 18px',
              marginBottom: -1,
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? SUB0.ink : SUB0.muted,
              borderBottom: isActive ? `2px solid ${SUB0.ink}` : '2px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              opacity: disabled ? 0.55 : 1,
            }}
          >
            {tb.label}
            {tb.badge && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: mono,
                  fontWeight: 700,
                  padding: '2px 5px',
                  background: isActive ? SUB0.blue : SUB0.soft,
                  color: isActive ? '#fff' : SUB0.muted,
                  borderRadius: 3,
                  letterSpacing: '0.06em',
                }}
              >
                {tb.badge}
              </span>
            )}
            {tb.soon && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: mono,
                  fontWeight: 700,
                  padding: '2px 5px',
                  background: SUB0.soft,
                  color: SUB0.muted,
                  borderRadius: 3,
                  letterSpacing: '0.06em',
                }}
              >
                {t('СКОРО', 'SOON')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
