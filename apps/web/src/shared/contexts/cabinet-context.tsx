'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';
import { writeCurrencyCookie } from '@/shared/lib/pref-cookies';

interface CabinetCtx {
  currency: CabinetCurrency;
  setCurrency: (c: CabinetCurrency) => void;
  project: string;
  setProject: (p: string) => void;
}

const Ctx = createContext<CabinetCtx>({
  currency: 'RUB',
  setCurrency: () => {},
  project: 'all',
  setProject: () => {},
});

export function CabinetProvider({
  children,
  initialCurrency = 'RUB',
}: {
  children: ReactNode;
  initialCurrency?: CabinetCurrency;
}) {
  const [currency, setCurrencyState] = useState<CabinetCurrency>(initialCurrency);
  const [project, setProject] = useState<string>('all');
  const setCurrency = useCallback((c: CabinetCurrency) => {
    // Persist so the next reload renders the right currency at SSR.
    writeCurrencyCookie(c);
    setCurrencyState(c);
  }, []);
  return (
    <Ctx.Provider value={{ currency, setCurrency, project, setProject }}>{children}</Ctx.Provider>
  );
}

export function useCabinet() {
  return useContext(Ctx);
}
