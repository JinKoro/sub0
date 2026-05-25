import { resolveCurrentPrice, type PromoLike } from './promo-resolver';

const now = new Date('2026-05-22T12:00:00Z');
const future = (days: number) => new Date(now.getTime() + days * 86400 * 1000);
const past = (days: number) => new Date(now.getTime() - days * 86400 * 1000);

describe('resolveCurrentPrice', () => {
  it('возвращает amount подписки при пустом списке promo', () => {
    expect(resolveCurrentPrice('500.00', [], now)).toEqual({ amount: '500.00', isPromo: false });
  });

  it('игнорирует промо с прошедшим ends_at', () => {
    const promos: PromoLike[] = [{ amount: '100.00', endsAt: past(1) }];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '500.00', isPromo: false });
  });

  it('выбирает активный промо', () => {
    const promos: PromoLike[] = [{ amount: '100.00', endsAt: future(5) }];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '100.00', isPromo: true });
  });

  it('из нескольких активных выбирает минимальный amount', () => {
    const promos: PromoLike[] = [
      { amount: '200.00', endsAt: future(10) },
      { amount: '50.00',  endsAt: future(5) },
      { amount: '150.00', endsAt: future(20) },
    ];
    expect(resolveCurrentPrice('500.00', promos, now)).toEqual({ amount: '50.00', isPromo: true });
  });
});
