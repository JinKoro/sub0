import type { Metadata } from 'next';
import { LegalPage } from '@/_pages/legal/ui/LegalPage';

export const metadata: Metadata = {
  title: 'Sub0 — Правовые документы',
  description: 'Публичная оферта, политика обработки персональных данных и cookie.',
  openGraph: {
    title: 'Sub0 — Правовые документы',
    description: 'Публичная оферта, политика обработки персональных данных и cookie.',
  },
};

export default function Legal() {
  return <LegalPage />;
}
