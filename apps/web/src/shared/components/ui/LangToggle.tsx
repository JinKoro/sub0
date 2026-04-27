'use client';

import { useLang } from '@/shared/contexts/lang-context';
import { SUB0, mono } from '@/shared/constants/tokens';

interface Props {
  dark?: boolean;
}

export function LangToggle({ dark }: Props) {
  const { lang, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      aria-label="language"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
        border: `1px solid ${dark ? '#2a2a2a' : SUB0.line}`,
        borderRadius: 999,
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: mono,
        color: dark ? '#fafaf7' : SUB0.ink,
      }}
    >
      <span style={{ opacity: lang === 'ru' ? 1 : 0.4, fontWeight: 700 }}>RU</span>
      <span style={{ opacity: 0.3 }}>/</span>
      <span style={{ opacity: lang === 'en' ? 1 : 0.4, fontWeight: 700 }}>EN</span>
    </button>
  );
}
