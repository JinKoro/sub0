export interface PromoLike {
  amount: string;
  endsAt: Date;
}

export interface ResolvedPrice {
  amount: string;
  isPromo: boolean;
}

/** Текущая цена: минимальный amount среди активных промо, иначе subscription.amount. */
export function resolveCurrentPrice(
  subscriptionAmount: string,
  promos: PromoLike[],
  now: Date,
): ResolvedPrice {
  const active = promos.filter((p) => p.endsAt > now);
  if (active.length === 0) return { amount: subscriptionAmount, isPromo: false };
  const best = active.reduce((min, p) => (Number(p.amount) < Number(min.amount) ? p : min));
  return { amount: best.amount, isPromo: true };
}
