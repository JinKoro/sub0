import { BadRequestException } from '@nestjs/common';
import { CustomerState, VerificationTokenType } from '@subzero/shared';

import { Argon2PasswordHasher } from './password-hasher';
import type { RefreshTokenRepository, RegistrationRepository } from './auth.types';
import type { TokenService } from './token.service';
import type { TokenRow, VerificationRepository } from './verification.types';
import { VerificationService } from './verification.service';

const hasher = new Argon2PasswordHasher();

function makeDeps() {
  const repo: VerificationRepository = {
    findToken: jest.fn(),
    completeRegistration: jest.fn().mockResolvedValue(undefined),
    applyEmailChange: jest.fn().mockResolvedValue(undefined),
    createPasswordReset: jest.fn().mockResolvedValue(undefined),
    completePasswordReset: jest.fn().mockResolvedValue(undefined),
    findActiveCustomerByEmail: jest.fn(),
  };
  const refreshTokens: RefreshTokenRepository = {
    create: jest.fn(),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForCustomer: jest.fn(),
  };
  const registration: RegistrationRepository = {
    createNewAccount: jest.fn(),
    reissueVerification: jest.fn().mockResolvedValue(undefined),
  };
  const tokens: TokenService = {
    signAccess: jest.fn().mockReturnValue('access.jwt'),
    signRefresh: jest
      .fn()
      .mockReturnValue({ token: 'refresh.jwt', jti: 'j', expiresAt: new Date(Date.now() + 1000) }),
    verifyRefresh: jest.fn(),
    hashRefresh: (t: string) => `sha:${t}`,
  };
  const service = new VerificationService(repo, refreshTokens, registration, tokens, hasher);
  return { service, repo, refreshTokens };
}

function row(over: Partial<TokenRow> = {}): TokenRow {
  return {
    id: 'tok-1',
    customerId: 'cust-1',
    typeId: VerificationTokenType.EMAIL_VERIFY,
    payload: null,
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    customerStateId: CustomerState.CREATED,
    customerEmail: 'user@example.com',
    customerPlanId: 1,
    ...over,
  };
}

describe('VerificationService.verifyEmail', () => {
  it('CREATED + valid password → sets password, ACTIVE, issues tokens', async () => {
    const { service, repo, refreshTokens } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(row());

    const res = await service.verifyEmail(
      { token: 'raw-token', password: 'passw0rd' },
      { userAgent: 'jest', ip: '127.0.0.1' },
    );

    const call = (repo.completeRegistration as jest.Mock).mock.calls[0][0];
    expect(call.tokenId).toBe('tok-1');
    expect(call.customerId).toBe('cust-1');
    expect(typeof call.passwordHash).toBe('string');
    expect(await hasher.verify(call.passwordHash, 'passw0rd')).toBe(true);
    expect(refreshTokens.create).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ accessToken: 'access.jwt', refreshToken: 'refresh.jwt' });
  });

  it('CREATED without password → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(row());
    await expect(service.verifyEmail({ token: 't' }, { userAgent: null, ip: null })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.completeRegistration).not.toHaveBeenCalled();
  });

  it('CREATED + weak password (policy) → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(row());
    await expect(
      service.verifyEmail({ token: 't', password: 'short1' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('unknown token → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(null);
    await expect(
      service.verifyEmail({ token: 'x', password: 'passw0rd' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('expired token → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(row({ expiresAt: new Date(Date.now() - 1) }));
    await expect(
      service.verifyEmail({ token: 't', password: 'passw0rd' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('already-used token → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(row({ usedAt: new Date() }));
    await expect(
      service.verifyEmail({ token: 't', password: 'passw0rd' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('wrong token type (PASSWORD_RESET at verify-email) → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(
      row({ typeId: VerificationTokenType.PASSWORD_RESET }),
    );
    await expect(
      service.verifyEmail({ token: 't', password: 'passw0rd' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ACTIVE + payload.newEmail → updates email, no password needed', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(
      row({ customerStateId: CustomerState.ACTIVE, payload: { newEmail: 'new@example.com' } }),
    );

    const res = await service.verifyEmail({ token: 't' }, { userAgent: null, ip: null });

    expect(repo.applyEmailChange).toHaveBeenCalledWith({
      tokenId: 'tok-1',
      customerId: 'cust-1',
      newEmail: 'new@example.com',
    });
    expect(res).toEqual({ status: 'email_updated' });
  });
});
