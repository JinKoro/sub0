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
