/** Провайдер платежа. MOCK — dev-окружение до подписания договоров
 *  с банком-эквайером (см. roadmap «Оплата»). */
export enum PaymentProvider {
  MOCK = 1,
  SBP = 2,
  TBANK = 3,
  SBER = 4,
  BEPAID = 5,
}
