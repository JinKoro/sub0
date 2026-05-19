import type { LoginAttemptRepository } from './auth.types';
import {
  LOCKOUT_MAX_FAILURES,
  LOCKOUT_WINDOW_MS,
  LockedOutException,
  LockoutService,
} from './lockout.service';

const NOW = new Date('2026-05-19T12:00:00.000Z').getTime();

function makeRepo() {
  const repo: jest.Mocked<LoginAttemptRepository> = {
    record: jest.fn().mockResolvedValue(undefined),
    lastSuccessAt: jest.fn().mockResolvedValue(null),
    countFailuresSince: jest.fn().mockResolvedValue(0),
    deleteBefore: jest.fn().mockResolvedValue(undefined),
  };
  return { repo, service: new LockoutService(repo) };
}

const KEY = { email: 'user@example.com', ip: '203.0.113.7' };

describe('LockoutService.assertNotLockedOut', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts failures since the start of the 15-min window when there is no prior success', async () => {
    const { repo, service } = makeRepo();
    repo.countFailuresSince.mockResolvedValue(LOCKOUT_MAX_FAILURES - 1);

    await expect(service.assertNotLockedOut(KEY)).resolves.toBeUndefined();
    expect(repo.countFailuresSince).toHaveBeenCalledWith({
      ...KEY,
      since: new Date(NOW - LOCKOUT_WINDOW_MS),
    });
  });

  it('throws LockedOutException once failures reach the threshold', async () => {
    const { repo, service } = makeRepo();
    repo.countFailuresSince.mockResolvedValue(LOCKOUT_MAX_FAILURES);

    await expect(service.assertNotLockedOut(KEY)).rejects.toBeInstanceOf(LockedOutException);
  });

  it('resets the counter on success: only failures after the last success count', async () => {
    const { repo, service } = makeRepo();
    const lastSuccess = new Date(NOW - 60_000); // inside the window
    repo.lastSuccessAt.mockResolvedValue(lastSuccess);
    repo.countFailuresSince.mockResolvedValue(LOCKOUT_MAX_FAILURES - 1);

    await expect(service.assertNotLockedOut(KEY)).resolves.toBeUndefined();
    expect(repo.countFailuresSince).toHaveBeenCalledWith({ ...KEY, since: lastSuccess });
  });

  it('ignores a success older than the window (window start still bounds the count)', async () => {
    const { repo, service } = makeRepo();
    repo.lastSuccessAt.mockResolvedValue(new Date(NOW - LOCKOUT_WINDOW_MS - 60_000));
    repo.countFailuresSince.mockResolvedValue(0);

    await service.assertNotLockedOut(KEY);
    expect(repo.countFailuresSince).toHaveBeenCalledWith({
      ...KEY,
      since: new Date(NOW - LOCKOUT_WINDOW_MS),
    });
  });
});

describe('LockoutService.runRetention', () => {
  it('deletes attempts older than the lockout window', async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    const { repo, service } = makeRepo();

    await service.runRetention();

    expect(repo.deleteBefore).toHaveBeenCalledWith(new Date(NOW - LOCKOUT_WINDOW_MS));
    jest.useRealTimers();
  });
});

describe('LockoutService.record*', () => {
  it('records a failed attempt', async () => {
    const { repo, service } = makeRepo();
    await service.recordFailure(KEY);
    expect(repo.record).toHaveBeenCalledWith({ ...KEY, succeeded: false });
  });

  it('records a successful attempt', async () => {
    const { repo, service } = makeRepo();
    await service.recordSuccess(KEY);
    expect(repo.record).toHaveBeenCalledWith({ ...KEY, succeeded: true });
  });
});
