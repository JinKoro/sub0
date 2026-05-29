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
    readQuietHours: jest.fn().mockResolvedValue({
      data: { enabled: false, from: null, to: null },
      version: 1,
    }),
    upsertPreferences: jest.fn().mockResolvedValue(undefined),
    updateQuietHours: jest.fn().mockResolvedValue(true),
  };
}

function makeService() {
  const repo = makeRepo();
  return { service: new NotificationsService(repo), repo };
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
