import type { BillingHistoryEntryDto } from '@subzero/shared';

export interface BillingHistoryListArgs {
  customerId: string;
  from: Date;
  to: Date;
  /** projectSku из API. Repo сам резолвит в project.id или возвращает [] если sku чужой. */
  projectSku?: string;
}

export interface BillingHistoryRepository {
  list(args: BillingHistoryListArgs): Promise<BillingHistoryEntryDto[]>;
}
