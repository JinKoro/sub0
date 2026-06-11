import { Locale } from '@subzero/shared';

import { renderTelegram, type UpcomingChargeTelegramContext } from './telegram-templates';

const BASE = 'http://localhost:3000';

const ctx: UpcomingChargeTelegramContext = {
  subscriptionPath: '/account/subscriptions/abc',
  serviceName: 'Netflix',
  amount: '500.00',
  currency: 'RUB',
  billingDate: '2026-06-14',
  daysBefore: 3,
  projectName: 'Personal',
};

describe('renderTelegram upcoming-charge', () => {
  it('RU, за 3 дня — название, сумма, проект, дата, ссылка', () => {
    const text = renderTelegram('upcoming-charge', Locale.RU, ctx, BASE);
    expect(text).toContain('Через 3 дня спишется Netflix');
    expect(text).toContain('14 июня 2026');
    expect(text).toContain('500.00 RUB');
    expect(text).toContain('проект «Personal»');
    expect(text).toContain('http://localhost:3000/account/subscriptions/abc');
  });

  it('RU, сегодня (daysBefore=0)', () => {
    const text = renderTelegram('upcoming-charge', Locale.RU, { ...ctx, daysBefore: 0 }, BASE);
    expect(text).toContain('Сегодня списание: Netflix');
  });

  it('EN, за 1 день — singular', () => {
    const text = renderTelegram('upcoming-charge', Locale.EN, { ...ctx, daysBefore: 1 }, BASE);
    expect(text).toContain('Netflix charges in 1 day');
    expect(text).not.toContain('1 days');
    expect(text).toContain('project "Personal"');
  });

  it('неизвестный template — бросает', () => {
    expect(() => renderTelegram('nope', Locale.RU, ctx, BASE)).toThrow(/unknown telegram template/);
  });
});
