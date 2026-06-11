import { Locale } from '@subzero/shared';

import { connectedMessage, expiredMessage } from './telegram-messages';
import { TelegramWebhookService } from './telegram-webhook.service';
import type { VerifiedChannel } from './telegram.repository';

function makeService(verifyResult: VerifiedChannel | null) {
  const verifyByNonce = jest.fn().mockResolvedValue(verifyResult);
  const sendMessage = jest.fn().mockResolvedValue(undefined);
  const service = new TelegramWebhookService({ verifyByNonce }, { sendMessage });
  return { service, verifyByNonce, sendMessage };
}

describe('TelegramWebhookService', () => {
  it('/start <nonce> с валидным nonce — верифицирует и шлёт подтверждение', async () => {
    const { service, verifyByNonce, sendMessage } = makeService({
      customerId: 'c1',
      localeId: Locale.EN,
    });
    await service.handleUpdate({ message: { chat: { id: 12345 }, text: '/start abc123' } });

    expect(verifyByNonce).toHaveBeenCalledWith('abc123', '12345');
    expect(sendMessage).toHaveBeenCalledWith('12345', connectedMessage(Locale.EN));
  });

  it('истёкший/неизвестный nonce — нейтральный ответ, канал не трогаем', async () => {
    const { service, verifyByNonce, sendMessage } = makeService(null);
    await service.handleUpdate({ message: { chat: { id: 7 }, text: '/start gone' } });

    expect(verifyByNonce).toHaveBeenCalledWith('gone', '7');
    expect(sendMessage).toHaveBeenCalledWith('7', expiredMessage());
  });

  it('не /start — игнорируем, без verify и без отправки', async () => {
    const { service, verifyByNonce, sendMessage } = makeService(null);
    await service.handleUpdate({ message: { chat: { id: 1 }, text: 'привет' } });

    expect(verifyByNonce).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('апдейт без message/chat/text — no-op', async () => {
    const { service, verifyByNonce, sendMessage } = makeService(null);
    await service.handleUpdate({});
    await service.handleUpdate({ message: { text: '/start x' } });
    await service.handleUpdate({ message: { chat: { id: 1 } } });

    expect(verifyByNonce).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
