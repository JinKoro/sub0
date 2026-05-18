import type { Metadata } from 'next';
import { RegisterCompletePage } from '@/_pages/register-complete/ui/RegisterCompletePage';

export const metadata: Metadata = {
  title: 'Sub0 — Завершить регистрацию',
  description: 'Задайте пароль, чтобы завершить регистрацию в Sub0.',
};

export default async function RegistrationComplete({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <RegisterCompletePage token={token ?? ''} />;
}
