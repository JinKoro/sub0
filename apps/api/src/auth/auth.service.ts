import { UnauthorizedException } from '@nestjs/common';
import { CustomerState } from '@subzero/shared';

import type {
  AuthTokens,
  CustomerRepository,
  LoginInput,
  RefreshTokenRepository,
  RequestContext,
} from './auth.types';
import type { PasswordHasher } from './password-hasher';
import type { TokenService } from './token.service';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly hasher: PasswordHasher,
  ) {}

  async login(input: LoginInput, ctx: RequestContext): Promise<AuthTokens> {
    const customer = await this.customers.findActiveByEmail(normalizeEmail(input.email));
    if (!customer || !customer.passwordHash || customer.stateId !== CustomerState.ACTIVE) {
      throw new UnauthorizedException();
    }
    const ok = await this.hasher.verify(customer.passwordHash, input.password);
    if (!ok) {
      throw new UnauthorizedException();
    }

    const accessToken = this.tokens.signAccess({ sub: customer.id, plan: customer.planId });
    const refresh = this.tokens.signRefresh(customer.id);
    await this.refreshTokens.create({
      customerId: customer.id,
      tokenHash: this.tokens.hashRefresh(refresh.token),
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    return { accessToken, refreshToken: refresh.token };
  }

  async refresh(presentedToken: string, ctx: RequestContext): Promise<AuthTokens> {
    try {
      this.tokens.verifyRefresh(presentedToken);
    } catch {
      throw new UnauthorizedException();
    }

    const presentedHash = this.tokens.hashRefresh(presentedToken);
    const row = await this.refreshTokens.findByHash(presentedHash);
    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException();
    }

    const customer = await this.customers.findById(row.customerId);
    if (!customer || customer.stateId !== CustomerState.ACTIVE) {
      throw new UnauthorizedException();
    }

    // Rotation: the presented token is single-use — revoke before issuing the new pair.
    await this.refreshTokens.revoke(presentedHash);

    const accessToken = this.tokens.signAccess({ sub: customer.id, plan: customer.planId });
    const refresh = this.tokens.signRefresh(customer.id);
    await this.refreshTokens.create({
      customerId: customer.id,
      tokenHash: this.tokens.hashRefresh(refresh.token),
      expiresAt: refresh.expiresAt,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    return { accessToken, refreshToken: refresh.token };
  }

  async logout(customerId: string): Promise<void> {
    await this.refreshTokens.revokeAllForCustomer(customerId);
  }
}
