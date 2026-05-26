'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CategoryDto } from '@subzero/shared';

import { listCategories } from '@/shared/api/category';

interface CategoriesCtx {
  items: CategoryDto[];
  loading: boolean;
  bySku: (sku: string | null) => CategoryDto | undefined;
}

const Ctx = createContext<CategoriesCtx>({
  items: [],
  loading: true,
  bySku: () => undefined,
});

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listCategories()
      .then((r) => {
        if (alive) setItems(r);
      })
      .catch(() => {
        // categories — read-only словарь, тихо падаем на пустой
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const bySku = useCallback(
    (sku: string | null) => (sku ? items.find((c) => c.sku === sku) : undefined),
    [items],
  );

  const value = useMemo(() => ({ items, loading, bySku }), [items, loading, bySku]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategories(): CategoriesCtx {
  return useContext(Ctx);
}
