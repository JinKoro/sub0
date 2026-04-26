import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import { LangProvider } from '@/shared/contexts/lang-context'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-mono',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Sub0 — Контроль над подписками',
  description: 'Sub0 собирает подписки из писем, файлов или ручного ввода — показывает расходы, напоминает о списаниях и не даёт переплачивать за забытое.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${interTight.className} ${jetbrainsMono.variable} ${instrumentSerif.variable}`} style={{ letterSpacing: '-0.01em' }}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
