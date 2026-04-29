'use client';

import { ReactNode, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export interface FAQItem {
  q: string;
  a: ReactNode;
}

interface Props {
  items: FAQItem[];
  defaultOpenIndex?: number;
  questionFontSize?: { mobile: number; desktop: number };
  closedButtonBg?: string;
}

const DEFAULT_QUESTION_SIZE = { mobile: 15, desktop: 18 };

export function FAQAccordion({
  items,
  defaultOpenIndex = -1,
  questionFontSize = DEFAULT_QUESTION_SIZE,
  closedButtonBg = SUB0.bg,
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpenIndex);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        borderTop: `1px solid ${SUB0.line}`,
      }}
    >
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderBottom: `1px solid ${SUB0.line}` }}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '22px 0',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: isMobile ? questionFontSize.mobile : questionFontSize.desktop,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: SUB0.ink,
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: SUB0.muted,
                  width: 32,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1 }}>{item.q}</span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isOpen ? SUB0.blue : closedButtonBg,
                  color: isOpen ? '#fff' : SUB0.ink,
                  border: `1px solid ${SUB0.line}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  transition: 'all .15s',
                  flexShrink: 0,
                }}
              >
                {isOpen ? '–' : '+'}
              </span>
            </button>
            {isOpen && (
              <div
                style={{
                  padding: '0 0 24px 48px',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: '#444',
                  maxWidth: 680,
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
