import { Locale } from '@subzero/shared';

import type { MailOutboxRepository, MailOutboxRow, MailSender } from './mail.types';
import { MailOutboxWorker } from './mail-outbox.worker';

function row(over: Partial<MailOutboxRow> = {}): MailOutboxRow {
  return {
    id: `id-${Math.random()}`,
    template: 'verify-email',
    localeId: Locale.RU,
    toEmail: 'u@e.com',
    context: { verifyPath: '/registration/complete?token=t' },
    ...over,
  };
}

function makeDeps(pending: MailOutboxRow[] = []) {
  const repo: MailOutboxRepository = {
    tryLock: jest.fn().mockResolvedValue(true),
    unlock: jest.fn().mockResolvedValue(undefined),
    listPending: jest.fn().mockResolvedValue(pending),
    markSent: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    deleteSentBefore: jest.fn().mockResolvedValue(0),
  };
  const mail: MailSender = { send: jest.fn().mockResolvedValue(undefined) };
  const worker = new MailOutboxWorker(repo, mail, {
    baseUrl: 'http://localhost:3000',
    batchSize: 20,
    retentionDays: 30,
  });
  return { worker, repo, mail };
}

describe('MailOutboxWorker.tick', () => {
  it('does nothing when the advisory lock is not acquired', async () => {
    const { worker, repo, mail } = makeDeps([row()]);
    (repo.tryLock as jest.Mock).mockResolvedValue(false);

    await worker.tick();

    expect(repo.listPending).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
    expect(repo.unlock).not.toHaveBeenCalled();
  });

  it('sends each pending mail and marks it sent; releases the lock', async () => {
    const { worker, repo, mail } = makeDeps([row({ id: 'a' }), row({ id: 'b' })]);

    await worker.tick();

    expect(mail.send).toHaveBeenCalledTimes(2);
    expect(repo.markSent).toHaveBeenCalledWith('a');
    expect(repo.markSent).toHaveBeenCalledWith('b');
    expect(repo.markFailed).not.toHaveBeenCalled();
    expect(repo.unlock).toHaveBeenCalledTimes(1);
  });

  it('one send failure marks that row failed but does not abort the batch', async () => {
    const { worker, repo, mail } = makeDeps([row({ id: 'ok' }), row({ id: 'bad' })]);
    (mail.send as jest.Mock).mockImplementation((m: { to: string }) =>
      m.to === 'u@e.com' && (mail.send as jest.Mock).mock.calls.length === 2
        ? Promise.reject(new Error('smtp down'))
        : Promise.resolve(),
    );

    await worker.tick();

    expect(repo.markSent).toHaveBeenCalledWith('ok');
    expect(repo.markFailed).toHaveBeenCalledWith('bad', expect.stringContaining('smtp down'));
    expect(repo.unlock).toHaveBeenCalledTimes(1);
  });

  it('an unknown template marks the row failed (render error caught)', async () => {
    const { worker, repo, mail } = makeDeps([row({ id: 'x', template: 'bogus' })]);

    await worker.tick();

    expect(mail.send).not.toHaveBeenCalled();
    expect(repo.markFailed).toHaveBeenCalledWith('x', expect.stringContaining('bogus'));
  });

  it('always releases the lock even if listing throws', async () => {
    const { worker, repo } = makeDeps();
    (repo.listPending as jest.Mock).mockRejectedValue(new Error('db gone'));

    await expect(worker.tick()).resolves.toBeUndefined();
    expect(repo.unlock).toHaveBeenCalledTimes(1);
  });
});

describe('MailOutboxWorker.runRetention', () => {
  it('deletes sent rows older than retentionDays', async () => {
    const { worker, repo } = makeDeps();
    await worker.runRetention();
    const arg = (repo.deleteSentBefore as jest.Mock).mock.calls[0][0] as Date;
    const expected = Date.now() - 30 * 86_400_000;
    expect(Math.abs(arg.getTime() - expected)).toBeLessThan(10_000);
  });
});
