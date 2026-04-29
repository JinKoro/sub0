import type { Metadata } from 'next';
import { FaqPage } from '@/_pages/faq/ui/FaqPage';

export const metadata: Metadata = {
  title: 'Sub0 — Вопросы и ответы',
  description: 'Ответы на ключевые вопросы, которые помогут быстро разобраться в работе сервиса.',
  openGraph: {
    title: 'Sub0 — Вопросы и ответы',
    description:
      'Ответы на ключевые вопросы, которые помогут быстро разобраться в работе сервиса.',
  },
};

export default function Faq() {
  return <FaqPage />;
}
