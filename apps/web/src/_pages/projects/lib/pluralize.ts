export function pluralizeSubs(n: number, lang: 'ru' | 'en'): string {
  if (lang === 'en') return n === 1 ? '1 subscription' : `${n} subscriptions`;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} подписка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} подписки`;
  return `${n} подписок`;
}
