import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BillingPeriod,
  Currency,
  FREE_TIER_LIMIT_ERROR,
  FREE_TIER_SUBSCRIPTION_LIMIT,
  Plan,
  SubscriptionState,
} from '@subzero/shared';

import { SubscriptionService } from './subscription.service';
import type { SubscriptionRepository } from './subscription.types';
import type { SubscriptionPromoRepository } from './subscription-promo.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const PROJECT_ID = 'p0000000-0000-0000-0000-000000000001';
const CAT_ID = 'cat0000-0000-0000-0000-000000000001';
const SUB_ID = 's0000000-0000-0000-0000-000000000001';

function makeRepo(): jest.Mocked<SubscriptionRepository> {
  return {
    findProjectIdBySku: jest.fn().mockResolvedValue(PROJECT_ID),
    findServiceBySku: jest.fn().mockResolvedValue(null),
    findCategoryIdBySku: jest.fn().mockResolvedValue(CAT_ID),
    findIdBySku: jest.fn().mockResolvedValue(SUB_ID),
    findCustomerPlanId: jest.fn().mockResolvedValue(2), // PRO в дефолте — не упираемся в Free-лимит.
    countActiveForCustomer: jest.fn().mockResolvedValue(0),
    list: jest.fn(),
    findBySku: jest.fn(),
    createWithBackfill: jest.fn(),
    update: jest.fn().mockResolvedValue(true),
    hardDelete: jest.fn().mockResolvedValue(true),
  };
}

function makePromoRepo(): jest.Mocked<SubscriptionPromoRepository> {
  return {
    listForSubscription: jest.fn().mockResolvedValue([]),
    bulkInsert: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  };
}

function makeService(now = new Date('2026-05-22T00:00:00Z')) {
  const repo = makeRepo();
  const promoRepo = makePromoRepo();
  const skuSeq = { sub: 0, bil: 0, spm: 0 };
  const generateSku = (p: 'sub' | 'bil' | 'spm') => `${p}-FAKE${++skuSeq[p]}`;
  const service = new SubscriptionService({ repo, promoRepo, now: () => now, generateSku });
  return { service, repo, promoRepo };
}

function basePayload(over: Partial<Parameters<SubscriptionService['create']>[1]> = {}) {
  return {
    projectSku: 'prj-ABCDEFGH',
    serviceSku: null,
    nameCustom: 'My Subscription',
    iconCustom: null,
    categorySku: 'cat-video',
    amount: '500.00',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '2026-04-01T00:00:00Z',
    isTrial: false,
    trialEndsAt: null,
    comment: null,
    promos: [],
    ...over,
  };
}

