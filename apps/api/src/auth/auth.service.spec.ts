import { UnauthorizedException } from '@nestjs/common';
import { CustomerState } from '@subzero/shared';

import { AuthService } from './auth.service';
import { Argon2PasswordHasher } from './password-hasher';
import type { CustomerRecord, CustomerRepository, RefreshTokenRepository } from './auth.types';
import type { TokenService } from './token.service';

const hasher = new Argon2PasswordHasher();

function makeCustomer(over: Partial<CustomerRecord> = {}): CustomerRecord {
  return {
    id: 'c0000000-0000-0000-0000-000000000001',
    email: 'user@example.com',
    passwordHash: null,
    planId: 1,
    stateId: CustomerState.ACTIVE,
    ...over,
  };
}

function makeDeps() {
  const customers: CustomerRepository = {
    findActiveByEmail: jest.fn(),
    findById: jest.fn(),
  };
  const refreshTokens: RefreshTokenRepository = {
    create: jest.fn(),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForCustomer: jest.fn(),
  };
  const tokens: TokenService = {
    signAccess: jest.fn().mockReturnValue('access.jwt'),
    signRefresh: jest.fn().mockReturnValue({ token: 'refresh.jwt', jti: 'jti-1', expiresAt: new Date(Date.now() + 1000) }),
    verifyRefresh: jest.fn(),
    hashRefresh: (t: string) => `sha:${t}`,
  };
  const service = new AuthService(customers, refreshTokens, tokens, hasher);
  return { service, customers, refreshTokens, tokens };
}

describe('AuthService.login', () => {
  it('returns access token and persists a refresh token on valid credentials', async () => {
    const { service, customers, refreshTokens } = makeDeps();
    const passwordHash = await hasher.hash('Sup3rSecret');
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue(
      makeCustomer({ passwordHash, stateId: CustomerState.ACTIVE }),
    );

    const result = await service.login(
      { email: 'User@Example.com ', password: 'Sup3rSecret' },
      { userAgent: 'jest', ip: '127.0.0.1' },
    );

    expect(customers.findActiveByEmail).toHaveBeenCalledWith('user@example.com');
    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh.jwt');
    expect(refreshTokens.create).toHaveBeenCalledTimes(1);
  });

  it('throws 401 on unknown email', async () => {
    const { service, customers, refreshTokens } = makeDeps();
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'x' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(UnauthorizedException);
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });

  it('throws 401 when password_hash is NULL (password not yet set)', async () => {
    const { service, customers } = makeDeps();
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue(makeCustomer({ passwordHash: null }));

    await expect(
      service.login({ email: 'user@example.com', password: 'whatever' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 on wrong password', async () => {
    const { service, customers } = makeDeps();
    const passwordHash = await hasher.hash('correct-horse');
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue(makeCustomer({ passwordHash }));

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when customer is ARCHIVED', async () => {
    const { service, customers, refreshTokens } = makeDeps();
    const passwordHash = await hasher.hash('Sup3rSecret');
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue(
      makeCustomer({ passwordHash, stateId: CustomerState.ARCHIVED }),
    );

    await expect(
      service.login({ email: 'user@example.com', password: 'Sup3rSecret' }, { userAgent: null, ip: null }),
    ).rejects.toThrow(UnauthorizedException);
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.refresh', () => {
  const future = () => new Date(Date.now() + 60_000);

  it('rotates: revokes the presented token and issues a new pair', async () => {
    const { service, customers, refreshTokens, tokens } = makeDeps();
    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: 'cust-1', jti: 'old-jti' });
    (refreshTokens.findByHash as jest.Mock).mockResolvedValue({
      customerId: 'cust-1',
      revokedAt: null,
      expiresAt: future(),
    });
    (customers.findById as jest.Mock).mockResolvedValue(
      makeCustomer({ id: 'cust-1', stateId: CustomerState.ACTIVE }),
    );

    const result = await service.refresh('refresh.jwt', { userAgent: 'jest', ip: '127.0.0.1' });

    expect(refreshTokens.revoke).toHaveBeenCalledWith('sha:refresh.jwt');
    expect(refreshTokens.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh.jwt');
  });

  it('throws 401 reusing an already-revoked refresh token', async () => {
    const { service, refreshTokens, tokens } = makeDeps();
    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: 'cust-1', jti: 'old-jti' });
    (refreshTokens.findByHash as jest.Mock).mockResolvedValue({
      customerId: 'cust-1',
      revokedAt: new Date(),
      expiresAt: future(),
    });

    await expect(service.refresh('refresh.jwt', { userAgent: null, ip: null })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });

  it('throws 401 when the refresh token is unknown / expired (no row)', async () => {
    const { service, refreshTokens, tokens } = makeDeps();
    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: 'cust-1', jti: 'x' });
    (refreshTokens.findByHash as jest.Mock).mockResolvedValue(null);

    await expect(service.refresh('refresh.jwt', { userAgent: null, ip: null })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when the JWT signature/expiry is invalid', async () => {
    const { service, tokens } = makeDeps();
    (tokens.verifyRefresh as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(service.refresh('tampered', { userAgent: null, ip: null })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when the customer is ARCHIVED', async () => {
    const { service, customers, refreshTokens, tokens } = makeDeps();
    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: 'cust-1', jti: 'old-jti' });
    (refreshTokens.findByHash as jest.Mock).mockResolvedValue({
      customerId: 'cust-1',
      revokedAt: null,
      expiresAt: future(),
    });
    (customers.findById as jest.Mock).mockResolvedValue(
      makeCustomer({ id: 'cust-1', stateId: CustomerState.ARCHIVED }),
    );

    await expect(service.refresh('refresh.jwt', { userAgent: null, ip: null })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokens.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.logout', () => {
  it('revokes all active refresh tokens for the customer', async () => {
    const { service, refreshTokens } = makeDeps();

    await service.logout('cust-1');

    expect(refreshTokens.revokeAllForCustomer).toHaveBeenCalledWith('cust-1');
  });
});
