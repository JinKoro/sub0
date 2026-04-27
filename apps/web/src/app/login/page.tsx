import type { Metadata } from 'next';
import { LoginPage } from '@/_pages/login/ui/LoginPage';

export const metadata: Metadata = {
  title: 'Sub0 — Войти',
  description: 'Войдите в свой аккаунт Sub0, чтобы управлять подписками.',
};

export default function Login() {
  return <LoginPage />;
}
