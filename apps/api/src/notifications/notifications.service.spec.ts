import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationChannelType,
  NotificationEvent,
} from '@subzero/shared';

import { NotificationsService } from './notifications.service';
import type { NotificationsRepository } from './notifications.types';

const CID = 'c0000000-0000-0000-0000-000000000001';

function makeRepo(): jest.Mocked<NotificationsRepository> {
  return {
    listPreferences: jest.fn().mockResolvedValue([]),
    listChannels: jest.fn().mockResolvedValue([]),
    getCustomerEmail: jest.fn().mockResolvedValue('user@sub0.local'),
    upsertChannel: jest.fn().mockImplementation((_cid, args) =>
      Promise.resolve({
        typeId: args.typeId,
        address: args.address === '' ? null : args.address,
        enabled: args.enabled,
        verified: args.verifiedAt !== null,
      }),
    ),
    deleteChannel: jest.fn().mockResolvedValue(true),
    readQuietHours: jest.fn().mockResolvedValue({
      data: { enabled: false, from: null, to: null },
      version: 1,
    }),
    upsertPreferences: jest.fn().mockResolvedValue(undefined),
    updateQuietHours: jest.fn().mockResolvedValue(true),
  };
}

const LINK_CONFIG = { telegramBotUsername: 'sub0_bot', maxBotUrlBase: null };

function makeService() {
  const repo = makeRepo();
  return { service: new NotificationsService(repo, LINK_CONFIG), repo };
}

