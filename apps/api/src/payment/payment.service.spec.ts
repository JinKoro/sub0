import { BadRequestException } from '@nestjs/common';
import { Currency, PaidPlan, PaymentStatus } from '@subzero/shared';

import { PaymentService } from './payment.service';
import type { PaymentRepository } from './payment.types';

const CID = 'c0000000-0000-0000-0000-000000000001';

function makeDeps() {
  const repo: jest.Mocked<PaymentRepository> = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 5 }),
  };
  const service = new PaymentService(repo);
  return { service, repo };
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

  it('repo результат прокидывается как есть (включая total/page/pageSize)', async () => {
    const { service, repo } = makeDeps();
    repo.list.mockResolvedValue({
      items: [
        {
          sku: 'pay-ABCDEFGH',
          paidAt: '2026-05-01T00:00:00.000Z',
          paidPlanId: PaidPlan.PRO_MONTHLY,
          amount: '290.00',
          currencyId: Currency.RUB,
          statusId: PaymentStatus.SUCCEEDED,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 5,
    });
    const out = await service.list(CID, {});
    expect(out.items).toHaveLength(1);
    expect(out.items[0].sku).toBe('pay-ABCDEFGH');
    expect(out.total).toBe(1);
  });
});
