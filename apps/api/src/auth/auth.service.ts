import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { CustomerState, Locale } from '@subzero/shared';

import type {
  AuthTokens,
  CustomerRepository,
  LoginInput,
  RefreshTokenRepository,
  RegisterInput,
  RegisterResult,
  RegistrationRepository,
  RequestContext,
} from './auth.types';
import { createOpaqueToken } from './opaque-token';
import type { PasswordHasher } from './password-hasher';
import { randomProjectColor } from '../shared/project-color';
import { generateSku } from '../shared/sku';
import type { TokenService } from './token.service';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly hasher: PasswordHasher,
    private readonly registration: RegistrationRepository,
  ) {}

  async register(input: RegisterInput, _ctx: RequestContext): Promise<RegisterResult> {
    const email = normalizeEmail(input.email);
    const existing = await this.customers.findActiveByEmail(email);
    // ACTIVE or ARCHIVED — email is taken (the partial unique index would
    // 500 otherwise). Reactivation is a separate flow (#16), not here.
    if (existing && existing.stateId !== CustomerState.CREATED) {
      throw new ConflictException('email already registered');
    }

    const localeId = input.localeId ?? Locale.RU;
    const { token, tokenHash } = createOpaqueToken();
    const verifyPath = `/registration/complete?token=${token}`;
    const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);

    // "Forgot to verify, registers again" — keep the customer/project, just
    // invalidate the old EMAIL_VERIFY token and send a fresh link.
    if (existing && existing.stateId === CustomerState.CREATED) {
      await this.registration.reissueVerification({
        customerId: existing.id,
        email,
        localeId,
        tokenHash,
        verifyPath,
        expiresAt,
      });
      return { status: 'pending_verification', email };
    }

    await this.registration.createNewAccount({
      email,
      name: input.name,
      timezone: input.timezone,
      localeId,
      marketingConsent: input.marketingConsent ?? false,
      sku: generateSku('prj'),
      color: randomProjectColor(),
      tokenHash,
      verifyPath,
      expiresAt,
    });
    return { status: 'pending_verification', email };
  }

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
