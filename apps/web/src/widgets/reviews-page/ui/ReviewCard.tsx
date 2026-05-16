'use client';

import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { LogoPill } from '@/shared/components/ui/LogoPill';
import { resolveI18n } from '../model/i18n';
import type { Review } from '../model/types';

interface Props {
  review: Review;
}

export function ReviewCard({ review }: Props) {
  const { t, lang } = useLang();
  const quote = resolveI18n(review.quote, lang);
  const role = resolveI18n(review.role, lang);
  const date = resolveI18n(review.date, lang);

  return (
    <div
      className="s-card"
      style={{
        background: SUB0.bg,
        border: `1px solid ${SUB0.line}`,
        borderRadius: 14,
        padding: '24px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
      }}
    >
      {review.pending && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            fontFamily: mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SUB0.warn,
            background: '#fff8e8',
            border: '1px solid #efdba6',
            borderRadius: 999,
            padding: '3px 8px',
          }}
        >
          {t('На модерации', 'Pending')}
        </div>
      )}

      <div
        style={{
          fontFamily: mono,
          fontSize: 11,
          color: SUB0.muted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {date}
      </div>

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: SUB0.ink,
          flex: 1,
          letterSpacing: '-0.005em',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif), "Instrument Serif", serif',
            color: SUB0.blue,
            fontSize: 22,
            lineHeight: 0,
            verticalAlign: '-2px',
            marginRight: 4,
          }}
        >
          “
        </span>
        {quote}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingTop: 14,
          borderTop: `1px dashed ${SUB0.line}`,
        }}
      >
        <LogoPill char={review.init} color={review.color} size={36} square={false} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: SUB0.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {review.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: SUB0.muted,
              fontFamily: mono,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}