describe('NotificationsService.getSettings', () => {
  it('дефолты для пустого хранилища — все 5 событий, UPCOMING_CHARGE enabled', async () => {
    const { service } = makeService();
    const settings = await service.getSettings(CID);
    expect(settings.preferences).toHaveLength(5);
    const upcoming = settings.preferences.find(
      (p) => p.eventId === NotificationEvent.UPCOMING_CHARGE,
    )!;
    expect(upcoming.enabled).toBe(true);
    expect(upcoming.channelTypeIds).toEqual([NotificationChannelType.EMAIL]);
    expect(upcoming.daysBefore).toEqual([3]);
    const trial = settings.preferences.find(
      (p) => p.eventId === NotificationEvent.TRIAL_END,
    )!;
    expect(trial.enabled).toBe(false);
  });

  it('сшивает дефолты с реальными строками', async () => {
    const { service, repo } = makeService();
    repo.listPreferences.mockResolvedValue([
      {
        eventId: NotificationEvent.UPCOMING_CHARGE,
        enabled: false,
        channelTypeIds: [],
        daysBefore: [],
      },
    ]);
    const settings = await service.getSettings(CID);
    expect(settings.preferences.find((p) => p.eventId === NotificationEvent.UPCOMING_CHARGE))
      .toEqual({
        eventId: NotificationEvent.UPCOMING_CHARGE,
        enabled: false,
        channelTypeIds: [],
        daysBefore: [],
      });
  });

  it('404 если customer не найден (quiet_hours = null)', async () => {
    const { service, repo } = makeService();
    repo.readQuietHours.mockResolvedValue(null);
    await expect(service.getSettings(CID)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('NotificationsService.updatePreferences', () => {
  it('400 на пустой items', async () => {
    const { service } = makeService();
    await expect(service.updatePreferences(CID, { items: [] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('400 на неизвестный eventId', async () => {
    const { service } = makeService();
    await expect(
      service.updatePreferences(CID, { items: [{ eventId: 999, enabled: true }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 на неизвестный channelTypeId', async () => {
    const { service } = makeService();
    await expect(
      service.updatePreferences(CID, {
        items: [{ eventId: NotificationEvent.UPCOMING_CHARGE, channelTypeIds: [999] }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 на daysBefore > 30', async () => {
    const { service } = makeService();
    await expect(
      service.updatePreferences(CID, {
        items: [{ eventId: NotificationEvent.UPCOMING_CHARGE, daysBefore: [31] }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 на дубликаты в channelTypeIds', async () => {
    const { service } = makeService();
    await expect(
      service.updatePreferences(CID, {
        items: [
          {
            eventId: NotificationEvent.UPCOMING_CHARGE,
            channelTypeIds: [
              NotificationChannelType.EMAIL,
              NotificationChannelType.EMAIL,
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('частичный апдейт сливается с дефолтом (если нет строки)', async () => {
    const { service, repo } = makeService();
    await service.updatePreferences(CID, {
      items: [{ eventId: NotificationEvent.UPCOMING_CHARGE, daysBefore: [1, 0] }],
    });
    expect(repo.upsertPreferences).toHaveBeenCalledWith(CID, [
      {
        eventId: NotificationEvent.UPCOMING_CHARGE,
        // enabled и channels берутся из дефолта UPCOMING_CHARGE.
        enabled: true,
        channelTypeIds: [NotificationChannelType.EMAIL],
        daysBefore: [1, 0],
      },
    ]);
  });

  it('частичный апдейт сливается с реальной строкой (если она есть)', async () => {
    const { service, repo } = makeService();
    repo.listPreferences.mockResolvedValue([
      {
        eventId: NotificationEvent.UPCOMING_CHARGE,
        enabled: true,
        channelTypeIds: [NotificationChannelType.EMAIL, NotificationChannelType.TELEGRAM],
        daysBefore: [3, 1],
      },
    ]);
    await service.updatePreferences(CID, {
      items: [{ eventId: NotificationEvent.UPCOMING_CHARGE, enabled: false }],
    });
    expect(repo.upsertPreferences).toHaveBeenCalledWith(CID, [
      {
        eventId: NotificationEvent.UPCOMING_CHARGE,
        enabled: false,
        // channels и days взяты из существующей строки.
        channelTypeIds: [NotificationChannelType.EMAIL, NotificationChannelType.TELEGRAM],
        daysBefore: [3, 1],
      },
    ]);
  });
});

describe('NotificationsService.updateQuietHours', () => {
  it('400 при enabled=true без from/to', async () => {
    const { service } = makeService();
    await expect(
      service.updateQuietHours(CID, { enabled: true, version: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 на невалидный формат времени', async () => {
    const { service } = makeService();
    await expect(
      service.updateQuietHours(CID, {
        enabled: true,
        from: '25:00',
        to: '09:00',
        version: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('409 при устаревшем version', async () => {
    const { service, repo } = makeService();
    repo.updateQuietHours.mockResolvedValue(false);
    await expect(
      service.updateQuietHours(CID, { enabled: false, version: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('успешный апдейт возвращает свежее окно', async () => {
    const { service, repo } = makeService();
    repo.readQuietHours.mockResolvedValue({
      data: { enabled: true, from: '22:00', to: '09:00' },
      version: 2,
    });
    const out = await service.updateQuietHours(CID, {
      enabled: true,
      from: '22:00',
      to: '09:00',
      version: 1,
    });
    expect(out).toEqual({ enabled: true, from: '22:00', to: '09:00' });
    expect(repo.updateQuietHours).toHaveBeenCalledWith(CID, {
      enabled: true,
      from: '22:00',
      to: '09:00',
      version: 1,
    });
  });
});

describe('NotificationsService.getSettings channels', () => {
  it('возвращает каналы из репозитория', async () => {
    const { service, repo } = makeService();
    repo.listChannels.mockResolvedValue([
      { typeId: NotificationChannelType.EMAIL, address: 'u@sub0.local', enabled: true, verified: true },
    ]);
    const settings = await service.getSettings(CID);
    expect(settings.channels).toEqual([
      { typeId: NotificationChannelType.EMAIL, address: 'u@sub0.local', enabled: true, verified: true },
    ]);
  });
});

describe('NotificationsService.connectChannel', () => {
  it('400 на неизвестный тип канала', async () => {
    const { service } = makeService();
    await expect(service.connectChannel(CID, 999)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('EMAIL — идемпотентный verified-канал на customer.email, без deep-link', async () => {
    const { service, repo } = makeService();
    const res = await service.connectChannel(CID, NotificationChannelType.EMAIL);
    expect(repo.upsertChannel).toHaveBeenCalledWith(
      CID,
      expect.objectContaining({
        typeId: NotificationChannelType.EMAIL,
        address: 'user@sub0.local',
        enabled: true,
      }),
    );
    expect(repo.upsertChannel.mock.calls[0][1].verifiedAt).toBeInstanceOf(Date);
    expect(res.channel.verified).toBe(true);
    expect(res.deepLink).toBeUndefined();
  });

  it('404 для EMAIL, если customer не найден', async () => {
    const { service, repo } = makeService();
    repo.getCustomerEmail.mockResolvedValue(null);
    await expect(
      service.connectChannel(CID, NotificationChannelType.EMAIL),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('TELEGRAM — НЕ verified канал, nonce + deep-link с t.me', async () => {
    const { service, repo } = makeService();
    const res = await service.connectChannel(CID, NotificationChannelType.TELEGRAM);
    const args = repo.upsertChannel.mock.calls[0][1];
    expect(args.typeId).toBe(NotificationChannelType.TELEGRAM);
    expect(args.address).toBe('');
    expect(args.verifiedAt).toBeNull();
    expect(args.connectNonce).toEqual(expect.any(String));
    expect(args.connectNonceExpiresAt).toBeInstanceOf(Date);
    expect(res.channel.verified).toBe(false);
    expect(res.deepLink).toContain('https://t.me/sub0_bot?start=');
    expect(res.deepLink).toContain(args.connectNonce);
    expect(res.expiresAt).toEqual(expect.any(String));
  });

  it('MAX — без сконфигуренного base deep-link не отдаётся, канал создаётся', async () => {
    const { service, repo } = makeService();
    const res = await service.connectChannel(CID, NotificationChannelType.MAX);
    expect(repo.upsertChannel).toHaveBeenCalled();
    expect(res.deepLink).toBeUndefined();
    expect(res.expiresAt).toEqual(expect.any(String));
  });

  it('MAX — с base из конфига строит deep-link', async () => {
    const repo = makeRepo();
    const service = new NotificationsService(repo, {
      telegramBotUsername: 'sub0_bot',
      maxBotUrlBase: 'https://max.example/bot',
    });
    const res = await service.connectChannel(CID, NotificationChannelType.MAX);
    expect(res.deepLink).toContain('https://max.example/bot?start=');
  });
});

describe('NotificationsService.disconnectChannel', () => {
  it('400 на неизвестный тип', async () => {
    const { service } = makeService();
    await expect(service.disconnectChannel(CID, 999)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 — EMAIL отключить нельзя', async () => {
    const { service } = makeService();
    await expect(
      service.disconnectChannel(CID, NotificationChannelType.EMAIL),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TELEGRAM — удаляет канал', async () => {
    const { service, repo } = makeService();
    await service.disconnectChannel(CID, NotificationChannelType.TELEGRAM);
    expect(repo.deleteChannel).toHaveBeenCalledWith(CID, NotificationChannelType.TELEGRAM);
  });
});
