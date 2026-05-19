'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getMe, savePreferences, type CustomerProfile } from '@/shared/api/customer';

export interface PrefPatch {
  localeId?: number;
  currencyId?: number;
  timezone?: string;
}

interface ProfileCtx {
  profile: CustomerProfile | null;
  loading: boolean;
  /** Initials for the on-the-fly avatar (computed from name/email). */
  initials: string;
  /** Replace the cached profile after a save returns a fresh copy. */
  setProfile: (p: CustomerProfile) => void;
  /**
   * Persist a single preference (locale/currency/timezone) using the
   * current version. On a stale-version 409 it refetches so the next
   * attempt is clean. Used by the header switchers.
   */
  savePref: (patch: PrefPatch) => Promise<void>;
}

const Ctx = createContext<ProfileCtx>({
  profile: null,
  loading: true,
  initials: '·',
  setProfile: () => {},
  savePref: async () => {},
});

export function initialsOf(name: string | null, email: string): string {
  const base = (name ?? '').trim();
  if (base) {
    return (
      base
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') || '·'
    );
  }
  return email.trim()[0]?.toUpperCase() ?? '·';
}

/** Mounted only inside the (app) cabinet group, so the session is valid. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Always read the freshest version inside savePref without re-creating it.
  const profileRef = useRef<CustomerProfile | null>(null);
  profileRef.current = profile;

  const savePref = useCallback(async (patch: PrefPatch) => {
    const cur = profileRef.current;
    if (!cur) return;
    try {
      setProfile(await savePreferences({ ...patch, version: cur.version }));
    } catch {
      // Stale version (other tab) or transient — resync from the server;
      // ProfileSync realigns the contexts to the truth.
      try {
        setProfile(await getMe());
      } catch {
        /* leave as-is */
      }
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getMe()
      .then((p) => alive && setProfile(p))
      .catch(() => {
        /* middleware gates auth; a failure here just leaves it unloaded */
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const initials = profile ? initialsOf(profile.name, profile.email) : '·';

  return (
    <Ctx.Provider value={{ profile, loading, initials, setProfile, savePref }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfile() {
  return useContext(Ctx);
}
