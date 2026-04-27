'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// useLayoutEffect fires before browser paint (eliminates mobile layout flash),
// useEffect is used server-side where layout effects are no-ops anyway.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [bp]);

  return mobile;
}
