'use client';

import { useEffect, useMemo, useState } from 'react';
import { SUB0, mono } from '@/shared/constants/tokens';
import { useLang } from '@/shared/contexts/lang-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { SEED_REVIEWS } from '../model/seed';
import { loadUserReviews, saveUserReviews } from '../model/storage';
import type { Review } from '../model/types';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';

const PER_PAGE = 12;

export function ReviewsBody() {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);

  // Гидратация из localStorage происходит после mount: SSR-вывод детерминирован
  // (SSR не знает про localStorage), а после mount подтягиваем пользовательские.
  useEffect(() => {
    setUserReviews(loadUserReviews());
  }, []);

  const all = useMemo<Review[]>(() => [...userReviews, ...SEED_REVIEWS], [userReviews]);
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = all.slice(0, safePage * PER_PAGE);
  const hasMore = visible.length < all.length;

  const handlePublish = (review: Review) => {
    setUserReviews((prev) => {
      const next = [review, ...prev];
      saveUserReviews(next);
      return next;
    });
    setPage(1);
  };

  return (
    <section
      style={{
        background: SUB0.panel,
        borderTop: `1px solid ${SUB0.line}`,
        padding: isMobile ? '40px 20px 80px' : '72px 48px 140px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(320px, 380px) 1fr',
          gap: isMobile ? 40 : 64,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            position: isMobile ? 'static' : 'sticky',
            top: 96,
          }}
        >
          <ReviewForm onSubmit={handlePublish} />
        </div>

        <div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: SUB0.muted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <span style={{ width: 24, height: 1, background: SUB0.line }} />
            {t('Все отзывы', 'All reviews')}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 14 : 18,
            }}
          >
            {visible.map((r, i) => (
              <ReviewCard key={`${r.name}-${i}`} review={r} />
            ))}
          </div>

          {hasMore && (
            <div
              style={{
                marginTop: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                paddingTop: 24,
                borderTop: `1px solid ${SUB0.line}`,
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="s-btn"
                style={{
                  background: SUB0.ink,
                  color: SUB0.bg,
                  border: 'none',
                  borderRadius: 999,
                  padding: '11px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.005em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {t('Показать ещё', 'Show more')}
              </button>
              <div style={{ fontFamily: mono, fontSize: 12, color: SUB0.muted }}>
                {t(
                  `Показано ${visible.length} из ${all.length}`,
                  `Showing ${visible.length} of ${all.length}`,
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
