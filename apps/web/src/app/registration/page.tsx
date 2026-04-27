import type { Metadata } from 'next'
import { RegisterPage } from '@/_pages/register/ui/RegisterPage'

export const metadata: Metadata = {
  title: 'Sub0 — Регистрация',
  description: 'Создайте аккаунт Sub0, чтобы держать все подписки в одном месте.',
}

export default function Register() {
  return <RegisterPage />
}
