import { ConflictException } from '@nestjs/common';
import { CustomerState, Locale } from '@subzero/shared';

import { AuthService } from './auth.service';
import { Argon2PasswordHasher } from './password-hasher';
import type {
  CustomerRecord,
  CustomerRepository,
  RefreshTokenRepository,
  RegistrationRepository,
} from './auth.types';
import type { TokenService } from './token.service';

const hasher = new Argon2PasswordHasher();

function makeDeps() {
  const customers: CustomerRepository = {
    findActiveByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
  };
  const refreshTokens: RefreshTokenRepository = {
    create: jest.fn(),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForCustomer: jest.fn(),
  };
  const registration: RegistrationRepository = {
    createNewAccount: jest.fn().mockResolvedValue(undefined),
    reissueVerification: jest.fn().mockResolvedValue(undefined),
  };
  const tokens = {} as TokenService;
  const service = new AuthService(customers, refreshTokens, tokens, hasher, registration);
  return { service, customers, registration };
}

const baseDto = {
  email: '  New.User@Example.COM ',
  name: 'New User',
  timezone: 'Europe/Moscow',
  marketingConsent: true,
};

describe('AuthService.register', () => {
  it('creates a pending account: normalized email, CREATED, token + outbox', async () => {
    const { service, customers, registration } = makeDeps();

    const res = await service.register(baseDto, { userAgent: null, ip: null });

    expect(res).toEqual({ status: 'pending_verification', email: 'new.user@example.com' });
    expect(customers.findActiveByEmail).toHaveBeenCalledWith('new.user@example.com');
    const arg = (registration.createNewAccount as jest.Mock).mock.calls[0][0];
    expect(arg.email).toBe('new.user@example.com');
    expect(arg.name).toBe('New User');
    expect(arg.timezone).toBe('Europe/Moscow');
    expect(arg.localeId).toBe(Locale.RU); // default
    expect(arg.marketingConsent).toBe(true);
    expect(arg.sku).toMatch(/^prj-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/);
    expect(arg.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(arg.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.verifyPath).toMatch(/^\/registration\/complete\?token=.+/);
    expect(arg.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(arg.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 24 * 3600_000 + 5000);
    expect(registration.reissueVerification).not.toHaveBeenCalled();
  });

  it('rejects with 409 when an ACTIVE customer already uses the email', async () => {
    const { service, customers, registration } = makeDeps();
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue({
      id: 'c1',
      email: 'new.user@example.com',
      passwordHash: 'x',
      planId: 1,
      stateId: CustomerState.ACTIVE,
    } as CustomerRecord);

    await expect(service.register(baseDto, { userAgent: null, ip: null })).rejects.toThrow(
      ConflictException,
    );
    expect(registration.createNewAccount).not.toHaveBeenCalled();
    expect(registration.reissueVerification).not.toHaveBeenCalled();
  });

  it('re-issues verification when the customer exists but is still CREATED', async () => {
    const { service, customers, registration } = makeDeps();
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue({
      id: 'c-created',
      email: 'new.user@example.com',
      passwordHash: null,
      planId: 1,
      stateId: CustomerState.CREATED,
    } as CustomerRecord);

    const res = await service.register(baseDto, { userAgent: null, ip: null });

    expect(res).toEqual({ status: 'pending_verification', email: 'new.user@example.com' });
    expect(registration.createNewAccount).not.toHaveBeenCalled();
    const arg = (registration.reissueVerification as jest.Mock).mock.calls[0][0];
    expect(arg.customerId).toBe('c-created');
    expect(arg.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.verifyPath).toMatch(/^\/registration\/complete\?token=.+/);
  });

  it('propagates an error from the transactional repository (atomicity)', async () => {
    const { service, registration } = makeDeps();
    (registration.createNewAccount as jest.Mock).mockRejectedValue(new Error('tx failed'));

    await expect(service.register(baseDto, { userAgent: null, ip: null })).rejects.toThrow(
      'tx failed',
    );
  });

  it('rejects with 409 when an ARCHIVED customer uses the email (no 500)', async () => {
    const { service, customers, registration } = makeDeps();
    (customers.findActiveByEmail as jest.Mock).mockResolvedValue({
      id: 'c-arch',
      email: 'new.user@example.com',
      passwordHash: 'x',
      planId: 1,
      stateId: CustomerState.ARCHIVED,
    } as CustomerRecord);

    await expect(service.register(baseDto, { userAgent: null, ip: null })).rejects.toThrow(
      ConflictException,
    );
    expect(registration.createNewAccount).not.toHaveBeenCalled();
    expect(registration.reissueVerification).not.toHaveBeenCalled();
  });
});
