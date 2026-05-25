import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { isValidPassword } from '@subzero/shared';

import type { PasswordHasher } from '../auth/password-hasher';
import type {
  CustomerProfile,
  CustomerRepository,
  CustomerRow,
  ProfilePatch,
  RefreshTokenRevoker,
} from './customer.types';

// 152-ФЗ grace period between soft-delete and physical erase.
export const HARD_DELETE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

function toProfile(c: CustomerRow): CustomerProfile {
  return {
    email: c.email,
    name: c.name,
    timezone: c.timezone,
    localeId: c.localeId,
    currencyId: c.currencyId,
    planId: c.planId,
    version: c.version,
  };
}

export class CustomerService {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly refreshTokens: RefreshTokenRevoker,
    private readonly hasher: PasswordHasher,
  ) {}

  private async require(id: string): Promise<CustomerRow> {
    const c = await this.repo.findActiveById(id);
    if (!c) {
      // Token still valid but the account is gone / archived.
      throw new UnauthorizedException();
    }
    return c;
  }

  async getMe(id: string): Promise<CustomerProfile> {
    return toProfile(await this.require(id));
  }

  /** Backs both `POST /customers/me/profile` and `.../preferences`. */
  async saveProfile(id: string, version: number, patch: ProfilePatch): Promise<CustomerProfile> {
    if (Object.values(patch).every((v) => v === undefined)) {
      throw new BadRequestException('no fields to update');
    }
    const applied = await this.repo.updateProfile(id, version, patch);
    if (!applied) {
      // Stale version → someone else updated concurrently (ctx-architecture §4).
      throw new ConflictException('version mismatch');
    }
    return toProfile(await this.require(id));
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const c = await this.require(id);
    if (!c.passwordHash || !(await this.hasher.verify(c.passwordHash, currentPassword))) {
      throw new UnauthorizedException();
    }
    if (!isValidPassword(newPassword)) {
      throw new BadRequestException('weak password');
    }
    await this.repo.updatePassword(id, await this.hasher.hash(newPassword));
    // ctx-security §2: password change revokes ALL refresh tokens.
    await this.refreshTokens.revokeAllForCustomer(id);
  }

  async deleteMe(id: string): Promise<void> {
    await this.repo.softDelete(id);
    // Immediate force-logout; physical erase happens after the grace period.
    await this.refreshTokens.revokeAllForCustomer(id);
  }

  async purgeSubscriptions(id: string): Promise<void> {
    await this.require(id);
    await this.repo.purgeSubscriptions(id);
  }

  /** Cron tail (152-ФЗ): drop ARCHIVED customers past the grace period. */
  runHardDeleteRetention(): Promise<void> {
    return this.repo.hardDeleteArchivedBefore(new Date(Date.now() - HARD_DELETE_GRACE_MS));
  }
}
