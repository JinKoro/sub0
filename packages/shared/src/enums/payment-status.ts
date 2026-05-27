/** Статус платежа. PENDING — провайдер взял webhook, но ещё не
 *  подтвердил списание. SUCCEEDED — деньги пришли, тариф активирован.
 *  REFUNDED — возврат после успешного списания. */
export enum PaymentStatus {
  PENDING = 1,
  SUCCEEDED = 2,
  FAILED = 3,
  REFUNDED = 4,
}
