/** Запись из «История платежей» (Settings → Billing → InvoiceTable).
 *  `paidAt` соответствует `payment.created_at` (момент успешного списания
 *  у провайдера). `sku` — публичный номер счёта (`pay-XXXXXXXX`). */
export interface PaymentDto {
  sku: string;
  paidAt: string;
  paidPlanId: number;
  amount: string;
  currencyId: number;
  statusId: number;
}

export interface PaymentListQuery {
  page?: number;
  pageSize?: number;
}

export interface PaymentListResponse {
  items: PaymentDto[];
  total: number;
  page: number;
  pageSize: number;
}
