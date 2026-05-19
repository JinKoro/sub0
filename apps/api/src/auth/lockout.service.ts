import { HttpException, HttpStatus } from '@nestjs/common';

import type { Lockout, LoginAttemptKey, LoginAttemptRepository } from './auth.types';

// ctx-security §2: 10 failed logins per email+IP within 15 min → 15-min block.
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_MAX_FAILURES = 10;

/** 429 — generic on purpose (no account-enumeration via the lockout signal). */
export class LockedOutException extends HttpException {
  constructor() {
    super('too many failed login attempts, try again later', HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * Postgres-backed (state lives in `login_attempt`, not in memory) so the
 * block survives a restart and works across API replicas — AGENTS.md.
 */
export class LockoutService implements Lockout {
  constructor(private readonly attempts: LoginAttemptRepository) {}

  async assertNotLockedOut(key: LoginAttemptKey): Promise<void> {
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);
    const lastSuccess = await this.attempts.lastSuccessAt(key);
    // A successful login resets the counter: only failures recorded after it
    // (and inside the window) count toward the block.
    const since =
      lastSuccess && lastSuccess.getTime() > windowStart.getTime() ? lastSuccess : windowStart;
    const failures = await this.attempts.countFailuresSince({ ...key, since });
    if (failures >= LOCKOUT_MAX_FAILURES) {
      throw new LockedOutException();
    }
  }

  recordSuccess(key: LoginAttemptKey): Promise<void> {
    return this.attempts.record({ ...key, succeeded: true });
  }

  recordFailure(key: LoginAttemptKey): Promise<void> {
    return this.attempts.record({ ...key, succeeded: false });
  }

  /** Retention: nothing older than the window can affect a lockout. */
  runRetention(): Promise<void> {
    return this.attempts.deleteBefore(new Date(Date.now() - LOCKOUT_WINDOW_MS));
  }
}
