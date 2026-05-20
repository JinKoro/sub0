export interface CustomerRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  planId: number;
  stateId: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestContext {
  userAgent: string | null;
  ip: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerRepository {
  /** Active = not soft-deleted. Uniqueness is guaranteed by partial index. */
  findActiveByEmail(email: string): Promise<CustomerRecord | null>;
  /**
   * Soft-deleted (ARCHIVED) customer with this email, if any. Used by
   * register to block re-use of a soft-deleted email — reactivation is a
   * separate flow.
   */
  findArchivedByEmail(email: string): Promise<CustomerRecord | null>;
  findById(id: string): Promise<CustomerRecord | null>;
}

export interface RegisterInput {
  email: string;
  name: string;
  timezone: string;
  localeId?: number;
  marketingConsent?: boolean;
}

export interface RegisterResult {
  status: 'pending_verification';
  email: string;
}

export interface CreateAccountArgs {
  email: string;
  name: string;
  timezone: string;
  localeId: number;
  marketingConsent: boolean;
  sku: string;
  color: string;
  tokenHash: string;
  verifyPath: string;
  expiresAt: Date;
}

export interface ReissueArgs {
  customerId: string;
  email: string;
  localeId: number;
  tokenHash: string;
  verifyPath: string;
  expiresAt: Date;
}

/** All writes happen inside a single Postgres transaction in the adapter. */
export interface RegistrationRepository {
  createNewAccount(args: CreateAccountArgs): Promise<void>;
  reissueVerification(args: ReissueArgs): Promise<void>;
}

export interface NewRefreshTokenRow {
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ip: string | null;
}

export interface RefreshTokenRepository {
  create(row: NewRefreshTokenRow): Promise<void>;
  findByHash(tokenHash: string): Promise<{ customerId: string; revokedAt: Date | null; expiresAt: Date } | null>;
  revoke(tokenHash: string): Promise<void>;
  revokeAllForCustomer(customerId: string): Promise<void>;
}

/** Lockout key: failed-login bucket is `email + IP` (ctx-security §2). */
export interface LoginAttemptKey {
  email: string;
  ip: string | null;
}

/** Public surface of the lockout service (so AuthService is mockable). */
export interface Lockout {
  assertNotLockedOut(key: LoginAttemptKey): Promise<void>;
  recordSuccess(key: LoginAttemptKey): Promise<void>;
  recordFailure(key: LoginAttemptKey): Promise<void>;
}

export interface LoginAttemptRepository {
  record(attempt: LoginAttemptKey & { succeeded: boolean }): Promise<void>;
  /** Most recent successful login for the key, or null. */
  lastSuccessAt(key: LoginAttemptKey): Promise<Date | null>;
  /** Failed attempts for the key with `created_at >= since`. */
  countFailuresSince(args: LoginAttemptKey & { since: Date }): Promise<number>;
  /** Retention: drop rows older than the lockout window. */
  deleteBefore(cutoff: Date): Promise<void>;
}
