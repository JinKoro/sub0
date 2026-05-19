import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import { LangProvider } from '@/shared/contexts/lang-context';
import { LANG_COOKIE, parseLang } from '@/shared/lib/pref-cookies';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-mono',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

export const metadata: Metadata = {
  title: 'Sub0 — Контроль над подписками',
  description: 'Все подписки в одном месте. Один список, ноль сюрпризов.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Sub0',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Sub0 — Контроль над подписками',
    description: 'Все подписки в одном месте. Один список, ноль сюрпризов.',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = parseLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <html lang={lang}>
      <body
        className={`${interTight.className} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
        style={{ letterSpacing: '-0.01em' }}
      >
        <LangProvider initialLang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
