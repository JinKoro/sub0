'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { writeLangCookie } from '@/shared/lib/pref-cookies';

type Lang = 'ru' | 'en';

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (ru: string, en: string) => string;
}

const LangContext = createContext<LangCtx>({ lang: 'ru', toggle: () => {}, t: (ru) => ru });

export function LangProvider({
  children,
  initialLang = 'ru',
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const toggle = () =>
    setLang((l) => {
      const next = l === 'ru' ? 'en' : 'ru';
      // Persist so the next reload renders the right language at SSR.
      writeLangCookie(next);
      return next;
    });
  const t = (ru: string, en: string) => (lang === 'ru' ? ru : en);
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
