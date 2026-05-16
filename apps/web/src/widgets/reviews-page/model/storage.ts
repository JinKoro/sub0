import type { Review } from './types';

const STORAGE_KEY = 'sub0_reviews_v2';

export function loadUserReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

export function saveUserReviews(reviews: Review[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // localStorage недоступен (приватный режим, квота) — отзыв останется только в памяти текущей сессии.
  }
}
