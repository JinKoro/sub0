'use client';

import { useEffect, useRef, useState } from 'react';
import type { BillingHistoryEntryDto } from '@subzero/shared';

import { listBillingHistory } from '@/shared/api/billing-history';

interface State {
  items: BillingHistoryEntryDto[];
  loading: boolean;
  error: string | null;
}

/** Ленивая загрузка billing_history за окно [from..to] с локальным кешем по
 *  ключу `${projectSku}|${fromIso}|${toIso}`. Кэш живёт пока компонент
 *  смонтирован — этого достаточно для календаря (юзер редко скроллит на 6+
 *  месяцев назад). */
export function useBillingHistoryRange(
  from: Date | null,
  to: Date | null,
  projectSku: string | undefined,
): State {
  const [state, setState] = useState<State>({ items: [], loading: false, error: null });
  const cache = useRef(new Map<string, BillingHistoryEntryDto[]>());

  const fromIso = from ? from.toISOString() : null;
  const toIso = to ? to.toISOString() : null;
  const key = fromIso && toIso ? `${projectSku ?? '*'}|${fromIso}|${toIso}` : null;

  useEffect(() => {
    if (!key || !fromIso || !toIso) {
      setState({ items: [], loading: false, error: null });
      return;
    }
    const cached = cache.current.get(key);
    if (cached) {
      setState({ items: cached, loading: false, error: null });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    listBillingHistory({ from: fromIso, to: toIso, projectSku })
      .then((res) => {
        if (!alive) return;
        cache.current.set(key, res.items);
        setState({ items: res.items, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (!alive) return;
        setState({ items: [], loading: false, error: e.message });
      });
    return () => {
      alive = false;
    };
  }, [key, fromIso, toIso, projectSku]);

  return state;
}
