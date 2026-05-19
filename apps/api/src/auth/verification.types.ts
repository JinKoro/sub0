export interface TokenRow {
  id: string;
  customerId: string;
  typeId: number;
  expiresAt: Date;
  usedAt: Date | null;
  customerStateId: number;
  customerEmail: string;
  customerPlanId: number;
}

export interface CompleteRegistrationArgs {
  tokenId: string;
  customerId: string;
  passwordHash: string;
}

export interface CreatePasswordResetArgs {
  customerId: string;
  email: string;
  localeId: number;
  tokenHash: string;
  verifyPath: string;
  expiresAt: Date;
}

export interface CompletePasswordResetArgs {
  tokenId: string;
  customerId: string;
  passwordHash: string;
}

export interface ActiveCustomer {
  id: string;
  localeId: number;
  stateId: number;
  email: string;
}

/** Each mutating method runs inside a single Postgres transaction. */
export interface VerificationRepository {
  findToken(tokenHash: string): Promise<TokenRow | null>;
  completeRegistration(args: CompleteRegistrationArgs): Promise<void>;
  createPasswordReset(args: CreatePasswordResetArgs): Promise<void>;
  completePasswordReset(args: CompletePasswordResetArgs): Promise<void>;
  findActiveCustomerByEmail(email: string): Promise<ActiveCustomer | null>;
}

export interface VerifyEmailInput {
  token: string;
  password?: string;
}

export interface VerifyEmailResult {
  accessToken: string;
  refreshToken: string;
  customer: { id: string; email: string };
}
