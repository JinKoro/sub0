import { randomSubscriptionColor } from './subscription-color';

describe('randomSubscriptionColor', () => {
  it('всегда возвращает #RRGGBB из палитры SUB0', () => {
    const palette = new Set([
      '#1347ff',
      '#0a7a3f',
      '#c94a1c',
      '#6b21d9',
      '#b0851a',
      '#0a0a0a',
      '#6b6b66',
    ]);
    for (let i = 0; i < 200; i += 1) {
      const c = randomSubscriptionColor();
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
      expect(palette.has(c)).toBe(true);
    }
  });
});
