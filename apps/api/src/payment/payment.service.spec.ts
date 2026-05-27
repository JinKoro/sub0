import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Currency,
  PRO_MONTHLY_PRICE_RUB,
  PRO_YEARLY_PRICE_RUB,
  PaidPlan,
  PaymentProvider as PaymentProviderEnum,
  PaymentStatus,
  Plan,
} from '@subzero/shared';

import { PaymentService } from './payment.service';
import type { PaymentProvider } from './payment-provider';
import type { PaymentRepository } from './payment.types';

const CID = 'c0000000-0000-0000-0000-000000000001';

function makeDeps(now = new Date('2026-05-27T00:00:00Z')) {
  const repo: jest.Mocked<PaymentRepository> = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 5 }),
    findCustomerPlanState: jest
      .fn()
      .mockResolvedValue({ planId: Plan.FREE, planExpiresAt: null }),
    upgrade: jest.fn().mockResolvedValue({
      sku: 'pay-FAKE0001',
      paidAt: now.toISOString(),
      paidPlanId: PaidPlan.PRO_MONTHLY,
      amount: PRO_MONTHLY_PRICE_RUB,
      currencyId: Currency.RUB,
      statusId: PaymentStatus.SUCCEEDED,
    }),
  };
  const provider: jest.Mocked<PaymentProvider> = {
    charge: jest.fn().mockResolvedValue({
      providerId: PaymentProviderEnum.MOCK,
      providerPaymentId: 'mock-charge-1',
      statusId: PaymentStatus.SUCCEEDED,
    }),
  };
  let skuSeq = 0;
  const generateSku = () => `pay-FAKE${++skuSeq}`;
  const service = new PaymentService({ repo, provider, now: () => now, generateSku });
  return { service, repo, provider };
}

describe('PaymentService.list', () => {
  it('подставляет дефолты page=1 / pageSize=5', async () => {
    const { service, repo } = makeDeps();
    await service.list(CID, {});
    expect(repo.list).toHaveBeenCalledWith({ customerId: CID, page: 1, pageSize: 5 });
  });

  it('передаёт кастомные page / pageSize', async () => {
    const { service, repo } = makeDeps();
    await service.list(CID, { page: 3, pageSize: 20 });
    expect(repo.list).toHaveBeenCalledWith({ customerId: CID, page: 3, pageSize: 20 });
  });

  it.each([
    ['page=0', { page: 0 }],
    ['page=-1', { page: -1 }],
    ['page=1.5', { page: 1.5 }],
  ])('400 на невалидный %s', async (_label, q) => {
    const { service } = makeDeps();
    await expect(service.list(CID, q)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['pageSize=0', { pageSize: 0 }],
    ['pageSize=101', { pageSize: 101 }],
    ['pageSize=2.5', { pageSize: 2.5 }],
  ])('400 на невалидный %s', async (_label, q) => {
    const { service } = makeDeps();
    await expect(service.list(CID, q)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PaymentService.upgrade', () => {
  const NOW = new Date('2026-05-27T00:00:00Z');

  it('FREE → PRO_MONTHLY: paid_until = now + 1 мес', async () => {
    const { service, repo } = makeDeps(NOW);
    await service.upgrade(CID, PaidPlan.PRO_MONTHLY);
    const args = repo.upgrade.mock.calls[0]![0];
    expect(args.amount).toBe(PRO_MONTHLY_PRICE_RUB);
    expect(args.currencyId).toBe(Currency.RUB);
    expect(args.paidPlanId).toBe(PaidPlan.PRO_MONTHLY);
    expect(args.newPlanId).toBe(Plan.PRO);
    expect(args.paidUntil.toISOString()).toBe('2026-06-27T00:00:00.000Z');
  });

  it('FREE → PRO_YEARLY: paid_until = now + 1 год', async () => {
    const { service, repo } = makeDeps(NOW);
    await service.upgrade(CID, PaidPlan.PRO_YEARLY);
    const args = repo.upgrade.mock.calls[0]![0];
    expect(args.amount).toBe(PRO_YEARLY_PRICE_RUB);
    expect(args.paidUntil.toISOString()).toBe('2027-05-27T00:00:00.000Z');
  });

  it('активный PRO: продлеваем от plan_expires_at, не от now', async () => {
    const { service, repo } = makeDeps(NOW);
    repo.findCustomerPlanState.mockResolvedValue({
      planId: Plan.PRO,
      planExpiresAt: new Date('2026-09-10T00:00:00Z'),
    });
    await service.upgrade(CID, PaidPlan.PRO_MONTHLY);
    const args = repo.upgrade.mock.calls[0]![0];
    expect(args.paidUntil.toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });

  it('истёкший PRO: продлеваем от now', async () => {
    const { service, repo } = makeDeps(NOW);
    repo.findCustomerPlanState.mockResolvedValue({
      planId: Plan.PRO,
      planExpiresAt: new Date('2026-03-01T00:00:00Z'),
    });
    await service.upgrade(CID, PaidPlan.PRO_MONTHLY);
    const args = repo.upgrade.mock.calls[0]![0];
    expect(args.paidUntil.toISOString()).toBe('2026-06-27T00:00:00.000Z');
  });

  it('400 на чужой paidPlanId', async () => {
    const { service } = makeDeps();
    await expect(service.upgrade(CID, 999)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 если кастомер не найден', async () => {
    const { service, repo } = makeDeps();
    repo.findCustomerPlanState.mockResolvedValue(null);
    await expect(service.upgrade(CID, PaidPlan.PRO_MONTHLY)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('зовёт provider.charge с теми же amount/currency что и в insert', async () => {
    const { service, provider, repo } = makeDeps(NOW);
    await service.upgrade(CID, PaidPlan.PRO_YEARLY);
    expect(provider.charge).toHaveBeenCalledWith({
      customerId: CID,
      amount: PRO_YEARLY_PRICE_RUB,
      currencyId: Currency.RUB,
      paidPlanId: PaidPlan.PRO_YEARLY,
    });
    const args = repo.upgrade.mock.calls[0]![0];
    expect(args.providerId).toBe(PaymentProviderEnum.MOCK);
    expect(args.statusId).toBe(PaymentStatus.SUCCEEDED);
  });
});
