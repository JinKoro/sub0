export interface CustomerRow {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  localeId: number;
  currencyId: number;
  planId: number;
  passwordHash: string | null;
  version: number;
}

/** Public profile shape returned by `GET /customers/me`. */
export interface CustomerProfile {
  email: string;
  name: string | null;
  timezone: string;
  localeId: number;
  currencyId: number;
  planId: number;
  version: number;
}

/** One write covers either the profile card (name) or the region card. */
export interface ProfilePatch {
  name?: string;
  timezone?: string;
  localeId?: number;
  currencyId?: number;
}

export interface CustomerRepository {
  /** Active = not soft-deleted. */
  findActiveById(id: string): Promise<CustomerRow | null>;
  /**
   * Optimistic lock (ctx-architecture §4): `WHERE id = ? AND version = ?`,
   * bumps `version`. Returns false when no row matched (stale version).
   */
  updateProfile(id: string, version: number, patch: ProfilePatch): Promise<boolean>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  /** Soft-delete: `deleted_at = now()`, `state_id = ARCHIVED`. */
  softDelete(id: string): Promise<void>;
  /** 152-ФЗ grace tail: physically drop ARCHIVED customers past the cutoff. */
  hardDeleteArchivedBefore(cutoff: Date): Promise<void>;
}

/** Subset of the auth refresh-token adapter reused for force-logout. */
export interface RefreshTokenRevoker {
  revokeAllForCustomer(customerId: string): Promise<void>;
}
