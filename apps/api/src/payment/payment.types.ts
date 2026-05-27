import type { PaymentDto, PaymentListResponse } from '@subzero/shared';

export interface PaymentListArgs {
  customerId: string;
  page: number;
  pageSize: number;
}

export interface PaymentRepository {
  list(args: PaymentListArgs): Promise<PaymentListResponse>;
}

export type { PaymentDto };
