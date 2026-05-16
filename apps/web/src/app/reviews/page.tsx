import type { Metadata } from 'next';
import { ReviewsPage } from '@/_pages/reviews/ui/ReviewsPage';

export const metadata: Metadata = {
  title: 'Sub0 — Отзывы',
  description: 'Что говорят о Sub0 те, кто навёл порядок в подписках. Поделитесь своим опытом.',
  openGraph: {
    title: 'Sub0 — Отзывы',
    description: 'Что говорят о Sub0 те, кто навёл порядок в подписках. Поделитесь своим опытом.',
  },
};

export default function Reviews() {
  return <ReviewsPage />;
}
