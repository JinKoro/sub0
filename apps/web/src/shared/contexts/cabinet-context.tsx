'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';

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

export function CabinetProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CabinetCurrency>('RUB');
  const [project, setProject] = useState<string>('all');
  return (
    <Ctx.Provider value={{ currency, setCurrency, project, setProject }}>{children}</Ctx.Provider>
  );
}

export function useCabinet() {
  return useContext(Ctx);
}