describe('SubscriptionService.create — validation', () => {
  it('rejects unknown project (404)', async () => {
    const { service, repo } = makeService();
    repo.findProjectIdBySku.mockResolvedValue(null);
    await expect(service.create(CID, basePayload())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unknown category (404)', async () => {
    const { service, repo } = makeService();
    repo.findCategoryIdBySku.mockResolvedValue(null);
    await expect(service.create(CID, basePayload())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects no service and no nameCustom (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ serviceSku: null, nameCustom: null })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects non-positive amount (400)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ amount: '0' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects isTrial=true без trialEndsAt (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ isTrial: true, trialEndsAt: null })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects isTrial=false с trialEndsAt (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({ isTrial: false, trialEndsAt: '2026-08-01T00:00:00Z' })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects promo amount >= subscription amount (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(CID, basePayload({
        promos: [{ amount: '600.00', endsAt: '2026-08-01T00:00:00Z' }],
      })),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('SubscriptionService.create — Free tier limit', () => {
  // Семантика лимита: считаем ACTIVE + PAUSED + CANCELLED non-deleted; ARCHIVED не считается.
  // Подсчёт делает repo.countActiveForCustomer — сервис только дергает её и сравнивает.
  it('FREE + лимит достигнут → 422 free_tier_limit_reached с limit', async () => {
    const { service, repo } = makeService();
    repo.findCustomerPlanId.mockResolvedValue(Plan.FREE);
    repo.countActiveForCustomer.mockResolvedValue(FREE_TIER_SUBSCRIPTION_LIMIT);

    let caught: unknown;
    try {
      await service.create(CID, basePayload());
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnprocessableEntityException);
    const response = (caught as UnprocessableEntityException).getResponse() as {
      message: string;
      limit: number;
    };
    expect(response.message).toBe(FREE_TIER_LIMIT_ERROR);
    expect(response.limit).toBe(FREE_TIER_SUBSCRIPTION_LIMIT);
    expect(repo.createWithBackfill).not.toHaveBeenCalled();
  });

  it('FREE + лимит не достигнут → создаёт', async () => {
    const { service, repo } = makeService();
    repo.findCustomerPlanId.mockResolvedValue(Plan.FREE);
    repo.countActiveForCustomer.mockResolvedValue(FREE_TIER_SUBSCRIPTION_LIMIT - 1);
    repo.createWithBackfill.mockResolvedValue({
      sku: 'sub-FAKE1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      color: '#1347ff', categorySku: 'cat-video', categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 1, createdAt: '', updatedAt: '', promos: [],
    });
    await expect(service.create(CID, basePayload())).resolves.toBeTruthy();
    expect(repo.createWithBackfill).toHaveBeenCalled();
  });

  it('PRO без ограничений — даже если count >= лимита', async () => {
    const { service, repo } = makeService();
    repo.findCustomerPlanId.mockResolvedValue(Plan.PRO);
    // countActiveForCustomer не должен спрашиваться вообще на PRO.
    repo.createWithBackfill.mockResolvedValue({
      sku: 'sub-FAKE1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      color: '#1347ff', categorySku: 'cat-video', categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 1, createdAt: '', updatedAt: '', promos: [],
    });
    await expect(service.create(CID, basePayload())).resolves.toBeTruthy();
    expect(repo.countActiveForCustomer).not.toHaveBeenCalled();
  });
});

describe('SubscriptionService.create — happy path', () => {
  it('передаёт промо в repo и backfill использует resolveCurrentPrice', async () => {
    const { service, repo } = makeService(new Date('2026-05-22T00:00:00Z'));
    repo.createWithBackfill.mockResolvedValue({
      sku: 'sub-FAKE1',
      projectSku: 'prj-ABCDEFGH',
      serviceSku: null,
      name: 'My Subscription',
      icon: null,
      color: '#1347ff',
      categorySku: 'cat-video',
      categoryCustomSku: null,
      amount: '500.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-04-01T00:00:00.000Z',
      nextBillingDate: '2026-06-01T00:00:00.000Z',
      isTrial: false,
      trialEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 1,
      createdAt: '',
      updatedAt: '',
      promos: [],
    });

    await service.create(CID, basePayload({
      firstBillingDate: '2026-04-01T00:00:00Z',
      promos: [{ amount: '100.00', endsAt: '2026-07-01T00:00:00Z' }],
    }));

    const args = repo.createWithBackfill.mock.calls[0]![0];
    expect(args.promos).toHaveLength(1);
    expect(args.promos[0].sku).toMatch(/^spm-/);
    expect(args.backfill[0].amount).toBe('100.00');
    expect(args.backfill[0].isPromo).toBe(true);
  });
});

describe('SubscriptionService.delete', () => {
  it('hard delete; 404 если не найдена', async () => {
    const { service, repo } = makeService();
    repo.hardDelete.mockResolvedValue(false);
    await expect(service.delete(CID, 'sub-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('зовёт repo.hardDelete при успехе', async () => {
    const { service, repo } = makeService();
    repo.hardDelete.mockResolvedValue(true);
    await service.delete(CID, 'sub-1');
    expect(repo.hardDelete).toHaveBeenCalledWith(CID, 'sub-1');
  });
});

describe('SubscriptionService.update — promos sync', () => {
  it('добавляет, обновляет и удаляет промо по replace-all семантике', async () => {
    const { service, repo, promoRepo } = makeService();
    const existing = {
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null, color: '#1347ff',
      categorySku: 'cat-video', categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '',
      promos: [
        { sku: 'spm-OLD',  amount: '200.00', endsAt: '2026-09-01T00:00:00Z', version: 1 },
        { sku: 'spm-KEEP', amount: '100.00', endsAt: '2026-10-01T00:00:00Z', version: 2 },
      ],
    };
    repo.findBySku.mockResolvedValue(existing);

    await service.update(CID, 'sub-1', {
      version: 5,
      promos: [
        { sku: 'spm-KEEP', version: 2, amount: '90.00' },
        { amount: '50.00', endsAt: '2026-12-01T00:00:00Z' },
      ],
    });

    expect(promoRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'spm-KEEP', subscriptionId: SUB_ID }),
    );
    expect(promoRepo.bulkInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: expect.arrayContaining([expect.objectContaining({ amount: '50.00' })]),
      }),
    );
    expect(promoRepo.softDelete).toHaveBeenCalledWith('spm-OLD', SUB_ID);
  });

  it('409 на устаревший version основной подписки', async () => {
    const { service, repo } = makeService();
    repo.update.mockResolvedValue(false);
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null, color: '#1347ff',
      categorySku: null, categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '', promos: [],
    });
    await expect(
      service.update(CID, 'sub-1', { version: 4, comment: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('SubscriptionService.update — firstBillingDate immutability', () => {
  it('rejects change with 422 (UnprocessableEntity)', async () => {
    const { service, repo } = makeService();
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null, color: '#1347ff',
      categorySku: null, categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-01-15T00:00:00.000Z',
      nextBillingDate: '2026-05-15T00:00:00.000Z',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '', promos: [],
    });
    await expect(
      service.update(CID, 'sub-1', {
        version: 5,
        firstBillingDate: '2025-09-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('allows passing the same firstBillingDate (FE может прислать без изменений)', async () => {
    const { service, repo } = makeService();
    const subscription = {
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null, color: '#1347ff',
      categorySku: null, categoryCustomSku: null, amount: '500.00',
      currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-01-15T00:00:00.000Z',
      nextBillingDate: '2026-05-15T00:00:00.000Z',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5,
      createdAt: '', updatedAt: '', promos: [],
    };
    repo.findBySku.mockResolvedValue(subscription);
    repo.update.mockResolvedValue(true);
    await expect(
      service.update(CID, 'sub-1', {
        version: 5,
        firstBillingDate: '2026-01-15T00:00:00.000Z',
        comment: 'edited',
      }),
    ).resolves.toBeTruthy();
  });
});

describe('SubscriptionService — color auto-gen', () => {
  const PALETTE = new Set([
    '#1347ff',
    '#0a7a3f',
    '#c94a1c',
    '#6b21d9',
    '#b0851a',
    '#0a0a0a',
    '#6b6b66',
  ]);

  it('create без сервиса → color из палитры', async () => {
    const { service, repo } = makeService();
    repo.createWithBackfill.mockImplementation(async (args) => ({
      sku: 'sub-X', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      color: args.color, categorySku: 'cat-video', categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 1, createdAt: '', updatedAt: '', promos: [],
    }));
    await service.create(CID, basePayload());
    const { color } = repo.createWithBackfill.mock.calls[0]![0];
    expect(typeof color).toBe('string');
    expect(PALETTE.has(color!)).toBe(true);
  });

  it('create с сервисом без иконки → color из палитры', async () => {
    const { service, repo } = makeService();
    repo.findServiceBySku.mockResolvedValue({
      id: 'svc-1', name: 'Plain', icon: null, categoryId: CAT_ID,
    });
    repo.createWithBackfill.mockImplementation(async (args) => ({
      sku: 'sub-X', projectSku: 'prj-1', serviceSku: 'srv-1', name: 'Plain', icon: null,
      color: args.color, categorySku: 'cat-video', categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 1, createdAt: '', updatedAt: '', promos: [],
    }));
    await service.create(CID, basePayload({ serviceSku: 'srv-1', nameCustom: null }));
    const { color } = repo.createWithBackfill.mock.calls[0]![0];
    expect(PALETTE.has(color!)).toBe(true);
  });

  it('create с сервисом с иконкой → color = null', async () => {
    const { service, repo } = makeService();
    repo.findServiceBySku.mockResolvedValue({
      id: 'svc-1', name: 'Netflix', icon: 'data:image/svg+xml;…', categoryId: CAT_ID,
    });
    repo.createWithBackfill.mockImplementation(async (args) => ({
      sku: 'sub-X', projectSku: 'prj-1', serviceSku: 'srv-1', name: 'Netflix',
      icon: 'data:image/svg+xml;…', color: args.color,
      categorySku: 'cat-video', categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 1, createdAt: '', updatedAt: '', promos: [],
    }));
    await service.create(CID, basePayload({ serviceSku: 'srv-1', nameCustom: null }));
    expect(repo.createWithBackfill.mock.calls[0]![0].color).toBeNull();
  });

  it('update: смена на сервис с иконкой обнуляет color', async () => {
    const { service, repo } = makeService();
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      color: '#1347ff', categorySku: null, categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5, createdAt: '', updatedAt: '', promos: [],
    });
    repo.findServiceBySku.mockResolvedValue({
      id: 'svc-1', name: 'Netflix', icon: 'data:image/svg+xml;…', categoryId: CAT_ID,
    });
    await service.update(CID, 'sub-1', { version: 5, serviceSku: 'srv-1' });
    const { patch } = repo.update.mock.calls[0]![0];
    expect(patch.color).toBeNull();
  });

  it('update: смена на сервис без иконки сохраняет существующий color', async () => {
    const { service, repo } = makeService();
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
      color: '#1347ff', categorySku: null, categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5, createdAt: '', updatedAt: '', promos: [],
    });
    repo.findServiceBySku.mockResolvedValue({
      id: 'svc-1', name: 'Plain', icon: null, categoryId: CAT_ID,
    });
    await service.update(CID, 'sub-1', { version: 5, serviceSku: 'srv-1' });
    const { patch } = repo.update.mock.calls[0]![0];
    // color остался — патчем его не трогаем.
    expect(patch.color).toBeUndefined();
  });

  it('update: смена на сервис без иконки + ранее color=null → генерация', async () => {
    const { service, repo } = makeService();
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: 'srv-old', name: 'Old', icon: 'i',
      color: null, categorySku: null, categoryCustomSku: null,
      amount: '500.00', currencyId: Currency.RUB, billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '', nextBillingDate: '',
      isTrial: false, trialEndsAt: null, comment: null,
      stateId: SubscriptionState.ACTIVE, version: 5, createdAt: '', updatedAt: '', promos: [],
    });
    repo.findServiceBySku.mockResolvedValue({
      id: 'svc-1', name: 'Plain', icon: null, categoryId: CAT_ID,
    });
    await service.update(CID, 'sub-1', { version: 5, serviceSku: 'srv-1' });
    const { patch } = repo.update.mock.calls[0]![0];
    expect(typeof patch.color).toBe('string');
    expect(PALETTE.has(patch.color as string)).toBe(true);
  });
});
