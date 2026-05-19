import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { CustomerState } from '@subzero/shared';

import { CustomerService, HARD_DELETE_GRACE_MS } from './customer.service';
import type { CustomerRepository, CustomerRow, RefreshTokenRevoker } from './customer.types';
import { Argon2PasswordHasher } from '../auth/password-hasher';

const hasher = new Argon2PasswordHasher();
const ID = 'c0000000-0000-0000-0000-000000000001';

function makeRow(over: Partial<CustomerRow> = {}): CustomerRow {
  return {
    id: ID,
    email: 'user@example.com',
    name: 'User',
    timezone: 'Europe/Moscow',
    localeId: 1,
    currencyId: 1,
    planId: 1,
    passwordHash: null,
    version: 3,
    ...over,
  };
}

function makeDeps() {
  const repo: jest.Mocked<CustomerRepository> = {
    findActiveById: jest.fn(),
    updateProfile: jest.fn().mockResolvedValue(true),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue(undefined),
    hardDeleteArchivedBefore: jest.fn().mockResolvedValue(undefined),
  };
  const refreshTokens: jest.Mocked<RefreshTokenRevoker> = {
    revokeAllForCustomer: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CustomerService(repo, refreshTokens, hasher);
  return { service, repo, refreshTokens };
}

describe('CustomerService.getMe', () => {
  it('returns the public profile with version', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow());

    const p = await service.getMe(ID);

    expect(p).toEqual({
      email: 'user@example.com',
      name: 'User',
      timezone: 'Europe/Moscow',
      localeId: 1,
      currencyId: 1,
      planId: 1,
      version: 3,
    });
  });

  it('throws 401 when the customer is gone / archived', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(null);
    await expect(service.getMe(ID)).rejects.toThrow(UnauthorizedException);
  });
});

describe('CustomerService.saveProfile', () => {
  it('returns 409 on a stale version', async () => {
    const { service, repo } = makeDeps();
    repo.updateProfile.mockResolvedValue(false);

    await expect(service.saveProfile(ID, 2, { name: 'New' })).rejects.toThrow(ConflictException);
    expect(repo.updateProfile).toHaveBeenCalledWith(ID, 2, { name: 'New' });
  });

  it('rejects an empty patch with 400', async () => {
    const { service } = makeDeps();
    await expect(service.saveProfile(ID, 3, {})).rejects.toThrow(BadRequestException);
  });

  it('applies a name change and returns the fresh profile', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow({ name: 'New', version: 4 }));

    const p = await service.saveProfile(ID, 3, { name: 'New' });

    expect(repo.updateProfile).toHaveBeenCalledWith(ID, 3, { name: 'New' });
    expect(p.name).toBe('New');
    expect(p.version).toBe(4);
  });

  it('applies a region/preferences change (locale, timezone, currency)', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(
      makeRow({ localeId: 2, timezone: 'Europe/Minsk', currencyId: 4, version: 4 }),
    );

    const patch = { localeId: 2, timezone: 'Europe/Minsk', currencyId: 4 };
    const p = await service.saveProfile(ID, 3, patch);

    expect(repo.updateProfile).toHaveBeenCalledWith(ID, 3, patch);
    expect(p).toMatchObject({ localeId: 2, timezone: 'Europe/Minsk', currencyId: 4, version: 4 });
  });
});

describe('CustomerService.changePassword', () => {
  it('throws 401 when the current password is wrong', async () => {
    const { service, repo, refreshTokens } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow({ passwordHash: await hasher.hash('Right1pass') }));

    await expect(service.changePassword(ID, 'Wrong1pass', 'Brandnew1')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokens.revokeAllForCustomer).not.toHaveBeenCalled();
  });

  it('throws 400 when the new password violates the policy', async () => {
    const { service, repo } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow({ passwordHash: await hasher.hash('Right1pass') }));

    await expect(service.changePassword(ID, 'Right1pass', 'short')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('hashes the new password and force-logs-out every device', async () => {
    const { service, repo, refreshTokens } = makeDeps();
    repo.findActiveById.mockResolvedValue(makeRow({ passwordHash: await hasher.hash('Right1pass') }));

    await service.changePassword(ID, 'Right1pass', 'Brandnew1');

    expect(repo.updatePassword).toHaveBeenCalledTimes(1);
    const [, storedHash] = repo.updatePassword.mock.calls[0];
    expect(await hasher.verify(storedHash, 'Brandnew1')).toBe(true);
    expect(refreshTokens.revokeAllForCustomer).toHaveBeenCalledWith(ID);
  });
});

describe('CustomerService.deleteMe', () => {
  it('soft-deletes and revokes all refresh tokens', async () => {
    const { service, repo, refreshTokens } = makeDeps();

    await service.deleteMe(ID);

    expect(repo.softDelete).toHaveBeenCalledWith(ID);
    expect(refreshTokens.revokeAllForCustomer).toHaveBeenCalledWith(ID);
  });
});

describe('CustomerService.runHardDeleteRetention', () => {
  it('hard-deletes ARCHIVED customers older than the 30-day grace period', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-19T00:00:00.000Z'));
    const { service, repo } = makeDeps();

    await service.runHardDeleteRetention();

    expect(repo.hardDeleteArchivedBefore).toHaveBeenCalledWith(
      new Date(Date.now() - HARD_DELETE_GRACE_MS),
    );
    expect(CustomerState.ARCHIVED).toBeGreaterThan(0);
    jest.useRealTimers();
  });
});
