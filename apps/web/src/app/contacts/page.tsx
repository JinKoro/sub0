import type { Metadata } from 'next';
import { ContactsPage } from '@/_pages/contacts/ui/ContactsPage';

export const metadata: Metadata = {
  title: 'Sub0 — Контакты',
  description: 'Отправьте свой вопрос на email и мы ответим в ближайшее время.',
  openGraph: {
    title: 'Sub0 — Контакты',
    description: 'Отправьте свой вопрос на email и мы ответим в ближайшее время.',
  },
};

export default function Contacts() {
  return <ContactsPage />;
}
