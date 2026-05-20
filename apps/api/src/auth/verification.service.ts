import { BadRequestException } from '@nestjs/common';
import { CustomerState, VerificationTokenType, isValidPassword } from '@subzero/shared';

import type { RefreshTokenRepository, RegistrationRepository, RequestContext } from './auth.types';
import { createOpaqueToken, hashToken } from './opaque-token';
import type { PasswordHasher } from './password-hasher';
import type { TokenService } from './token.service';
import type {
  ForgotPasswordResult,
  TokenRow,
  VerificationRepository,
  VerifyEmailInput,
  VerifyEmailResult,
} from './verification.types';

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class VerificationService {
  constructor(
    private readonly repo: VerificationRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly registration: RegistrationRepository,
    private readonly tokens: TokenService,
    private readonly hasher: PasswordHasher,
  ) {}

  /** Loads a token and rejects (400) if missing / used / expired. */
  private async validToken(rawToken: string, expectedType: number): Promise<TokenRow> {
    const row = await this.repo.findToken(hashToken(rawToken));
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now() || row.typeId !== expectedType) {
      throw new BadRequestException('invalid or expired token');
    }
    return row;
  }

  async verifyEmail(input: VerifyEmailInput, ctx: RequestContext): Promise<VerifyEmailResult> {
    const row = await this.validToken(input.token, VerificationTokenType.EMAIL_VERIFY);

    if (row.customerStateId === CustomerState.CREATED) {
      if (!input.password || !isValidPassword(input.password)) {
        throw new BadRequestException('password required');
      }
      const passwordHash = await this.hasher.hash(input.password);
      await this.repo.completeRegistration({
        tokenId: row.id,
        customerId: row.customerId,
        passwordHash,
      });

      const accessToken = this.tokens.signAccess({ sub: row.customerId, plan: row.customerPlanId });
      const refresh = this.tokens.signRefresh(row.customerId);
      await this.refreshTokens.create({
        customerId: row.customerId,
        tokenHash: this.tokens.hashRefresh(refresh.token),
        expiresAt: refresh.expiresAt,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
      });
      return {
        accessToken,
        refreshToken: refresh.token,
        customer: { id: row.customerId, email: row.customerEmail },
      };
    }

    throw new BadRequestException('token not applicable to customer state');
  }

  /** "Send me the link again" — only meaningful while the customer is CREATED. */
  async resendVerification(email: string): Promise<{ status: 'sent' }> {
    const c = await this.repo.findActiveCustomerByEmail(normalizeEmail(email));
    if (c && c.stateId === CustomerState.CREATED) {
      const { token, tokenHash } = createOpaqueToken();
      await this.registration.reissueVerification({
        customerId: c.id,
        email: c.email,
        localeId: c.localeId,
        tokenHash,
        verifyPath: `/registration/complete?token=${token}`,
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      });
    }
    return { status: 'sent' };
  }

  /**
   * Unknown email → 200 `sent` (anti-enumeration).
   * Archived account → 200 `archived` so the UI can explain instead of
   * silently lying — register flow already leaks the same info via 409.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const norm = normalizeEmail(email);
    const c = await this.repo.findActiveCustomerByEmail(norm);
    if (c && c.stateId !== CustomerState.ARCHIVED) {
      const { token, tokenHash } = createOpaqueToken();
      await this.repo.createPasswordReset({
        customerId: c.id,
        email: c.email,
        localeId: c.localeId,
        tokenHash,
        verifyPath: `/reset-password?token=${token}`,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
      return { status: 'sent' };
    }
    const archived = await this.repo.findArchivedCustomerByEmail(norm);
    if (archived) return { status: 'archived' };
    return { status: 'sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ status: 'password_reset' }> {
    const row = await this.validToken(token, VerificationTokenType.PASSWORD_RESET);
    if (row.customerStateId === CustomerState.ARCHIVED) {
      throw new BadRequestException('account is archived');
    }
    if (!isValidPassword(newPassword)) {
      throw new BadRequestException('weak password');
    }
    const passwordHash = await this.hasher.hash(newPassword);
    // Repo revokes all of the customer's refresh tokens in the same tx.
    await this.repo.completePasswordReset({
      tokenId: row.id,
      customerId: row.customerId,
      passwordHash,
    });
    return { status: 'password_reset' };
  }
}
