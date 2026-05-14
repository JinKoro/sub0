'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// After the first useIsMobile mount on the client, cache the result by breakpoint.
// Subsequent component mounts (e.g. client-side route transitions) skip the
// initial desktop→mobile flash by initializing from the cache. Hydration of
// the very first page still starts at `false` so SSR HTML matches.
const cache = new Map<number, boolean>();

export function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => cache.get(bp) ?? false);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    cache.set(bp, mq.matches);
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      cache.set(bp, e.matches);
      setMobile(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [bp]);

  return mobile;
}
