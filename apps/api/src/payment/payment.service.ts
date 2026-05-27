import { BadRequestException } from '@nestjs/common';
import type { PaymentListQuery, PaymentListResponse } from '@subzero/shared';

import type { PaymentRepository } from './payment.types';

const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

export class PaymentService {
  constructor(private readonly repo: PaymentRepository) {}

  async list(customerId: string, q: PaymentListQuery): Promise<PaymentListResponse> {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new BadRequestException(`pageSize must be between 1 and ${MAX_PAGE_SIZE}`);
    }
    return this.repo.list({ customerId, page, pageSize });
  }
}
