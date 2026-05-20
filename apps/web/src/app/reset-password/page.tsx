import type { Metadata } from 'next';
import { ResetPasswordPage } from '@/_pages/reset-password/ui/ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Sub0 — Новый пароль',
  description: 'Задайте новый пароль для входа в Sub0.',
};

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordPage token={token ?? ''} />;
}
