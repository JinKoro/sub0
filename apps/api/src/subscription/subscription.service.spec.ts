import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

import { SubscriptionService } from './subscription.service';
import type {
  SubscriptionCreateInput,
  SubscriptionRepository,
} from './subscription.types';

const CID = 'c0000000-0000-0000-0000-000000000001';
const PROJECT_ID = 'p0000000-0000-0000-0000-000000000001';
const CAT_ID = 'cat0000-0000-0000-0000-000000000001';

function makeRepo(): jest.Mocked<SubscriptionRepository> {
  return {
    findProjectIdBySku: jest.fn().mockResolvedValue(PROJECT_ID),
    findServiceByCustomSku: jest.fn().mockResolvedValue(null),
    findCategoryIdBySku: jest.fn().mockResolvedValue(CAT_ID),
    list: jest.fn(),
    findBySku: jest.fn(),
    createWithBackfill: jest.fn(),
    update: jest.fn().mockResolvedValue(true),
    softDelete: jest.fn().mockResolvedValue(true),
  };
}

function makeService(now = new Date('2026-05-21T00:00:00Z')) {
  const repo = makeRepo();
  const skuSeq = { sub: 0, bil: 0 };
  const generateSku = (p: 'sub' | 'bil') => `${p}-FAKE${++skuSeq[p]}`;
  const service = new SubscriptionService({ repo, now: () => now, generateSku });
  return { service, repo };
}

function basePayload(over: Partial<SubscriptionCreateInput> = {}): SubscriptionCreateInput {
  return {
    projectSku: 'prj-ABCDEFGH',
    serviceSku: null,
    nameCustom: 'My Subscription',
    iconCustom: null,
    categorySku: 'cat-video',
    amount: '500.00',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    firstBillingDate: '2026-05-01T00:00:00Z',
    isTrial: false,
    promoAmount: null,
    promoEndsAt: null,
    comment: null,
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

  it('rejects unknown service (404)', async () => {
    const { service, repo } = makeService();
    repo.findServiceByCustomSku.mockResolvedValue(null);
    await expect(
      service.create(CID, basePayload({ serviceSku: 'srv-nope' })),
    ).rejects.toBeInstanceOf(NotFoundException);
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

  it('rejects trial without promoAmount=0 (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(
        CID,
        basePayload({ isTrial: true, promoAmount: '100.00', promoEndsAt: '2026-08-01T00:00:00Z' }),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects promo amount >= amount (422)', async () => {
    const { service } = makeService();
    await expect(
      service.create(
        CID,
        basePayload({ promoAmount: '600.00', promoEndsAt: '2026-08-01T00:00:00Z' }),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('SubscriptionService.create — happy path', () => {
  it('passes resolved ids and computed next_billing_date to repo', async () => {
    const { service, repo } = makeService(new Date('2026-05-21T00:00:00Z'));
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
      promoAmount: null,
      promoEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 1,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:00:00.000Z',
    });

    await service.create(CID, basePayload({ firstBillingDate: '2026-04-01T00:00:00Z' }));

    const args = repo.createWithBackfill.mock.calls[0]![0];
    expect(args.projectId).toBe(PROJECT_ID);
    expect(args.categoryId).toBe(CAT_ID);
    expect(args.serviceId).toBeNull();
    expect(args.nameCustom).toBe('My Subscription');
    // firstBillingDate=2026-04-01: cycle 0 billedAt 2026-05-01 ≤ now (2026-05-21) → 1 backfill;
    // next slot = 2026-06-01 (first periodEnd > now).
    expect(args.nextBillingDate.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(args.backfill).toHaveLength(1);
    expect(args.backfill[0].sku).toMatch(/^bil-/);
  });
});

describe('SubscriptionService.update', () => {
  it('returns 409 on stale version', async () => {
    const { service, repo } = makeService();
    repo.update.mockResolvedValue(false);
    repo.findBySku.mockResolvedValue({
      sku: 'sub-1',
      projectSku: 'prj-1',
      serviceSku: null,
      name: 'X',
      icon: null,
      categorySku: 'cat-video',
      categoryCustomSku: null,
      amount: '500.00',
      currencyId: Currency.RUB,
      billingPeriodId: BillingPeriod.MONTH,
      firstBillingDate: '2026-05-01T00:00:00Z',
      nextBillingDate: '2026-06-01T00:00:00Z',
      isTrial: false,
      promoAmount: null,
      promoEndsAt: null,
      comment: null,
      stateId: SubscriptionState.ACTIVE,
      version: 5,
      createdAt: '',
      updatedAt: '',
    });
    await expect(
      service.update(CID, 'sub-1', { version: 4, comment: 'updated' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses stateId=ARCHIVED through update (use DELETE)', async () => {
    const { service } = makeService();
    await expect(
      service.update(CID, 'sub-1', { version: 1, stateId: SubscriptionState.ARCHIVED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SubscriptionService.delete', () => {
  it('returns 404 when nothing soft-deleted', async () => {
    const { service, repo } = makeService();
    repo.softDelete.mockResolvedValue(false);
    await expect(service.delete(CID, 'sub-x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
