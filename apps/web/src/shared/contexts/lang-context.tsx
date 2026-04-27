'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ru' | 'en';

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (ru: string, en: string) => string;
}

const LangContext = createContext<LangCtx>({ lang: 'ru', toggle: () => {}, t: (ru) => ru });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru');
  const toggle = () => setLang((l) => (l === 'ru' ? 'en' : 'ru'));
  const t = (ru: string, en: string) => (lang === 'ru' ? ru : en);
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
