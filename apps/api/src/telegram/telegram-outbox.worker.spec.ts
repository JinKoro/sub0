import { Locale } from '@subzero/shared';

import { TelegramOutboxWorker } from './telegram-outbox.worker';
import type { TelegramOutboxRepository, TelegramOutboxRow } from './telegram-outbox.types';

function row(over: Partial<TelegramOutboxRow> = {}): TelegramOutboxRow {
  return {
    id: 'r1',
    template: 'upcoming-charge',
    localeId: Locale.RU,
    chatId: '12345',
    context: {
      subscriptionPath: '/account/subscriptions/s1',
      serviceName: 'Spotify',
      amount: '169.00',
      currency: 'RUB',
      billingDate: '2026-06-14',
      daysBefore: 3,
      projectName: 'Personal',
    },
    ...over,
  };
}

function makeRepo(pending: TelegramOutboxRow[], locked = true): jest.Mocked<TelegramOutboxRepository> {
  return {
    tryLock: jest.fn().mockResolvedValue(locked),
    unlock: jest.fn().mockResolvedValue(undefined),
    listPending: jest.fn().mockResolvedValue(pending),
    markSent: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    deleteSentBefore: jest.fn().mockResolvedValue(undefined),
  };
}

const opts = { baseUrl: 'http://localhost:3000', batchSize: 20, retentionDays: 30 };

describe('TelegramOutboxWorker', () => {
  it('рендерит и шлёт pending → markSent, освобождает lock', async () => {
    const repo = makeRepo([row()]);
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    await new TelegramOutboxWorker(repo, { sendMessage }, opts).tick();

    expect(sendMessage).toHaveBeenCalledWith('12345', expect.stringContaining('Spotify'));
    expect(repo.markSent).toHaveBeenCalledWith('r1');
    expect(repo.markFailed).not.toHaveBeenCalled();
    expect(repo.unlock).toHaveBeenCalled();
  });

  it('sender бросает → markFailed (для ретрая), lock освобождён', async () => {
    const repo = makeRepo([row()]);
    const sendMessage = jest.fn().mockRejectedValue(new Error('429 Too Many Requests'));
    await new TelegramOutboxWorker(repo, { sendMessage }, opts).tick();

    expect(repo.markSent).not.toHaveBeenCalled();
    expect(repo.markFailed).toHaveBeenCalledWith('r1', expect.stringContaining('429'));
    expect(repo.unlock).toHaveBeenCalled();
  });

  it('не взял lock → ничего не делает', async () => {
    const repo = makeRepo([row()], false);
    const sendMessage = jest.fn();
    await new TelegramOutboxWorker(repo, { sendMessage }, opts).tick();

    expect(repo.listPending).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(repo.unlock).not.toHaveBeenCalled();
  });
});
