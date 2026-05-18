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
