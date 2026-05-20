import type { Metadata } from 'next';
import { ForgotPasswordPage } from '@/_pages/forgot-password/ui/ForgotPasswordPage';

export const metadata: Metadata = {
  title: 'Sub0 — Сброс пароля',
  description: 'Запросите ссылку для установки нового пароля в Sub0.',
};

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
