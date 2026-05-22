import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

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

describe('SubscriptionService.create — happy path', () => {
  it('передаёт промо в repo и backfill использует resolveCurrentPrice', async () => {
    const { service, repo } = makeService(new Date('2026-05-22T00:00:00Z'));
    repo.createWithBackfill.mockResolvedValue({
      sku: 'sub-FAKE1',
      projectSku: 'prj-ABCDEFGH',
      serviceSku: null,
      name: 'My Subscription',
      icon: null,
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
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
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
      sku: 'sub-1', projectSku: 'prj-1', serviceSku: null, name: 'X', icon: null,
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
