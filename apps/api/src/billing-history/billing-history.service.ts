import { BadRequestException } from '@nestjs/common';
import type { BillingHistoryEntryDto, BillingHistoryListResponse } from '@subzero/shared';

import type { BillingHistoryRepository } from './billing-history.types';

/** Жёсткое окно: 24 месяца (та же граница, что у backfill при создании подписки). */
const MAX_WINDOW_MS = 24 * 31 * 24 * 60 * 60 * 1000;

export class BillingHistoryService {
  constructor(private readonly repo: BillingHistoryRepository) {}

  async list(
    customerId: string,
    args: { from: string; to: string; projectSku?: string },
  ): Promise<BillingHistoryListResponse> {
    const from = new Date(args.from);
    const to = new Date(args.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('invalid from/to');
    }
    if (from >= to) {
      throw new BadRequestException('from must be before to');
    }
    if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
      throw new BadRequestException('range too wide (max 24 months)');
    }

    const items: BillingHistoryEntryDto[] = await this.repo.list({
      customerId,
      from,
      to,
      projectSku: args.projectSku,
    });
    return { items };
  }
}
