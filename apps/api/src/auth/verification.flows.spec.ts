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
    createPasswordReset: jest.fn().mockResolvedValue(undefined),
    completePasswordReset: jest.fn().mockResolvedValue(undefined),
    findActiveCustomerByEmail: jest.fn().mockResolvedValue(null),
    findArchivedCustomerByEmail: jest.fn().mockResolvedValue(null),
  };
  const refreshTokens = {
    create: jest.fn(),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForCustomer: jest.fn(),
  } as RefreshTokenRepository;
  const registration: RegistrationRepository = {
    createNewAccount: jest.fn(),
    reissueVerification: jest.fn().mockResolvedValue(undefined),
  };
  const tokens = {
    signAccess: jest.fn(),
    signRefresh: jest.fn(),
    verifyRefresh: jest.fn(),
    hashRefresh: (t: string) => `sha:${t}`,
  } as TokenService;
  const service = new VerificationService(repo, refreshTokens, registration, tokens, hasher);
  return { service, repo, registration };
}

describe('VerificationService.resendVerification', () => {
  it('CREATED customer → re-issues; generic response', async () => {
    const { service, repo, registration } = makeDeps();
    (repo.findActiveCustomerByEmail as jest.Mock).mockResolvedValue({
      id: 'c1',
      localeId: 1,
      stateId: CustomerState.CREATED,
      email: 'u@e.com',
    });
    const res = await service.resendVerification('U@E.com');
    expect(res).toEqual({ status: 'sent' });
    const arg = (registration.reissueVerification as jest.Mock).mock.calls[0][0];
    expect(arg.customerId).toBe('c1');
    expect(arg.verifyPath).toMatch(/^\/registration\/complete\?token=.+/);
  });

  it('unknown / non-CREATED → no re-issue, still generic 200', async () => {
    const { service, registration } = makeDeps();
    const res = await service.resendVerification('nobody@e.com');
    expect(res).toEqual({ status: 'sent' });
    expect(registration.reissueVerification).not.toHaveBeenCalled();
  });
});

describe('VerificationService.forgotPassword', () => {
  it('existing non-archived → creates PASSWORD_RESET token + outbox', async () => {
    const { service, repo } = makeDeps();
    (repo.findActiveCustomerByEmail as jest.Mock).mockResolvedValue({
      id: 'c1',
      localeId: 1,
      stateId: CustomerState.ACTIVE,
      email: 'u@e.com',
    });
    const res = await service.forgotPassword('u@e.com');
    expect(res).toEqual({ status: 'sent' });
    const arg = (repo.createPasswordReset as jest.Mock).mock.calls[0][0];
    expect(arg.customerId).toBe('c1');
    expect(arg.verifyPath).toMatch(/^\/reset-password\?token=.+/);
    expect(arg.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 3600_000 + 5000);
  });

  it('non-existent email → 200, no token (anti-enumeration)', async () => {
    const { service, repo } = makeDeps();
    const res = await service.forgotPassword('ghost@e.com');
    expect(res).toEqual({ status: 'sent' });
    expect(repo.createPasswordReset).not.toHaveBeenCalled();
  });

  it('archived customer → 200 `archived`, no token', async () => {
    const { service, repo } = makeDeps();
    (repo.findArchivedCustomerByEmail as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = await service.forgotPassword('u@e.com');
    expect(res).toEqual({ status: 'archived' });
    expect(repo.createPasswordReset).not.toHaveBeenCalled();
  });
});

function resetRow(over: Partial<TokenRow> = {}): TokenRow {
  return {
    id: 'tok-r',
    customerId: 'c1',
    typeId: VerificationTokenType.PASSWORD_RESET,
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    customerStateId: CustomerState.ACTIVE,
    customerEmail: 'u@e.com',
    customerPlanId: 1,
    ...over,
  };
}

describe('VerificationService.resetPassword', () => {
  it('valid token + strong password → rehash + completePasswordReset (revokes refresh)', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(resetRow());
    const res = await service.resetPassword('raw', 'n3wPassword');
    expect(res).toEqual({ status: 'password_reset' });
    const arg = (repo.completePasswordReset as jest.Mock).mock.calls[0][0];
    expect(arg.tokenId).toBe('tok-r');
    expect(await hasher.verify(arg.passwordHash, 'n3wPassword')).toBe(true);
  });

  it('weak password → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(resetRow());
    await expect(service.resetPassword('raw', 'weak')).rejects.toThrow(BadRequestException);
    expect(repo.completePasswordReset).not.toHaveBeenCalled();
  });

  it('reused / expired token → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(resetRow({ usedAt: new Date() }));
    await expect(service.resetPassword('raw', 'n3wPassword')).rejects.toThrow(BadRequestException);
  });

  it('wrong token type (EMAIL_VERIFY at reset) → 400', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(
      resetRow({ typeId: VerificationTokenType.EMAIL_VERIFY }),
    );
    await expect(service.resetPassword('raw', 'n3wPassword')).rejects.toThrow(BadRequestException);
  });

  it('ARCHIVED customer → 400, no rehash / no refresh revoke', async () => {
    const { service, repo } = makeDeps();
    (repo.findToken as jest.Mock).mockResolvedValue(
      resetRow({ customerStateId: CustomerState.ARCHIVED }),
    );
    await expect(service.resetPassword('raw', 'n3wPassword')).rejects.toThrow(BadRequestException);
    expect(repo.completePasswordReset).not.toHaveBeenCalled();
  });
});
